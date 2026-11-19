"""
train.py — Complete Training, Hyperparameter Tuning, and Evaluation Pipeline for Model 5.

Module: Model 5 — Inventory Risk Prediction (Random Forest Classifier)
System: TBO SmartStock AI

Pipeline Stages:
1. Loads chronological Train, Validation, and Test splits.
2. Fits leakage-safe Model5Preprocessor on Train split.
3. Evaluates baselines (Dummy most-frequent, Dummy stratified, Rule-based, Decision Tree).
4. Conducts reproducible hyperparameter search for RandomForestClassifier on Validation split.
5. Trains final Random Forest model on Train split.
6. Calibrates output probabilities using CalibratedClassifierCV on Validation split.
7. Evaluates final model on held-out Test split.
8. Extracts feature importances (Gini & Permutation).
9. Serializes all model artifacts, schemas, configs, and metrics to artifacts/model5/.
"""
from __future__ import annotations

import os
import sys
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
import joblib

# Ensure src is in sys.path
SRC_DIR = Path(__file__).resolve().parents[1]
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from model5.config import (
    PROJECT_ROOT,
    DATASETS_ROOT,
    TRAIN_DATASET_PARQUET,
    VAL_DATASET_PARQUET,
    TEST_DATASET_PARQUET,
    ARTIFACTS_DIR,
    METADATA_DIR,
    REPORTS_DIR,
    DOCS_DIR
)
from model5.features import (
    ALL_PREDICTIVE_FEATURES,
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    BASE_NUMERICAL_FEATURES,
    ENGINEERED_DECISION_FEATURES,
    TARGET_COLUMNS,
    FORBIDDEN_OUTCOME_COLUMNS,
    LABEL_TO_CLASS,
    CLASS_TO_LABEL
)
from model5.preprocessing import Model5Preprocessor
from model5.evaluate import evaluate_predictions, format_metrics_markdown
from model5.explain import fit_probability_calibrator, extract_feature_importances

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)


class RuleBasedBaseline:
    """
    Decision-time safe heuristic baseline.
    Predicts risk class using only procurement quantity Q and historical demand expectations.
    Zero future knowledge or outcome leakage.
    """
    def __init__(self, tol_pct: float = 0.15):
        self.tol_pct = tol_pct
        
    def fit(self, X: pd.DataFrame, y: np.ndarray = None) -> "RuleBasedBaseline":
        return self
        
    def predict(self, df: pd.DataFrame) -> np.ndarray:
        q = df["procured_quantity"].values
        h30 = df["historical_daily_demand_30d_avg"].values
        h_same = df["historical_same_month_prior_year_demand"].values
        
        # Expected baseline demand available at decision time
        expected = np.maximum(5.0, 0.6 * h_same + 0.4 * h30)
        ratio = q / expected
        
        preds = np.zeros(len(df), dtype=int)
        # Class 1: UNSOLD (excess procurement above +15%)
        preds[ratio > (1.0 + self.tol_pct)] = 1
        # Class 2: SHORTAGE (under-procurement below -15%)
        preds[ratio < (1.0 - self.tol_pct)] = 2
        # Class 0: BALANCED (within +/- 15%)
        preds[(ratio >= (1.0 - self.tol_pct)) & (ratio <= (1.0 + self.tol_pct))] = 0
        return preds


