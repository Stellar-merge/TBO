# Model 2: Booking Conversion Prediction — TBO SmartStock AI

> **⚠️ Data is public consumer-travel proxy (Expedia), NOT TBO B2B data. Recalibrate on real TBO data before production use.**

Part of **TBO SmartStock AI** — estimates calibrated probability $P(\text{search} \to \text{booking})$ for downstream hotel inventory pre-purchasing and dynamic stocking optimization.

---

## Quick Start (5 commands)

```bash
# 1. Activate virtual environment
venv\Scripts\activate

# 2. Install dependencies (including FastAPI & Uvicorn)
pip install -r requirements.txt

# 3. Start Backend REST API Server for Frontend Integration
python src\model2\api.py
# Server runs on http://localhost:8000 (OpenAPI docs at http://localhost:8000/docs)

# 4. Run full test suite (25 tests covering model, inference, API & regression)
python -m pytest tests/ -v

# 5. CLI batch prediction on CSV
python -m model2.predict --input searches.csv --output predictions.csv
```

---

## REST API Endpoints (for Frontend & Downstream Services)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/model2/health` | Health check, model status, optimal threshold (0.21) |
| `POST` | `/api/model2/predict` | Single or batch booking conversion predictions + SHAP explanations |
| `POST` | `/api/model2/expected-bookings` | Aggregated expected bookings $\sum p_i$ by destination & checkin month |
| `GET` | `/docs` | Interactive Swagger UI |

### Example cURL: Predict Single Search
```bash
curl -X POST "http://localhost:8000/api/model2/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "search": {
         "destination_id": 8250,
         "checkin_date": "2026-12-01",
         "checkout_date": "2026-12-05",
         "num_adults": 2,
         "num_rooms": 1
       },
       "include_explanation": true
     }'
```

### Example cURL: Aggregate Expected Bookings
```bash
curl -X POST "http://localhost:8000/api/model2/expected-bookings" \
     -H "Content-Type: application/json" \
     -d '{
       "searches": [
         {"destination_id": 8250, "checkin_date": "2026-12-01", "checkout_date": "2026-12-05"},
         {"destination_id": 8250, "checkin_date": "2026-12-10", "checkout_date": "2026-12-15"}
       ],
       "group_cols": ["destination_id", "checkin_month"]
     }'
```

See [docs/api_documentation.md](file:///D:/Competition/Voyage_Hack/Model2_Booking_Conversion/docs/api_documentation.md) for full schema details.

---

## Python API

```python
import sys; sys.path.insert(0, 'src')
from model2.predict import predict_conversion_proba, expected_bookings, explain_prediction, transform_raw_searches_to_features

# 1. Transform raw search records to 44 features
feat_df = transform_raw_searches_to_features(raw_search_dicts)

# 2. Predict calibrated probabilities
proba = predict_conversion_proba(feat_df)  # np.ndarray [0, 1]

# 3. Aggregate for inventory optimizer (sums calibrated probabilities)
agg = expected_bookings(raw_search_df, group_cols=['destination_id', 'checkin_month'])
# Returns DataFrame with: n_searches, expected_bookings, expected_conversion_rate

# 4. Explain prediction with exact Tree SHAP
explanation = explain_prediction(raw_search_dicts[0], top_k=5)
```

---

## Project Structure

```
Model2_Booking_Conversion/
├── run_all.py                   # Single entry point reproducing phases 0-10
├── config.yaml                  # Configuration, parameters, and paths
├── requirements.txt             # Pinned versions
├── src/model2/                  # Source code
│   ├── api.py                   # FastAPI service (CORS, validation, endpoints)
│   ├── predict.py               # Public inference module, transformation & CLI
│   ├── phase0_environment.py    # Environment and hardware recon
│   ├── phase1_data_audit.py     # Data audit and dataset identification
│   ├── phase2_labeling.py       # Session grouping and search-intent labeling
│   ├── phase3_features.py       # Leakage-safe feature engineering (44 feats)
│   ├── phase4_splits.py         # Time-based train/val/cal/test splitting
│   ├── phase5_baselines.py      # LogisticRegression, HistGradientBoosting, Dummy
│   ├── phase6_xgboost.py        # XGBoost classifier + Optuna tuning
│   ├── phase7_calibration.py    # Isotonic probability calibration
│   ├── phase8_evaluation.py     # Comprehensive metrics & lift tables
│   ├── phase9_shap.py           # SHAP explainability & feature importance
│   ├── phase10_packaging.py     # Artifact verification & model card
│   └── utils.py                 # Common utility functions
├── data/
│   ├── interim/                 # Labeled groups, raw splits
│   └── processed/               # Feature matrices (Parquet)
├── artifacts/model2/            # Production model artifacts
│   ├── xgb_model.json           # Trained XGBoost Booster (44 features)
│   ├── calibrator.joblib        # Isotonic regression calibrator
│   ├── encoders.joblib          # Frequency encoding maps
│   ├── dest_pca_lookup.parquet  # 62,106 destination PCA embeddings
│   ├── user_history_lookup.parquet # Time-safe user history stats
│   ├── feature_spec.json        # 44 feature schema contract
│   └── metrics.json             # Execution metrics and evaluation benchmarks
├── docs/                        # Architectural decisions & documentation
│   ├── api_documentation.md     # Complete REST API specifications
│   ├── DECISIONS.md             # Architecture decisions log
│   ├── feature_contract.md      # Feature definitions and leak prevention
│   └── shap_business_note.md    # Business takeaways from explainability
├── tests/                       # Automated test suite
│   ├── test_model2.py           # Core model and mathematical tests
│   └── test_model2_api.py       # API integration, validation & regression tests
└── logs/                        # Execution logs
```
