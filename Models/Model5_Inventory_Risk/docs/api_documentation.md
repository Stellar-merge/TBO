# Model 5 Backend API Documentation — TBO SmartStock AI

**Module**: Model 5 — Inventory Risk Prediction  
**Base URL**: `http://127.0.0.1:8001`  
**Interactive Swagger UI**: `http://127.0.0.1:8001/docs`  
**OpenAPI Specification**: `http://127.0.0.1:8001/openapi.json`  

---

## 1. Quickstart & Service Launch

To launch the standalone Model 5 FastAPI service:

```bash
# Using project python venv:
D:\Competition\Voyage_Hack\Model2_Booking_Conversion\venv\Scripts\python.exe -m uvicorn model5.api:app --app-dir D:\Competition\Voyage_Hack\Model5_Inventory_Risk\src --host 127.0.0.1 --port 8001
```

Once running, the interactive documentation is available at `http://127.0.0.1:8001/docs`.

---

## 2. API Endpoints

### A. Health Check
`GET /api/model5/health`

Returns operational status, model versions, loaded artifact states, and dataset provenance note.

#### Sample Request
```bash
curl -X GET "http://127.0.0.1:8001/api/model5/health"
```

#### Sample Response (200 OK)
```json
{
  "status": "healthy",
  "model_name": "Model 5 - Inventory Risk Prediction",
  "algorithm": "RandomForestClassifier",
  "model_version": "1.0.0",
  "model_loaded": true,
  "preprocessor_loaded": true,
  "calibrator_loaded": true,
  "n_predictive_features": 46,
  "dataset_provenance": "Trained on synthetic B2B procurement scenarios anchored to empirical hotel reservation demand from hotels.csv (Antonio et al., 2019)."
}
```

---

### B. Single & Batch Risk Prediction
`POST /api/model5/predict`

Classifies procurement opportunities into `BALANCED`, `UNSOLD`, or `SHORTAGE` risk classes with calibrated probabilities and domain risk explanations.

#### Input Payload Schema
Can be sent as:
1. A wrapped object: `{"opportunities": [ {...} ], "use_calibrated": true}`
2. A single opportunity object: `{...}`
3. A direct list of opportunity objects: `[ {...}, {...} ]`

#### Key Fields:
- `opportunity_id` (string, optional): Client opportunity identifier (e.g. `"OPP_LIS_001"`).
- `property_id` (string, optional): Property identifier (e.g. `"HOTEL_CITY_02"`).
- `destination_id` (string, optional): Destination code (e.g. `"DEST_LISBON_PRT"`).
- `destination_type` (string, optional): `"City"` or `"Resort"`.
- `supplier_id` (string, optional): Wholesaler / Bedbank ID.
- `contract_flexibility` (string, optional): `"FLEXIBLE"`, `"SEMI_FLEXIBLE"`, or `"NON_REFUNDABLE"`.
- `checkin_date` (string, optional): Target stay date (`"YYYY-MM-DD"`).
- `procured_quantity` (**float, required**, $\ge 1$): Committed room nights.
- `supplier_capacity` (float, optional): Maximum supplier allotment ceiling.
- `procurement_cost_per_room` (float, optional): Cost per room per night.
- `expected_selling_price` (float, optional): Target retail ADR.
- `procurement_lead_time_days` (float, optional): Days in advance of checkin.
- `historical_daily_demand_30d_avg` (float, optional): Trailing 30-day demand average.
- `current_pace_on_the_books` (float, optional): Confirmed bookings on books.

#### Sample Request
```bash
curl -X POST "http://127.0.0.1:8001/api/model5/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "opportunities": [
         {
           "opportunity_id": "OPP_DEMO_01",
           "property_id": "HOTEL_CITY_02",
           "destination_id": "DEST_LISBON_PRT",
           "destination_type": "City",
           "supplier_id": "SUP_HOTELBEDS",
           "contract_flexibility": "NON_REFUNDABLE",
           "checkin_date": "2027-06-15",
           "procured_quantity": 90.0,
           "supplier_capacity": 100.0,
           "historical_daily_demand_30d_avg": 45.0,
           "current_pace_on_the_books": 12.0,
           "procurement_lead_time_days": 45.0
         }
       ],
       "use_calibrated": true
     }'
```

