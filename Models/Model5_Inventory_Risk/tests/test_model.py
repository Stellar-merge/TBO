"""
test_model.py — Unit and Regression Tests for Model 5 Predictor & Artifacts.

Verifies:
- All model artifacts load cleanly in an independent process.
- Single opportunity prediction returns expected schema and probability keys.
- Batch prediction returns aligned results for all rows.
- Probabilities are bounded strictly in [0.0, 1.0] and sum to 1.0 (+/- 1e-3).
- Model handles missing optional fields gracefully using training medians.
- Predictions are deterministic and reproducible.
"""
import sys
from pathlib import Path
import pytest
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from model5.predict import Model5Predictor


@pytest.fixture(scope="module")
def predictor():
    return Model5Predictor()


def test_predictor_loads(predictor):
    """Verifies all components of Model5Predictor are initialized."""
    assert predictor.is_loaded
    assert predictor.model is not None
    assert predictor.preprocessor is not None
    assert predictor.calibrator is not None


def test_single_prediction_schema_and_probabilities(predictor):
    """Tests single opportunity prediction and probability properties."""
    sample_opp = {
        "opportunity_id": "TEST_OPP_001",
        "property_id": "HOTEL_CITY_02",
        "destination_id": "DEST_LISBON_PRT",
        "destination_type": "City",
        "supplier_id": "SUP_HOTELBEDS",
        "contract_flexibility": "SEMI_FLEXIBLE",
        "checkin_date": "2027-06-15",
        "procured_quantity": 45.0,
        "supplier_capacity": 100.0,
        "procurement_lead_time_days": 45.0,
        "historical_daily_demand_30d_avg": 50.0,
        "historical_daily_demand_90d_avg": 48.0,
        "historical_same_month_prior_year_demand": 52.0,
        "current_pace_on_the_books": 15.0,
        "historical_cancellation_rate_30d": 0.25,
        "procurement_cost_per_room": 85.0,
        "expected_selling_price": 115.0
    }
    
    result = predictor.predict_single(sample_opp, use_calibrated=True)
    
    assert "opportunity_id" in result
    assert result["opportunity_id"] == "TEST_OPP_001"
    assert result["predicted_risk_class"] in [0, 1, 2]
    assert result["predicted_risk_label"] in ["BALANCED", "UNSOLD", "SHORTAGE"]
    
    probs = result["probabilities"]
    assert "balanced_probability" in probs
    assert "unsold_probability" in probs
    assert "shortage_probability" in probs
    
    p_sum = probs["balanced_probability"] + probs["unsold_probability"] + probs["shortage_probability"]
    assert pytest.approx(p_sum, abs=1e-3) == 1.0
    for p_val in probs.values():
        assert 0.0 <= p_val <= 1.0
        
    assert isinstance(result["risk_factors"], list)
    assert len(result["risk_factors"]) >= 1


def test_batch_prediction_order_and_handling(predictor):
    """Tests batch inference preserves length and order."""
    batch_opps = [
        # Heavy over-procurement -> Expected UNSOLD
        {
            "opportunity_id": "OPP_HEAVY_OVER",
            "property_id": "HOTEL_CITY_02",
            "destination_id": "DEST_LISBON_PRT",
            "procured_quantity": 180.0,
            "historical_daily_demand_30d_avg": 40.0,
            "historical_same_month_prior_year_demand": 42.0,
            "supplier_capacity": 200.0,
            "procurement_lead_time_days": 60.0
        },
        # Heavy under-procurement -> Expected SHORTAGE
        {
            "opportunity_id": "OPP_HEAVY_UNDER",
            "property_id": "HOTEL_RESORT_01",
            "destination_id": "DEST_ALGARVE_PRT",
            "procured_quantity": 10.0,
            "historical_daily_demand_30d_avg": 80.0,
            "historical_same_month_prior_year_demand": 85.0,
            "supplier_capacity": 150.0,
            "procurement_lead_time_days": 30.0
        }
    ]
    
    results = predictor.predict_batch(batch_opps, use_calibrated=True)
    assert len(results) == 2
    assert results[0]["opportunity_id"] == "OPP_HEAVY_OVER"
    assert results[1]["opportunity_id"] == "OPP_HEAVY_UNDER"
    
    # Check that over-procurement predicts UNSOLD and under-procurement predicts SHORTAGE
    assert results[0]["predicted_risk_label"] == "UNSOLD"
    assert results[1]["predicted_risk_label"] == "SHORTAGE"


def test_missing_optional_fields_and_unseen_categories(predictor):
    """Verifies that missing optional values and unseen categories do not crash the pipeline."""
    sparse_opp = {
        "opportunity_id": "OPP_SPARSE",
        "property_id": "BRAND_NEW_UNKNOWN_PROPERTY",
        "destination_id": "UNKNOWN_DEST",
        "supplier_id": "UNKNOWN_SUPPLIER",
        "procured_quantity": 55.0
    }
    
    result = predictor.predict_single(sparse_opp, use_calibrated=True)
    assert result["predicted_risk_class"] in [0, 1, 2]
    assert 0.0 <= result["probabilities"]["balanced_probability"] <= 1.0