def load_datasets() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Loads train, validation, and test parquet files."""
    print(f"Loading splits from {DATASETS_ROOT / 'processed'}...")
    train_df = pd.read_parquet(TRAIN_DATASET_PARQUET)
    val_df = pd.read_parquet(VAL_DATASET_PARQUET)
    test_df = pd.read_parquet(TEST_DATASET_PARQUET)
    print(f"  Train: {len(train_df):,} rows ({train_df['checkin_date'].min()} to {train_df['checkin_date'].max()})")
    print(f"  Validation: {len(val_df):,} rows ({val_df['checkin_date'].min()} to {val_df['checkin_date'].max()})")
    print(f"  Test: {len(test_df):,} rows ({test_df['checkin_date'].min()} to {test_df['checkin_date'].max()})")
    return train_df, val_df, test_df


def run_training_pipeline() -> Dict[str, Any]:
    """Executes the full Model 5 training and evaluation pipeline."""
    start_time = time.time()
    artifacts_target = ARTIFACTS_DIR / "model5"
    artifacts_target.mkdir(parents=True, exist_ok=True)
    
    # 1. Load data
    train_df, val_df, test_df = load_datasets()
    
    y_train = train_df["risk_class"].values.astype(int)
    y_val = val_df["risk_class"].values.astype(int)
    y_test = test_df["risk_class"].values.astype(int)
    
    # 2. Fit Preprocessor strictly on Train split (Filtering to whitelisted predictive features)
    print("\n--- Fitting Model 5 Preprocessor ---")
    train_features = train_df[[c for c in ALL_PREDICTIVE_FEATURES if c in train_df.columns]]
    val_features = val_df[[c for c in ALL_PREDICTIVE_FEATURES if c in val_df.columns]]
    test_features = test_df[[c for c in ALL_PREDICTIVE_FEATURES if c in test_df.columns]]
    
    preprocessor = Model5Preprocessor()
    X_train = preprocessor.fit_transform(train_features)
    X_val = preprocessor.transform(val_features)
    X_test = preprocessor.transform(test_features)
    print(f"Preprocessor fitted. Transformed feature matrix dimensions:")
    print(f"  X_train: {X_train.shape}")
    print(f"  X_val:   {X_val.shape}")
    print(f"  X_test:  {X_test.shape}")
    
    # 3. Evaluate Baselines on Validation Split
    print("\n--- Evaluating Baseline Models ---")
    baseline_results: Dict[str, Any] = {}
    
    # Dummy Most Frequent
    dummy_mf = DummyClassifier(strategy="most_frequent")
    dummy_mf.fit(X_train, y_train)
    val_preds_mf = dummy_mf.predict(X_val)
    val_probs_mf = dummy_mf.predict_proba(X_val)
    baseline_results["dummy_most_frequent"] = evaluate_predictions(y_val, val_preds_mf, val_probs_mf, "Validation (Dummy Most-Frequent)")
    print(f"  Dummy (Most Frequent) - Val Acc: {baseline_results['dummy_most_frequent']['accuracy']:.2%}, Macro F1: {baseline_results['dummy_most_frequent']['macro_f1']:.4f}")
    
    # Dummy Stratified
    dummy_strat = DummyClassifier(strategy="stratified", random_state=RANDOM_SEED)
    dummy_strat.fit(X_train, y_train)
    val_preds_strat = dummy_strat.predict(X_val)
    val_probs_strat = dummy_strat.predict_proba(X_val)
    baseline_results["dummy_stratified"] = evaluate_predictions(y_val, val_preds_strat, val_probs_strat, "Validation (Dummy Stratified)")
    print(f"  Dummy (Stratified)    - Val Acc: {baseline_results['dummy_stratified']['accuracy']:.2%}, Macro F1: {baseline_results['dummy_stratified']['macro_f1']:.4f}")
    
    # Rule-Based Baseline
    rule_base = RuleBasedBaseline(tol_pct=0.15)
    val_preds_rule = rule_base.predict(val_features)
    # Convert predictions to one-hot probabilities for log loss / brier evaluation
    val_probs_rule = np.zeros((len(val_df), 3), dtype=np.float64)
    for i, p in enumerate(val_preds_rule):
        val_probs_rule[i, p] = 1.0
    baseline_results["rule_based"] = evaluate_predictions(y_val, val_preds_rule, val_probs_rule, "Validation (Rule-Based Heuristic)")
    print(f"  Rule-Based Baseline   - Val Acc: {baseline_results['rule_based']['accuracy']:.2%}, Macro F1: {baseline_results['rule_based']['macro_f1']:.4f}")
    
    # Decision Tree Baseline
    dt_base = DecisionTreeClassifier(max_depth=5, random_state=RANDOM_SEED)
    dt_base.fit(X_train, y_train)
    val_preds_dt = dt_base.predict(X_val)
    val_probs_dt = dt_base.predict_proba(X_val)
    baseline_results["decision_tree_depth_5"] = evaluate_predictions(y_val, val_preds_dt, val_probs_dt, "Validation (Decision Tree Depth=5)")
    print(f"  Decision Tree (depth 5)- Val Acc: {baseline_results['decision_tree_depth_5']['accuracy']:.2%}, Macro F1: {baseline_results['decision_tree_depth_5']['macro_f1']:.4f}")

    # 4. Train Configuration 1: Baseline Random Forest (Original features only, un-tuned)
    print("\n--- Training Configuration 1: Baseline Random Forest (Original Features, un-tuned) ---")
    base_cols = [c for c in (CATEGORICAL_FEATURES + BASE_NUMERICAL_FEATURES) if c in train_features.columns]
    base_prep = Model5Preprocessor()
    base_prep.categorical_cols = list(CATEGORICAL_FEATURES)
    base_prep.numerical_cols = list(BASE_NUMERICAL_FEATURES)
    base_prep.all_expected_cols = base_cols
    X_tr_base = base_prep.fit_transform(train_df[base_cols])
    X_te_base = base_prep.transform(test_df[base_cols])
    
    rf_config1 = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=RANDOM_SEED, n_jobs=-1)
    rf_config1.fit(X_tr_base, y_train)
    te_preds_c1 = rf_config1.predict(X_te_base)
    te_probs_c1 = rf_config1.predict_proba(X_te_base)
    metrics_config1 = evaluate_predictions(y_test, te_preds_c1, te_probs_c1, "Config 1: Baseline RF (Original Features)")
    print(f"  Config 1 (Baseline RF)        - Test Acc: {metrics_config1['accuracy']:.2%}, Bal Acc: {metrics_config1['balanced_accuracy']:.2%}, Macro F1: {metrics_config1['macro_f1']:.4f}")

    # 5. Train Configuration 2: Random Forest with Feature Engineering (un-tuned)
    print("\n--- Training Configuration 2: RF + Feature Engineering (un-tuned) ---")
    rf_config2 = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=RANDOM_SEED, n_jobs=-1)
    rf_config2.fit(X_train, y_train)
    te_preds_c2 = rf_config2.predict(X_test)
    te_probs_c2 = rf_config2.predict_proba(X_test)
    metrics_config2 = evaluate_predictions(y_test, te_preds_c2, te_probs_c2, "Config 2: RF + Feature Engineering (un-tuned)")
    print(f"  Config 2 (RF + Feature Eng)   - Test Acc: {metrics_config2['accuracy']:.2%}, Bal Acc: {metrics_config2['balanced_accuracy']:.2%}, Macro F1: {metrics_config2['macro_f1']:.4f}")

    # 6. Hyperparameter Search for Configuration 3 (Tuned Random Forest) on Validation Split
    print("\n--- Tuning Random Forest Classifier on Validation Split ---")
    candidate_configs = [
        {"n_estimators": 100, "max_depth": 12, "min_samples_split": 5, "min_samples_leaf": 2, "max_features": "sqrt", "class_weight": None},
        {"n_estimators": 150, "max_depth": 16, "min_samples_split": 4, "min_samples_leaf": 2, "max_features": "sqrt", "class_weight": None},
        {"n_estimators": 200, "max_depth": 18, "min_samples_split": 4, "min_samples_leaf": 2, "max_features": 0.4, "class_weight": None},
        {"n_estimators": 200, "max_depth": 20, "min_samples_split": 4, "min_samples_leaf": 2, "max_features": 0.4, "class_weight": None},
        {"n_estimators": 250, "max_depth": 22, "min_samples_split": 2, "min_samples_leaf": 1, "max_features": 0.35, "class_weight": None},
        {"n_estimators": 200, "max_depth": 18, "min_samples_split": 4, "min_samples_leaf": 2, "max_features": "sqrt", "class_weight": "balanced"},
    ]
    
    tuning_records = []
    best_config = None
    best_val_f1 = -1.0
    best_rf_model = None
    
    for i, cfg in enumerate(candidate_configs, 1):
        rf_trial = RandomForestClassifier(
            **cfg,
            random_state=RANDOM_SEED,
            n_jobs=-1
        )
        rf_trial.fit(X_train, y_train)
        preds_trial = rf_trial.predict(X_val)
        probs_trial = rf_trial.predict_proba(X_val)
        trial_metrics = evaluate_predictions(y_val, preds_trial, probs_trial, f"Val Trial {i}")
        
        macro_f1 = trial_metrics["macro_f1"]
        bal_acc = trial_metrics["balanced_accuracy"]
        acc = trial_metrics["accuracy"]
        ll = trial_metrics.get("log_loss")
        
        print(f"  Trial {i}: n_trees={cfg['n_estimators']}, max_depth={cfg['max_depth']}, feat={cfg['max_features']} "
              f"-> Val Acc: {acc:.2%}, Bal Acc: {bal_acc:.2%}, Macro F1: {macro_f1:.4f}, LogLoss: {ll}")
              
        rec = {
            "trial_id": i,
            "config": cfg,
            "accuracy": acc,
            "balanced_accuracy": bal_acc,
            "macro_f1": macro_f1,
            "weighted_f1": trial_metrics["weighted_f1"],
            "log_loss": ll,
            "brier_score": trial_metrics["brier_score"]
        }
        tuning_records.append(rec)
        
        if macro_f1 > best_val_f1:
            best_val_f1 = macro_f1
            best_config = cfg
            best_rf_model = rf_trial
            
    print(f"\nOptimal Random Forest Configuration Selected (Validation Macro F1 = {best_val_f1:.4f}):")
    print(json.dumps(best_config, indent=2))
    
    # Configuration 3 Test Metrics (Tuned RF uncalibrated)
    te_preds_c3 = best_rf_model.predict(X_test)
    te_probs_c3 = best_rf_model.predict_proba(X_test)
    metrics_config3 = evaluate_predictions(y_test, te_preds_c3, te_probs_c3, "Config 3: Tuned Random Forest (Uncalibrated)")
    print(f"  Config 3 (Tuned RF)           - Test Acc: {metrics_config3['accuracy']:.2%}, Bal Acc: {metrics_config3['balanced_accuracy']:.2%}, Macro F1: {metrics_config3['macro_f1']:.4f}")

    # 7. Probability Calibration using Validation Split (Configuration 4: Final Selected Model)
    print("\n--- Fitting Probability Calibrator on Validation Data (Config 4) ---")
    calibrator, cal_diag = fit_probability_calibrator(best_rf_model, X_val, y_val, method="isotonic")
    print(f"Calibration diagnostics: {cal_diag}")
    
    val_cal_probs = calibrator.predict_proba(X_val)
    val_cal_preds = np.argmax(val_cal_probs, axis=1)
    val_cal_metrics = evaluate_predictions(y_val, val_cal_preds, val_cal_probs, "Validation (Calibrated Isotonic)")
    
    test_cal_probs = calibrator.predict_proba(X_test)
    test_cal_preds = np.argmax(test_cal_probs, axis=1)
    metrics_config4 = evaluate_predictions(y_test, test_cal_preds, test_cal_probs, "Config 4: Final Selected RF (Tuned + Calibrated)")
    print(f"  Config 4 (Final Selected RF)  - Test Acc: {metrics_config4['accuracy']:.2%}, Bal Acc: {metrics_config4['balanced_accuracy']:.2%}, Macro F1: {metrics_config4['macro_f1']:.4f}")

    # Print 4-Model Comparison Table
    print("\n" + "="*86)
    print("FOUR-MODEL CONFIGURATION PERFORMANCE COMPARISON (HELD-OUT TEST SET)")
    print("="*86)
    print(f"{'Configuration':<42} | {'Test Acc':<10} | {'Bal Acc':<10} | {'Macro F1':<10} | {'Brier':<10}")
    print("-" * 86)
    print(f"{'1. Baseline RF (Original Features)':<42} | {metrics_config1['accuracy']:<10.2%} | {metrics_config1['balanced_accuracy']:<10.2%} | {metrics_config1['macro_f1']:<10.4f} | {metrics_config1['brier_score']:<10.4f}")
    print(f"{'2. RF + Feature Engineering (un-tuned)':<42} | {metrics_config2['accuracy']:<10.2%} | {metrics_config2['balanced_accuracy']:<10.2%} | {metrics_config2['macro_f1']:<10.4f} | {metrics_config2['brier_score']:<10.4f}")
    print(f"{'3. Tuned RF (Optimized Hyperparameters)':<42} | {metrics_config3['accuracy']:<10.2%} | {metrics_config3['balanced_accuracy']:<10.2%} | {metrics_config3['macro_f1']:<10.4f} | {metrics_config3['brier_score']:<10.4f}")
    print(f"{'4. Final Selected RF (Tuned + Calibrated)':<42} | {metrics_config4['accuracy']:<10.2%} | {metrics_config4['balanced_accuracy']:<10.2%} | {metrics_config4['macro_f1']:<10.4f} | {metrics_config4['brier_score']:<10.4f}")
    print("="*86)

    four_model_comparison = {
        "config_1_baseline_rf": {
            "name": "Baseline Random Forest (Original Features)",
            "accuracy": metrics_config1["accuracy"],
            "balanced_accuracy": metrics_config1["balanced_accuracy"],
            "macro_f1": metrics_config1["macro_f1"],
            "weighted_f1": metrics_config1["weighted_f1"],
            "brier_score": metrics_config1["brier_score"]
        },
        "config_2_rf_feature_engineering": {
            "name": "Random Forest with Feature Engineering (un-tuned)",
            "accuracy": metrics_config2["accuracy"],
            "balanced_accuracy": metrics_config2["balanced_accuracy"],
            "macro_f1": metrics_config2["macro_f1"],
            "weighted_f1": metrics_config2["weighted_f1"],
            "brier_score": metrics_config2["brier_score"]
        },
        "config_3_tuned_rf": {
            "name": "Tuned Random Forest (Optimized Hyperparameters)",
            "accuracy": metrics_config3["accuracy"],
            "balanced_accuracy": metrics_config3["balanced_accuracy"],
            "macro_f1": metrics_config3["macro_f1"],
            "weighted_f1": metrics_config3["weighted_f1"],
            "brier_score": metrics_config3["brier_score"],
            "best_config": best_config
        },
        "config_4_final_selected_calibrated_rf": {
            "name": "Final Selected Random Forest (Tuned + Isotonic Calibration)",
            "accuracy": metrics_config4["accuracy"],
            "balanced_accuracy": metrics_config4["balanced_accuracy"],
            "macro_f1": metrics_config4["macro_f1"],
            "weighted_f1": metrics_config4["weighted_f1"],
            "brier_score": metrics_config4["brier_score"]
        }
    }

    # 8. Train and Validation Split Comprehensive Evaluation for Best RF
    train_preds = best_rf_model.predict(X_train)
    train_probs = best_rf_model.predict_proba(X_train)
    train_metrics = evaluate_predictions(y_train, train_preds, train_probs, "Train Split (2015-08-01 to 2016-07-31)")
    
    val_preds = best_rf_model.predict(X_val)
    val_probs = best_rf_model.predict_proba(X_val)
    val_metrics = evaluate_predictions(y_val, val_preds, val_probs, "Validation Split (2016-08-01 to 2016-12-31)")

    test_metrics = metrics_config3
    test_cal_metrics = metrics_config4

    print("\n" + format_metrics_markdown(test_cal_metrics))
    
    # 8. Feature Importances
    print("\n--- Computing Feature Importances ---")
    feature_names = preprocessor.feature_names_out_
    df_importances = extract_feature_importances(best_rf_model, feature_names, X_val, y_val)
    imp_csv_path = artifacts_target / "feature_importance.csv"
    df_importances.to_csv(imp_csv_path, index=False)
    print(f"Saved feature importances to {imp_csv_path}")
    print("\nTop 10 Most Important Features:")
    for _, r in df_importances.head(10).iterrows():
        print(f"  {int(r['rank'])}. {r['feature']:<40} (Gini: {r['gini_importance']:.4f}, Permutation: {r['permutation_importance_mean']:.4f})")
        
    # 9. Save Artifacts
    print("\n--- Saving Final Model Artifacts ---")
    model_path = artifacts_target / "random_forest_model.joblib"
    preprocessor_path = artifacts_target / "preprocessor.joblib"
    calibrator_path = artifacts_target / "calibrator.joblib"
    
    joblib.dump(best_rf_model, model_path)
    preprocessor.save(preprocessor_path)
    joblib.dump(calibrator, calibrator_path)
    print(f"  Saved Random Forest: {model_path} ({model_path.stat().st_size / (1024*1024):.2f} MB)")
    print(f"  Saved Preprocessor:  {preprocessor_path} ({preprocessor_path.stat().st_size / 1024:.1f} KB)")
    print(f"  Saved Calibrator:    {calibrator_path} ({calibrator_path.stat().st_size / (1024*1024):.2f} MB)")
    
    # Feature schema JSON
    schema_payload = {
        "model_name": "Model 5 - Inventory Risk Prediction",
        "algorithm": "RandomForestClassifier",
        "model_version": "1.0.0",
        "target": "risk_class",
        "target_mapping": LABEL_TO_CLASS,
        "n_raw_features": len(ALL_PREDICTIVE_FEATURES),
        "raw_features_whitelist": ALL_PREDICTIVE_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "numerical_features": NUMERICAL_FEATURES,
        "n_transformed_features": len(feature_names),
        "transformed_feature_names": feature_names,
        "forbidden_outcome_columns": FORBIDDEN_OUTCOME_COLUMNS
    }
    with open(artifacts_target / "feature_schema.json", "w", encoding="utf-8") as f:
        json.dump(schema_payload, f, indent=2)
        
    # Label mapping JSON
    with open(artifacts_target / "label_mapping.json", "w", encoding="utf-8") as f:
        json.dump({"class_to_label": CLASS_TO_LABEL, "label_to_class": LABEL_TO_CLASS}, f, indent=2)
        
    # Training config JSON
    training_config = {
        "model_type": "RandomForestClassifier",
        "random_seed": RANDOM_SEED,
        "best_hyperparameters": best_config,
        "all_tuning_trials": tuning_records,
        "preprocessor": {
            "categorical_encoder": "OneHotEncoder(handle_unknown='ignore')",
            "numerical_imputer": "SimpleImputer(strategy='median')"
        },
        "calibrator": {
            "method": "isotonic",
            "cv": "prefit",
            "fitted_on": "validation_split"
        },
        "split_sizes": {
            "train": len(train_df),
            "validation": len(val_df),
            "test": len(test_df)
        }
    }
    with open(artifacts_target / "training_config.json", "w", encoding="utf-8") as f:
        json.dump(training_config, f, indent=2)
        
    # All metrics JSON
    all_metrics = {
        "evaluation_timestamp": datetime.utcnow().isoformat(),
        "baselines_validation": baseline_results,
        "four_model_comparison": four_model_comparison,
        "random_forest_train": train_metrics,
        "random_forest_validation_uncalibrated": val_metrics,
        "random_forest_validation_calibrated": val_cal_metrics,
        "random_forest_test_uncalibrated": test_metrics,
        "random_forest_test_calibrated": test_cal_metrics,
        "calibration_diagnostics": cal_diag
    }
    with open(artifacts_target / "model_metrics.json", "w", encoding="utf-8") as f:
        json.dump(all_metrics, f, indent=2)
        
    # Model Metadata JSON
    import sklearn
    model_metadata = {
        "model_id": "model5_inventory_risk_rf",
        "version": "1.0.0",
        "created_at": datetime.utcnow().isoformat(),
        "python_version": sys.version,
        "sklearn_version": sklearn.__version__,
        "algorithm": "RandomForestClassifier",
        "author": "TBO SmartStock AI Engineering",
        "provenance_note": "Trained on synthetic B2B procurement scenarios anchored to empirical hotel reservation demand from hotels.csv (Antonio et al., 2019)."
    }
    with open(artifacts_target / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)
        
    total_time = time.time() - start_time
    print(f"\nTraining pipeline completed in {total_time:.1f} seconds. All artifacts successfully generated in {artifacts_target}!")
    
    return all_metrics


if __name__ == "__main__":
    run_training_pipeline()