#### Sample Response (200 OK)
```json
{
  "total_opportunities": 1,
  "predictions": [
    {
      "opportunity_id": "OPP_DEMO_01",
      "predicted_risk_class": 1,
      "predicted_risk_label": "UNSOLD",
      "probabilities": {
        "balanced_probability": 0.0512,
        "unsold_probability": 0.9431,
        "shortage_probability": 0.0057
      },
      "is_calibrated": true,
      "risk_factors": [
        "Procured volume (90.0 rooms) is +100.0% above 30-day historical demand (45.0 rooms/day), driving elevated UNSOLD inventory risk.",
        "Contract is NON_REFUNDABLE; unsold rooms cannot be returned to supplier prior to check-in, amplifying downside risk."
      ],
      "model_version": "1.0.0"
    }
  ]
}
```

---

### C. Portfolio Risk Summary
`POST /api/model5/risk-summary`

Aggregates predictions across multiple procurement opportunities to provide an executive portfolio risk overview and breakdown by destination and supplier.

#### Sample Request
```bash
curl -X POST "http://127.0.0.1:8001/api/model5/risk-summary" \
     -H "Content-Type: application/json" \
     -d '{
       "opportunities": [
         {
           "opportunity_id": "OPP_01",
           "destination_id": "DEST_LISBON_PRT",
           "supplier_id": "SUP_HOTELBEDS",
           "procured_quantity": 40.0,
           "historical_daily_demand_30d_avg": 42.0
         },
         {
           "opportunity_id": "OPP_02",
           "destination_id": "DEST_LISBON_PRT",
           "supplier_id": "SUP_HOTELBEDS",
           "procured_quantity": 180.0,
           "historical_daily_demand_30d_avg": 40.0
         },
         {
           "opportunity_id": "OPP_03",
           "destination_id": "DEST_ALGARVE_PRT",
           "supplier_id": "SUP_TBO_DIRECT",
           "procured_quantity": 8.0,
           "historical_daily_demand_30d_avg": 65.0
         }
       ],
       "use_calibrated": true
     }'
```

#### Sample Response (200 OK)
```json
{
  "total_opportunities_analyzed": 3,
  "balanced_count": 1,
  "unsold_risk_count": 1,
  "shortage_risk_count": 1,
  "balanced_pct": 33.33,
  "unsold_pct": 33.33,
  "shortage_pct": 33.33,
  "average_probabilities": {
    "balanced": 0.3521,
    "unsold": 0.3415,
    "shortage": 0.3064
  },
  "breakdown_by_destination": {
    "DEST_LISBON_PRT": { "total": 2, "balanced": 1, "unsold": 1, "shortage": 0 },
    "DEST_ALGARVE_PRT": { "total": 1, "balanced": 0, "unsold": 0, "shortage": 1 }
  },
  "breakdown_by_supplier": {
    "SUP_HOTELBEDS": { "total": 2, "balanced": 1, "unsold": 1, "shortage": 0 },
    "SUP_TBO_DIRECT": { "total": 1, "balanced": 0, "unsold": 0, "shortage": 1 }
  },
  "summary_notes": "Analyzed 3 opportunities: 1 (33.3%) carrying UNSOLD risk, 1 (33.3%) carrying SHORTAGE risk, and 1 (33.3%) BALANCED.",
  "model_version": "1.0.0"
}
```

---

## 3. Error Handling

- **`400 Bad Request`**: Malformed request payload.
- **`422 Unprocessable Entity`**: Pydantic validation failure (e.g. `procured_quantity < 1`).
- **`500 Internal Server Error`**: Preprocessing or model inference exception (e.g. forbidden outcome columns detected).
- **`503 Service Unavailable`**: Artifacts not yet loaded or missing.
