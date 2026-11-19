# Model 2: Booking Conversion Prediction — API & Frontend Integration Documentation

> **CRITICAL DISCLAIMER**: This model is trained on public consumer-travel proxy data (Expedia Hotel Recommendations), **NOT TBO B2B data**. In production at TBO, this model MUST be recalibrated on actual B2B agent searches and bookings before deploying into financial inventory allocation workflows.

---

## 1. Overview & Architecture

Model 2 estimates the probability that an incoming hotel search or availability request turns into a confirmed booking.

In the **TBO SmartStock AI** platform:
- The downstream **Inventory Optimizer** aggregates these probabilities across all incoming searches for each destination and check-in window:
  $$\text{Expected Bookings} = \sum_{i=1}^{N} \hat{p}_i$$
- It is vital that probabilities are **well-calibrated** (not merely well-ranked), and that **calibrated probabilities are summed directly** (rather than threshold-based binary 0/1 predictions).
- The service exposes a high-performance **FastAPI** backend with automatic feature engineering, cold-start user handling, anti-leakage guards, and full CORS support for frontend clients.

---

## 2. Service Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/model2/health` | Health check, model status, and metadata |
| `POST` | `/api/model2/predict` | Single or batch booking conversion probability predictions |
| `POST` | `/api/model2/expected-bookings` | Aggregated expected bookings by destination & check-in month |
| `GET` | `/docs` | Interactive Swagger / OpenAPI documentation UI |
| `GET` | `/redoc` | Interactive ReDoc documentation UI |

---

## 3. Server Startup Instructions

To launch the inference server locally on port 8000:

### Option A: Direct Python Script Execution
```powershell
# From D:\Competition\Voyage_Hack\Model2_Booking_Conversion
.\venv\Scripts\python.exe src\model2\api.py
```

### Option B: Uvicorn CLI
```powershell
.\venv\Scripts\python.exe -m uvicorn model2.api:app --app-dir src --host 0.0.0.0 --port 8000 --reload
```

---

## 4. Endpoint Specifications

### 4.1 Health Check: `GET /api/model2/health`

Verifies that the XGBoost Booster, Isotonic Calibrator, and lookup artifacts are loaded and ready.

#### Example Response:
```json
{
  "status": "healthy",
  "model": "Model 2: Booking Conversion Prediction",
  "model_version": "1.0.0",
  "xgboost_loaded": true,
  "calibrator_loaded": true,
  "calibrator_method": "isotonic",
  "feature_count": 44,
  "optimal_threshold": 0.21,
  "dataset_note": "PUBLIC CONSUMER DATA PROXY - NOT TBO B2B DATA"
}
```

---

### 4.2 Prediction: `POST /api/model2/predict`

Predicts calibrated booking conversion probability for individual or batch searches.

#### Supported Input Formats:
1. Object with `search` key (single record): `{"search": {...}}`
2. Object with `searches` key (batch records): `{"searches": [{...}, {...}]}`
3. Direct list of records: `[{...}, {...}]`

#### Key Request Parameters (with friendly frontend aliases):
| Field | Type | Required | Default | Description / Aliases |
|---|---|---|---|---|
| `destination_id` | int | **Yes** | — | Target hotel destination ID (alias: `srch_destination_id`) |
| `checkin_date` | string | **Yes** | — | Check-in date `YYYY-MM-DD` (alias: `srch_ci`) |
| `checkout_date` | string | **Yes** | — | Check-out date `YYYY-MM-DD` (alias: `srch_co`) |
| `num_adults` | int | No | 1 | Adult guests (1-20) (alias: `srch_adults_cnt`) |
| `num_children` | int | No | 0 | Child guests (0-10) (alias: `srch_children_cnt`) |
| `num_rooms` | int | No | 1 | Rooms requested (1-10) (alias: `srch_rm_cnt`) |
| `user_id` | int/str | No | None | User ID for historical conversion rate lookup |
| `search_datetime`| string | No | current UTC | Search timestamp (alias: `date_time`) |
| `distance` | float | No | null | Origin to destination distance (alias: `orig_destination_distance`) |
| `is_mobile` | int | No | 0 | 1 if mobile device, 0 if desktop |
| `is_package` | int | No | 0 | 1 if bundled package, 0 if standalone hotel |
| `channel` | int | No | 0 | Distribution channel identifier |
| `include_explanation` | bool | No | false | When true, returns top SHAP drivers explaining the score |

> [!CAUTION]
> **Forbidden Post-Event Leakage Columns**: Do NOT include `hotel_cluster`, `cnt`, or `is_booking`. If present, the API will reject the request with HTTP 422 Unprocessable Entity.

#### Request Example (Single Search with SHAP Explanation):
```bash
curl -X POST "http://localhost:8000/api/model2/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "search": {
         "destination_id": 8250,
         "checkin_date": "2026-12-01",
         "checkout_date": "2026-12-05",
         "num_adults": 2,
         "num_rooms": 1,
         "is_mobile": 0
       },
       "include_explanation": true
     }'
```

