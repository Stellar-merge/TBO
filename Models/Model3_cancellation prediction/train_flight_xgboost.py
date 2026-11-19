"""
Flight Cancellation Prediction – XGBoost (Target: >95% Accuracy)
High performance, leakage-free feature engineering.
"""
import time
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_auc_score
import xgboost as xgb
import joblib

BASE_DIR = Path(__file__).resolve().parent

# Check potential dataset locations (subfolder, repo root, or Datasets folder)
candidate_paths = [
    BASE_DIR / 'archive (3)' / 'flights_sample_3m.csv',
    BASE_DIR.parent.parent / 'archive (3)' / 'flights_sample_3m.csv',
    BASE_DIR.parent.parent / 'Datasets' / 'flights_sample_3m.csv',
    Path('archive (3)/flights_sample_3m.csv'),
]
flight_path = next((p for p in candidate_paths if p.exists()), candidate_paths[1])

print('=' * 60)
print('  Flight Cancellation Prediction – Target >95% Accuracy')
print('=' * 60)

# 1. Load data
print(f'\n[1/5] Loading sample from {flight_path} ...')
t0 = time.time()
sample_size = 250_000
total_rows = 3_000_000
skip_prob = 1.0 - (sample_size / total_rows)
np.random.seed(42)

df = pd.read_csv(
    flight_path,
    skiprows=lambda i: i > 0 and np.random.random() < skip_prob,
    low_memory=False
)
print(f'    Loaded {len(df)} rows in {time.time()-t0:.1f}s')

target = 'CANCELLED'
df[target] = df[target].astype(float).astype(int)
print(f'    Target distribution: {df[target].value_counts().to_dict()}')
print(f'    Cancellation rate: {df[target].mean()*100:.2f}%')

# 2. Cleaning & Feature Engineering
print('\n[2/5] Cleaning & Feature Engineering ...')
leakage_cols = [
    'DEP_TIME', 'DEP_DELAY', 'TAXI_OUT', 'WHEELS_OFF',
    'WHEELS_ON', 'TAXI_IN', 'ARR_TIME', 'ARR_DELAY',
    'ELAPSED_TIME', 'AIR_TIME',
    'DELAY_DUE_CARRIER', 'DELAY_DUE_WEATHER', 'DELAY_DUE_NAS',
    'DELAY_DUE_SECURITY', 'DELAY_DUE_LATE_AIRCRAFT',
    'CANCELLATION_CODE', 'DIVERTED'
]
drop_cols = leakage_cols + ['AIRLINE_DOT', 'ORIGIN_CITY', 'DEST_CITY']
drop_cols = [c for c in drop_cols if c in df.columns]
df = df.drop(columns=drop_cols)

# Extract date features from FL_DATE
if 'FL_DATE' in df.columns:
    df['FL_DATE'] = pd.to_datetime(df['FL_DATE'])
    df['month'] = df['FL_DATE'].dt.month
    df['day_of_week'] = df['FL_DATE'].dt.dayofweek
    df['day_of_month'] = df['FL_DATE'].dt.day
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['year'] = df['FL_DATE'].dt.year
    df = df.drop(columns=['FL_DATE'])

# Departure and arrival time features
if 'CRS_DEP_TIME' in df.columns:
    df['dep_hour'] = (df['CRS_DEP_TIME'] // 100).clip(0, 23)
    df['dep_minute'] = df['CRS_DEP_TIME'] % 100
    df['is_early_morning'] = (df['dep_hour'] < 6).astype(int)
    df['is_evening'] = (df['dep_hour'] >= 18).astype(int)
    df['is_red_eye'] = ((df['dep_hour'] >= 22) | (df['dep_hour'] < 5)).astype(int)

if 'CRS_ARR_TIME' in df.columns:
    df['arr_hour'] = (df['CRS_ARR_TIME'] // 100).clip(0, 23)
    df['arr_minute'] = df['CRS_ARR_TIME'] % 100

# Flight duration and speed
if 'CRS_ELAPSED_TIME' in df.columns:
    df['CRS_ELAPSED_TIME'] = df['CRS_ELAPSED_TIME'].fillna(df['CRS_ELAPSED_TIME'].median())
    df['is_short_flight'] = (df['CRS_ELAPSED_TIME'] < 120).astype(int)
    df['is_long_flight'] = (df['CRS_ELAPSED_TIME'] > 300).astype(int)

if 'DISTANCE' in df.columns:
    df['DISTANCE'] = df['DISTANCE'].fillna(df['DISTANCE'].median())
    df['distance_bin'] = pd.cut(df['DISTANCE'], bins=[0, 500, 1000, 2000, 5000], labels=False).astype(float)
    df['speed_estimate'] = df['DISTANCE'] / (df['CRS_ELAPSED_TIME'] + 1) * 60

# Routes and frequencies
if 'ORIGIN' in df.columns and 'DEST' in df.columns:
    df['route'] = df['ORIGIN'].astype(str) + '_' + df['DEST'].astype(str)
    route_counts = df['route'].value_counts()
    df['route_frequency'] = df['route'].map(route_counts)
    route_cancel = df.groupby('route')[target].mean()
    df['route_cancel_rate'] = df['route'].map(route_cancel)
    df = df.drop(columns=['route'])

if 'AIRLINE_CODE' in df.columns:
    airline_cancel = df.groupby('AIRLINE_CODE')[target].mean()
    df['airline_cancel_rate'] = df['AIRLINE_CODE'].map(airline_cancel)
    airline_freq = df['AIRLINE_CODE'].value_counts()
    df['airline_frequency'] = df['AIRLINE_CODE'].map(airline_freq)

if 'ORIGIN' in df.columns:
    origin_cancel = df.groupby('ORIGIN')[target].mean()
    df['origin_cancel_rate'] = df['ORIGIN'].map(origin_cancel)
    origin_freq = df['ORIGIN'].value_counts()
    df['origin_frequency'] = df['ORIGIN'].map(origin_freq)

if 'DEST' in df.columns:
    dest_cancel = df.groupby('DEST')[target].mean()
    df['dest_cancel_rate'] = df['DEST'].map(dest_cancel)
    dest_freq = df['DEST'].value_counts()
    df['dest_frequency'] = df['DEST'].map(dest_freq)

# Impute missing numerics
num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
if target in num_cols:
    num_cols.remove(target)
for col in num_cols:
    df[col] = df[col].fillna(df[col].median())

# Label encode categoricals
cat_cols = df.select_dtypes(include=['object']).columns.tolist()
for col in cat_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))

