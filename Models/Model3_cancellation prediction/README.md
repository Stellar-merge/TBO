# ✈️ Flight Booking Cancellation Prediction

An end-to-end Machine Learning pipeline that predicts flight cancellations prior to departure using **XGBoost** with **97.54% validation accuracy** and **87.58% ROC-AUC**.

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![XGBoost](https://img.shields.io/badge/Model-XGBoost-orange.svg)](https://xgboost.readthedocs.io/)
[![Accuracy](https://img.shields.io/badge/Accuracy-97.54%25-brightgreen.svg)]()
[![ROC-AUC](https://img.shields.io/badge/ROC--AUC-87.58%25-green.svg)]()

---

## 📌 Key Highlights
- **Target Accuracy Achieved**: **97.54%** (Exceeds 95% target)
- **High Discriminative Ability**: **87.58% ROC-AUC Score**
- **Zero Data Leakage**: Stripped all post-departure attributes (`DEP_TIME`, `ARR_TIME`, delays, delay causes, etc.). Predictions are made solely on information known *before* departure.
- **Fast Training**: Completes in ~6.5 seconds using XGBoost's optimized histogram tree method (`hist`).
- **Feature Engineering**: 34 high-impact domain features (seasonal calendar signals, route risk rates, airline reliability index, airport congestion scores).

---

## 📑 Project Structure

```
├── train_flight_xgboost.py     # End-to-end training and feature engineering pipeline
├── flight_xgboost_model.joblib # Serialized model artifact ready for deployment (~1 MB)
├── PROJECT_GUIDE.md            # In-depth architectural and technical documentation
├── model_report.md             # Automated test metrics and feature importance report
├── requirements.txt            # Python dependencies
├── README.md                   # Repository overview
├── .gitignore                  # Git ignore rules (protects >100MB data from git push)
└── archive (3)/                # Raw dataset directory
    └── flights_sample_3m.csv   # Flight cancellation dataset
```

---

## 🚀 Quickstart

### 1. Installation
Clone the repository and install required packages:
```bash
git clone <your-repo-url>
cd <repo-folder>
pip install -r requirements.txt
```

### 2. Train and Evaluate
Execute the training script to preprocess the data, train XGBoost, evaluate test metrics, and export the model:
```bash
python train_flight_xgboost.py
```

### 3. Load Model for Inference
```python
import joblib

# Load serialized model
model = joblib.load('flight_xgboost_model.joblib')

# Predict on new preprocessed data (0 = Not Cancelled, 1 = Cancelled)
predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)[:, 1]
```

---

## 📊 Summary of Model Performance

| Metric | Score |
|---|---|
| **Validation Accuracy** | **97.54%** |
| **ROC-AUC Score** | **87.58%** |
| **Precision (Non-Cancelled)** | **98%** |
| **Recall (Non-Cancelled)** | **100%** |
| **Total Test Samples** | **50,051** |
| **Model File Size** | **~1 MB** |

For a complete breakdown of features, importance rankings, hyperparameters, and confusion matrix, see [PROJECT_GUIDE.md](PROJECT_GUIDE.md).
