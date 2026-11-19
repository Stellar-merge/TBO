# Model 5: Inventory Risk Prediction — TBO SmartStock AI

**Module**: Hotel Inventory Procurement Risk Classification  
**Algorithm**: Scikit-Learn `RandomForestClassifier` with Isotonic Probability Calibration  
**Status**: **PRODUCTION-READY FOR FRONTEND INTEGRATION**  
**Test Suite**: 15 / 15 Automated Tests Passed (100% Coverage)  

---

## 1. Overview & Business Objective

Model 5 is a central machine learning module within **TBO SmartStock AI**. It evaluates prospective hotel room allotment procurement opportunities $(property, destination, supplier, checkin\_date, T_{decision})$ and predicts operational risk before committing wholesaler capital:

| Class ID | Target Label | Operational Definition | Consequence |
|---|---|---|---|
| **0** | **BALANCED** | Realized net demand aligns within $\pm 15\%$ ($\ge 3$ rooms) of procured inventory | Optimal room turnover and target gross margins |
| **1** | **UNSOLD** | Procured room inventory exceeds realized demand by $> 15\%$ | Severe margin erosion from distressed liquidation or unsold committed rooms |
| **2** | **SHORTAGE** | Procured room inventory falls short of realized demand by $> 15\%$ | Lost wholesale revenue and uncaptured market demand |

---

## 2. Workspace & Architecture Layout

```
D:\Competition\Voyage_Hack\
├── Datasets\
│   └── Datasets_Model5\            <-- Pure Data Store (Raw, Interim, Processed)
└── Model5_Inventory_Risk\          <-- Code, Config, Docs, Reports, Metadata, Artifacts
```

### Project Directory Layout (`Model5_Inventory_Risk`)
```
Model5_Inventory_Risk/
├── artifacts/
│   └── model5/
│       ├── random_forest_model.joblib # Trained Random Forest ensemble (22.45 MB)
│       ├── preprocessor.joblib        # Fitted OneHotEncoder & SimpleImputer (5.6 KB)
│       ├── calibrator.joblib          # Isotonic probability calibrator (22.45 MB)
│       ├── feature_schema.json        # Complete feature contract & whitelist
│       ├── label_mapping.json         # Numeric class to label mappings
│       ├── model_metrics.json         # Executed evaluation metrics for all splits
│       ├── feature_importance.csv     # Gini & permutation feature importances
│       ├── training_config.json       # Hyperparameters & split sizes
│       └── model_metadata.json        # Python, scikit-learn versions & provenance
├── config/
│   └── (Configuration files)
├── docs/
│   ├── model_card.md                  # Comprehensive AI model card
│   ├── feature_contract.md            # Whitelist, blacklist, & leakage safeguards
│   ├── api_documentation.md           # Endpoint schemas, curl commands & swagger
│   ├── model5_data_dictionary.md      # Detailed column definitions & types
│   └── reports/                       # Technical reports & evaluation audits
│       ├── training_report.md
│       ├── model_evaluation_report.md
│       ├── feature_importance_report.md
│       ├── probability_calibration_report.md
│       ├── final_validation_report.md
│       ├── data_quality_report.md
│       ├── dataset_discovery_report.md
│       ├── dataset_split_report.md
│       ├── feature_leakage_audit.md
│       └── target_construction_report.md
├── logs/                              # Pipeline & execution logs
├── metadata/                          # Project metadata manifests & audit JSONs
├── scripts/                           # Reproducible pipeline scripts
│   ├── audit_datasets.py              # Candidate dataset audit script
│   ├── build_model5_dataset.py        # End-to-end dataset builder & splitter
│   └── generate_reports.py            # Phase I report generator
├── src/
│   └── model5/                        # Modular package
│       ├── __init__.py
│       ├── config.py                  # Portable path resolver
│       ├── features.py                # Whitelist, blacklist, & safety guards
│       ├── preprocessing.py           # Leakage-safe Model5Preprocessor
│       ├── train.py                   # Model training & hyperparameter search
│       ├── evaluate.py                # Multiclass evaluation metric suite
│       ├── explain.py                 # Calibration, importances & RiskExplainer
│       ├── predict.py                 # Stable Model5Predictor interface
│       └── api.py                     # Standalone FastAPI service
├── tests/                             # Comprehensive automated test suite
│   ├── test_dataset.py                # Dataset integrity & split tests
│   ├── test_leakage.py                # Leakage & zero-lookahead tests
│   ├── test_model.py                  # Predictor & probability tests
│   └── test_api.py                    # FastAPI endpoint tests
├── README.md                          # Main project guide
├── config.yaml                        # Portable paths & hyperparameter config
└── requirements.txt                   # Dependencies
```

---

## 3. Evaluated Performance Summary

Evaluated on 7,776 held-out test records (January to August 2017) using strictly decision-time available features:

### Four-Model Performance Comparison (Held-Out Test Set)

| Model Configuration | Test Accuracy | Balanced Accuracy | Macro F1 | Weighted F1 | Brier Score |
|---|---|---|---|---|---|
| **1. Baseline RF (Original Features, un-tuned)** | 85.71% | 80.52% | 0.8119 | 0.8570 | 0.2577 |
| **2. RF + Feature Engineering (un-tuned)** | **92.37%** | **90.66%** | **0.9079** | **0.9236** | **0.1119** |
| **3. Tuned RF (Optimized Hyperparameters)** | **92.13%** | **91.47%** | **0.9085** | **0.9213** | **0.1149** |
| **4. Final Selected RF (Tuned + Calibrated)** | **92.34%** | **90.74%** | **0.9078** | **0.9233** | **0.1122** |

### Per-Class Test Performance (Final Selected Model):
- **`UNSOLD (1)`**: Precision = 94.96%, Recall = 95.65%, **F1-Score = 0.9530**
- **`SHORTAGE (2)`**: Precision = 95.26%, Recall = 94.52%, **F1-Score = 0.9489**
- **`BALANCED (0)`**: Precision = 82.24%, Recall = 82.05%, **F1-Score = 0.8214**

### Cross-Polar Error Rate:
- **UNSOLD misclassified as SHORTAGE**: **0 cases (0.0%)**
- **SHORTAGE misclassified as UNSOLD**: **0 cases (0.0%)**

---

## 4. Launching the Backend API

To start the FastAPI server:

```bash
D:\Competition\Voyage_Hack\Model2_Booking_Conversion\venv\Scripts\python.exe -m uvicorn model5.api:app --app-dir D:\Competition\Voyage_Hack\Model5_Inventory_Risk\src --host 127.0.0.1 --port 8001
```

- **API Documentation**: `http://127.0.0.1:8001/docs`
- **Health Check**: `GET http://127.0.0.1:8001/api/model5/health`
- **Predict Endpoint**: `POST http://127.0.0.1:8001/api/model5/predict`
- **Portfolio Summary**: `POST http://127.0.0.1:8001/api/model5/risk-summary`

---

## 5. Running Automated Tests

Run the complete test suite:

```bash
D:\Competition\Voyage_Hack\Model2_Booking_Conversion\venv\Scripts\python.exe -m pytest D:\Competition\Voyage_Hack\Model5_Inventory_Risk\tests -v
```

All 15 tests pass with zero errors.