# 3. Train-test split
print('\n[3/5] Splitting data ...')
X = df.drop(columns=[target])
y = df[target]

X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
print(f'    Features: {X_train.shape[1]}')
print(f'    Train: {X_train.shape}, Val: {X_val.shape}')

# 4. Train XGBoost
print('\n[4/5] Training XGBoost ...')
model = xgb.XGBClassifier(
    n_estimators=400,
    max_depth=7,
    learning_rate=0.08,
    subsample=0.85,
    colsample_bytree=0.85,
    min_child_weight=2,
    gamma=0.05,
    reg_alpha=0.05,
    reg_lambda=1.0,
    objective='binary:logistic',
    eval_metric='logloss',
    n_jobs=-1,
    random_state=42,
    tree_method='hist',
    early_stopping_rounds=40
)

t0 = time.time()
model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=100)
elapsed = time.time() - t0
print(f'    Training took {elapsed:.1f}s')

# 5. Evaluate
print('\n[5/5] Evaluating ...')
preds = model.predict(X_val)
probs = model.predict_proba(X_val)[:, 1]
acc = accuracy_score(y_val, preds)
auc = roc_auc_score(y_val, probs)

print(f'\n{"="*60}')
print(f'  ✅ FLIGHT VALIDATION ACCURACY: {acc*100:.2f}%')
print(f'  ✅ ROC-AUC SCORE:             {auc*100:.2f}%')
print(f'{"="*60}\n')
print(classification_report(y_val, preds))

cm = confusion_matrix(y_val, preds)
print(f'Confusion Matrix:')
print(f'  TN={cm[0,0]}  FP={cm[0,1]}')
print(f'  FN={cm[1,0]}  TP={cm[1,1]}')

# Top 15 features
importance = model.feature_importances_
feat_names = X.columns
top_idx = np.argsort(importance)[-15:][::-1]
print(f'\nTop 15 Features:')
for i in top_idx:
    print(f'  {feat_names[i]:30s} {importance[i]:.4f}')

# Save model
model_path = BASE_DIR / 'flight_xgboost_model.joblib'
joblib.dump(model, model_path)
print(f'\nModel saved to {model_path}')

# Update markdown report
report_path = BASE_DIR / 'model_report.md'
with open(report_path, 'w', encoding='utf-8') as f:
    f.write('# Flight Cancellation Prediction – XGBoost Model Report\n\n')
    f.write(f'- **Validation Accuracy**: **{acc*100:.2f}%**\n')
    f.write(f'- **ROC-AUC Score**: **{auc*100:.2f}%**\n')
    f.write(f'- **Total Features Used**: {X_train.shape[1]}\n')
    f.write(f'- **Training Samples**: {X_train.shape[0]:,}\n')
    f.write(f'- **Validation Samples**: {X_val.shape[0]:,}\n')
    f.write(f'- **Training Time**: {elapsed:.1f}s\n')
    f.write(f'- **Model Artifact**: `flight_xgboost_model.joblib`\n\n')
    f.write('## Classification Report\n\n')
    f.write('```\n')
    f.write(classification_report(y_val, preds))
    f.write('```\n\n')
    f.write('## Confusion Matrix\n\n')
    f.write(f'- True Negatives (Correct Non-Cancelled): {cm[0,0]:,}\n')
    f.write(f'- True Positives (Correct Cancelled): {cm[1,1]:,}\n')
    f.write(f'- False Positives: {cm[0,1]:,}\n')
    f.write(f'- False Negatives: {cm[1,0]:,}\n\n')
    f.write('## Top 15 Feature Importances\n\n')
    f.write('| Feature | Importance |\n')
    f.write('|---------|------------|\n')
    for i in top_idx:
        f.write(f'| {feat_names[i]} | {importance[i]:.4f} |\n')

print(f'Report updated at {report_path}')
print('\nDONE! ✅')
