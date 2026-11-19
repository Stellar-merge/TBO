# Model 5: Training Lifecycle Report

**System**: TBO SmartStock AI  
**Module**: Model 5 — Inventory Risk Prediction  
**Algorithm**: Scikit-Learn `RandomForestClassifier` with Isotonic Probability Calibration  
**Execution Timestamp**: November 2026  
**Random Seed**: `42` (Fixed for full reproducibility)  
**Status**: High-Accuracy Architecture (> 92% Test Accuracy Achieved)  

---

## 1. Executive Summary

This report documents the end-to-end training, feature engineering, baseline benchmarking, hyperparameter optimization, and probability calibration of Model 5. Model 5 is trained to predict whether prospective B2B hotel room procurement opportunities will result in `BALANCED (0)`, `UNSOLD (1)`, or `SHORTAGE (2)` inventory outcomes.

Training was conducted strictly on the chronological Training Split (10,904 records from July 31, 2015 to July 31, 2016), tuned against the Validation Split (4,896 records from August 1, 2016 to December 31, 2016), and evaluated on the held-out Test Split (7,776 records from January 1, 2017 to August 31, 2017).

---

## 2. Dataset Partitioning & Preprocessing

| Partition | Date Window | Total Records | Share (%) | UNSOLD % | SHORTAGE % | BALANCED % |
|---|---|---|---|---|---|---|
| **Train** | 2015-07-31 to 2016-07-31 | 10,904 | 46.3% | 40.5% | 39.8% | 19.7% |
| **Validation** | 2016-08-01 to 2016-12-31 | 4,896 | 20.8% | 42.0% | 38.0% | 20.0% |
| **Test** | 2017-01-01 to 2017-08-31 | 7,776 | 33.0% | 43.8% | 34.7% | 21.5% |

- **Zero-Lookahead Guarantee**: Preprocessor fitted solely on the Training partition.
- **Categorical Encoding**: `OneHotEncoder(handle_unknown='ignore')` applied to 5 categorical features, yielding 13 binary indicator features.
- **Numerical Imputation**: `SimpleImputer(strategy='median')` applied to 54 numerical features (33 baseline + 21 engineered decision features) using training medians.
- **Transformed Feature Matrix**: 67 columns, zero null values, zero data leakage.

---

## 3. Four-Model Configuration Comparison (Held-Out Test Set)

To systematically elevate accuracy beyond the 90% benchmark, four configurations were benchmarked:

| Model Configuration | Test Accuracy | Balanced Accuracy | Macro F1 | Weighted F1 | Brier Score |
|---|---|---|---|---|---|
| **1. Baseline RF (Original Features, un-tuned)** | 85.71% | 80.52% | 0.8119 | 0.8570 | 0.2577 |
| **2. RF + Feature Engineering (un-tuned)** | **92.37%** | **90.66%** | **0.9079** | **0.9236** | **0.1119** |
| **3. Tuned RF (Optimized Hyperparameters)** | **92.13%** | **91.47%** | **0.9085** | **0.9213** | **0.1149** |
| **4. Final Selected RF (Tuned + Calibrated)** | **92.34%** | **90.74%** | **0.9078** | **0.9233** | **0.1122** |

---

## 4. Hyperparameter Search on Validation Split

Six candidate configurations were evaluated on the Validation Split:

| Trial | `n_estimators` | `max_depth` | `min_samples_split` | `min_samples_leaf` | `max_features` | `class_weight` | Val Acc | Val Bal Acc | Val Macro F1 | Val Log Loss |
|---|---|---|---|---|---|---|---|---|---|---|
| **Trial 1** | 100 | 12 | 5 | 2 | `'sqrt'` | `None` | 91.83% | 90.36% | 0.9036 | 0.1894 |
| **Trial 2** | 150 | 16 | 4 | 2 | `'sqrt'` | `None` | 92.03% | 90.63% | 0.9061 | 0.1886 |
| **Trial 3** | 200 | 18 | 4 | 2 | 0.40 | `None` | 91.97% | 90.61% | 0.9056 | 0.2050 |
| **Trial 4** | 200 | 20 | 4 | 2 | 0.40 | `None` | 92.03% | 90.62% | 0.9061 | 0.2045 |
| **Trial 5** | 250 | 22 | 2 | 1 | 0.35 | `None` | 92.01% | 90.80% | 0.9066 | 0.2180 |
| **Trial 6 (SELECTED)** | **200** | **18** | **4** | **2** | `'sqrt'` | `'balanced'` | **91.89%** | **91.44%** | **0.9077** | **0.1929** |

**Selection Rationale**: Trial 6 achieved the highest Balanced Accuracy (91.44%) and Macro F1 (0.9077) on the validation split by using `'balanced'` class weighting, preventing marginal under-representation of the minority BALANCED class.

---

## 5. Probability Calibration (Isotonic via FrozenEstimator)

- **Calibrator**: `CalibratedClassifierCV(FrozenEstimator(best_rf), method='isotonic')` fitted strictly on Validation split.
- **Brier Score Validation**: Reduced from `0.11549` (raw) to `0.10987` (calibrated) — a improvement of `0.00562`.
- **Brier Score Test**: `0.1122` (calibrated).
- **Probability Guarantee**: Calibrated probabilities sum to $1.0 \pm 10^{-4}$ and provide smooth monotonic risk confidence.

---

## 6. Artifact Serialization

The final training pipeline generated all model artifacts in `artifacts/model5/`:
- `random_forest_model.joblib`: Trained Random Forest model (13.13 MB)
- `preprocessor.joblib`: Fitted Model5Preprocessor (6.8 KB)
- `calibrator.joblib`: Fitted Isotonic Calibrator (13.14 MB)
- `feature_importance.csv`: Ranked Gini & Permutation importances
- `feature_schema.json`: Complete 59-feature schema contract
- `label_mapping.json`: Class-to-label mapping dictionary
- `training_config.json`: Complete training parameters and split sizes
- `model_metrics.json`: Executed metric values and 4-model comparison table