#### Response Example:
```json
{
  "status": "success",
  "model_version": "1.0.0",
  "model_name": "Model 2: Booking Conversion Prediction",
  "prediction_count": 1,
  "mean_conversion_probability": 0.2106,
  "expected_bookings_total": 0.211,
  "predictions": [
    {
      "index": 0,
      "destination_id": 8250,
      "conversion_probability": 0.2106,
      "conversion_percentage": "21.06%",
      "expected_bookings_per_1000": 210.6,
      "binary_prediction_at_optimal_threshold": 1,
      "optimal_threshold": 0.21,
      "explanation": {
        "raw_probability": 0.2078,
        "calibrated_probability": 0.2106,
        "top_reasons": [
          {
            "feature": "user_prior_intents",
            "value": "0",
            "shap_value": 0.3948,
            "direction": "increases",
            "explanation": "`user_prior_intents` = 0 → increases booking probability by 0.3948 log-odds units"
          },
          {
            "feature": "user_prior_booking_rate",
            "value": "0",
            "shap_value": -0.3034,
            "direction": "decreases",
            "explanation": "`user_prior_booking_rate` = 0 → decreases booking probability by 0.3034 log-odds units"
          },
          {
            "feature": "length_of_stay_nights",
            "value": "4",
            "shap_value": -0.219,
            "direction": "decreases",
            "explanation": "`length_of_stay_nights` = 4 → decreases booking probability by 0.2190 log-odds units"
          }
        ],
        "prediction_text": "Estimated booking probability: 21.060% (210.6 expected bookings per 1,000 similar searches)"
      }
    }
  ],
  "dataset_note": "PUBLIC CONSUMER DATA PROXY - NOT TBO B2B DATA"
}
```

---

### 4.3 Expected Bookings Aggregation: `POST /api/model2/expected-bookings`

Calculates expected booking volume aggregated by destination and check-in month using calibrated probabilities directly.

#### Request Example:
```bash
curl -X POST "http://localhost:8000/api/model2/expected-bookings" \
     -H "Content-Type: application/json" \
     -d '{
       "searches": [
         {"destination_id": 8250, "checkin_date": "2026-12-01", "checkout_date": "2026-12-05", "num_adults": 2},
         {"destination_id": 8250, "checkin_date": "2026-12-10", "checkout_date": "2026-12-12", "num_adults": 1},
         {"destination_id": 1202, "checkin_date": "2026-12-15", "checkout_date": "2026-12-18", "num_adults": 3},
         {"destination_id": 1202, "checkin_date": "2027-01-05", "checkout_date": "2027-01-08", "num_adults": 2}
       ],
       "group_cols": ["destination_id", "checkin_month"]
     }'
```

#### Response Example:
```json
{
  "status": "success",
  "model_version": "1.0.0",
  "total_searches": 4,
  "total_expected_bookings": 0.6,
  "overall_expected_conversion_rate": 0.15,
  "group_columns": [
    "destination_id",
    "checkin_month"
  ],
  "aggregation_method": "sum_of_calibrated_probabilities",
  "aggregated_results": [
    {
      "destination_id": 1202,
      "checkin_month": 1,
      "search_count": 1,
      "expected_bookings": 0.119,
      "expected_conversion_rate": 0.1192,
      "extra_group_values": null
    },
    {
      "destination_id": 1202,
      "checkin_month": 12,
      "search_count": 1,
      "expected_bookings": 0.104,
      "expected_conversion_rate": 0.1038,
      "extra_group_values": null
    },
    {
      "destination_id": 8250,
      "checkin_month": 12,
      "search_count": 2,
      "expected_bookings": 0.377,
      "expected_conversion_rate": 0.1885,
      "extra_group_values": null
    }
  ],
  "dataset_note": "PUBLIC CONSUMER DATA PROXY - NOT TBO B2B DATA"
}
```

---

## 5. Frontend Integration Notes

1. **CORS is Pre-configured**:
   The API has wildcard CORS (`allow_origins=["*"]`) enabled, so React, Next.js, Vue, or Angular applications running on `http://localhost:3000` or `http://localhost:5173` can make direct `fetch()` calls without encountering CORS blocks.
2. **Flexible Key Aliases**:
   Frontend developers can pass either standard Expedia keys (`srch_destination_id`, `srch_ci`, `srch_co`, `srch_adults_cnt`) or clean, readable keys (`destination_id`, `checkin_date`, `checkout_date`, `num_adults`, `num_rooms`).
3. **Cold-Start Safe**:
   If the frontend user is a guest or new user without an account (`user_id` is null or omitted), the backend automatically defaults historical conversion metrics safely to 0 prior searches and 0.0 prior booking rate.
4. **Fast Performance**:
   Precomputed lookup tables (`dest_pca_lookup.parquet` and `user_history_lookup.parquet`) and native XGBoost Tree SHAP enable sub-5 millisecond response times for single predictions and sub-50 milliseconds for batch queries up to 1,000 items.
