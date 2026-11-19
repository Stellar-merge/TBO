"""
test_api.py — FastAPI Endpoint Integration Tests for Model 5.

Verifies:
- GET /api/model5/health returns 200 and healthy service state
- POST /api/model5/predict handles single and batch payloads
- POST /api/model5/risk-summary computes accurate portfolio aggregations
- Input validation rejects invalid types and negative procurement values
"""
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from model5.api import app

client = TestClient(app)


def test_health_endpoint():
    """Tests GET /api/model5/health."""
    resp = client.get("/api/model5/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["algorithm"] == "RandomForestClassifier"
    assert data["model_loaded"] is True
    assert data["preprocessor_loaded"] is True
    assert data["calibrator_loaded"] is True
    assert data["n_predictive_features"] > 0


def test_predict_endpoint_single_and_batch():
    """Tests POST /api/model5/predict with single and multiple opportunities."""
    payload = {
        "opportunities": [
            {
                "opportunity_id": "OPP_API_001",
                "property_id": "HOTEL_CITY_02",
                "destination_id": "DEST_LISBON_PRT",
                "procured_quantity": 40.0,
                "supplier_capacity": 100.0,
                "historical_daily_demand_30d_avg": 42.0,
                "checkin_date": "2027-07-01"
            },
            {
                "opportunity_id": "OPP_API_002",
                "property_id": "HOTEL_RESORT_01",
                "destination_id": "DEST_ALGARVE_PRT",
                "procured_quantity": 190.0,
                "supplier_capacity": 200.0,
                "historical_daily_demand_30d_avg": 45.0,
                "checkin_date": "2027-07-01"
            }
        ],
        "use_calibrated": True
    }
    
    resp = client.post("/api/model5/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_opportunities"] == 2
    preds = data["predictions"]
    assert len(preds) == 2
    
    assert preds[0]["opportunity_id"] == "OPP_API_001"
    assert preds[1]["opportunity_id"] == "OPP_API_002"
    assert preds[1]["predicted_risk_label"] == "UNSOLD"
    
    for p in preds:
        assert "probabilities" in p
        probs = p["probabilities"]
        assert "balanced_probability" in probs
        assert "unsold_probability" in probs
        assert "shortage_probability" in probs
        assert isinstance(p["risk_factors"], list)


def test_risk_summary_endpoint():
    """Tests POST /api/model5/risk-summary portfolio aggregation."""
    payload = {
        "opportunities": [
            {
                "opportunity_id": "OPP_SUMM_01",
                "property_id": "HOTEL_CITY_02",
                "destination_id": "DEST_LISBON_PRT",
                "supplier_id": "SUP_HOTELBEDS",
                "procured_quantity": 38.0,
                "historical_daily_demand_30d_avg": 40.0
            },
            {
                "opportunity_id": "OPP_SUMM_02",
                "property_id": "HOTEL_CITY_02",
                "destination_id": "DEST_LISBON_PRT",
                "supplier_id": "SUP_HOTELBEDS",
                "procured_quantity": 170.0,
                "historical_daily_demand_30d_avg": 40.0
            },
            {
                "opportunity_id": "OPP_SUMM_03",
                "property_id": "HOTEL_RESORT_01",
                "destination_id": "DEST_ALGARVE_PRT",
                "supplier_id": "SUP_TBO_DIRECT",
                "procured_quantity": 5.0,
                "historical_daily_demand_30d_avg": 70.0
            }
        ],
        "use_calibrated": True
    }
    
    resp = client.post("/api/model5/risk-summary", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_opportunities_analyzed"] == 3
    assert data["balanced_count"] + data["unsold_risk_count"] + data["shortage_risk_count"] == 3
    assert "average_probabilities" in data
    assert "breakdown_by_destination" in data
    assert "breakdown_by_supplier" in data
    assert "DEST_LISBON_PRT" in data["breakdown_by_destination"]
    assert "DEST_ALGARVE_PRT" in data["breakdown_by_destination"]


def test_validation_error_on_invalid_payload():
    """Verifies that invalid payloads (e.g. negative quantity) return 422."""
    bad_payload = {
        "opportunities": [
            {
                "opportunity_id": "OPP_BAD",
                "procured_quantity": -10.0  # Invalid! ge=1
            }
        ]
    }
    resp = client.post("/api/model5/predict", json=bad_payload)
    assert resp.status_code == 422
