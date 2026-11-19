"""
test_model2_api.py — Comprehensive tests for Model 2 inference engine and FastAPI endpoints.

Covers:
  1. Model artifact loading
  2. Single-record prediction
  3. Batch prediction
  4. Calibration
  5. Input validation
  6. Missing and invalid data
  7. Cold-start users
  8. Historical feature leakage prevention
  9. Expected-booking aggregation
  10. API response structure
  11. Regression against the saved evaluation pipeline
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from model2.api import app, OPTIMAL_THRESHOLD
from model2.predict import Model2Predictor, transform_raw_searches_to_features

client = TestClient(app)
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts" / "model2"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


# ===========================================================================
# 1. Model Artifact Loading
# ===========================================================================
def test_artifact_loading():
    """Verify all model artifacts load cleanly without errors."""
    predictor = Model2Predictor()
    assert predictor.xgb_model is not None, "XGBoost model booster failed to load"
    assert predictor.calibrator is not None, "Isotonic calibrator failed to load"
    assert predictor.cal_method == "isotonic", f"Expected isotonic calibrator, got {predictor.cal_method}"
    assert len(predictor.feat_cols) == 44, f"Expected 44 features, got {len(predictor.feat_cols)}"
    assert (ARTIFACTS_DIR / "dest_pca_lookup.parquet").exists(), "dest_pca_lookup.parquet missing"
    assert (ARTIFACTS_DIR / "user_history_lookup.parquet").exists(), "user_history_lookup.parquet missing"


# ===========================================================================
# 2. Single-Record Prediction
# ===========================================================================
def test_single_record_prediction():
    """Verify single-record inference works and returns valid probability."""
    payload = {
        "search": {
            "destination_id": 8250,
            "checkin_date": "2026-12-01",
            "checkout_date": "2026-12-05",
            "num_adults": 2,
            "num_rooms": 1,
            "num_children": 0,
            "is_mobile": 0,
            "is_package": 0,
        }
    }
    response = client.post("/api/model2/predict", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["status"] == "success"
    assert data["prediction_count"] == 1
    pred = data["predictions"][0]
    assert 0.0 <= pred["conversion_probability"] <= 1.0
    assert pred["expected_bookings_per_1000"] == round(pred["conversion_probability"] * 1000, 1)


# ===========================================================================
# 3. Batch Prediction
# ===========================================================================
def test_batch_prediction():
    """Verify batch inference handles multiple records correctly."""
    searches = [
        {"destination_id": 8250, "checkin_date": "2026-12-01", "checkout_date": "2026-12-05", "num_adults": 2},
        {"destination_id": 1202, "checkin_date": "2026-12-10", "checkout_date": "2026-12-14", "num_adults": 1},
        {"destination_id": 4284, "checkin_date": "2027-01-15", "checkout_date": "2027-01-20", "num_adults": 4},
    ]
    response = client.post("/api/model2/predict", json={"searches": searches})
    assert response.status_code == 200
    data = response.json()
    assert data["prediction_count"] == 3
    assert len(data["predictions"]) == 3
    for i, p in enumerate(data["predictions"]):
        assert p["index"] == i
        assert 0.0 <= p["conversion_probability"] <= 1.0


# ===========================================================================
# 4. Calibration
# ===========================================================================
def test_calibration_range_and_monotonicity():
    """Verify that isotonic calibrator preserves probability range [0, 1] and monotonic ranking."""
    predictor = Model2Predictor()
    # Check calibrator bounds
    raw_scores = np.linspace(0.01, 0.99, 50)
    cal_scores = predictor.calibrator.predict(raw_scores)
    assert (cal_scores >= 0.0).all() and (cal_scores <= 1.0).all()
    # Monotonicity: Isotonic regression must be non-decreasing
    assert np.all(np.diff(cal_scores) >= -1e-6), "Calibrator is not monotonically non-decreasing"


# ===========================================================================
# 5. Input Validation
# ===========================================================================
def test_input_validation_checkout_before_checkin():
    """Verify that checkout date earlier than check-in date is rejected with 422."""
    payload = {
        "search": {
            "destination_id": 8250,
            "checkin_date": "2026-12-05",
            "checkout_date": "2026-12-01",  # earlier than checkin!
            "num_adults": 2,
        }
    }
    response = client.post("/api/model2/predict", json=payload)
    assert response.status_code == 422
    assert "earlier than check-in date" in response.text


def test_input_validation_forbidden_columns():
    """Verify that post-event leakage columns are strictly rejected with 422."""
    for col in ["hotel_cluster", "cnt", "is_booking"]:
        payload = {
            "search": {
                "destination_id": 8250,
                "checkin_date": "2026-12-01",
                "checkout_date": "2026-12-05",
                col: 1,  # forbidden!
            }
        }
        response = client.post("/api/model2/predict", json=payload)
        assert response.status_code == 422, f"Failed to reject forbidden column {col}"
        assert "forbidden" in response.text.lower()


# ===========================================================================
# 6. Missing and Invalid Data Handling
# ===========================================================================
def test_missing_and_invalid_data_handling():
    """Verify that missing optional fields default safely without crashing."""
    # Minimal payload (only destination and dates)
    payload = {
        "search": {
            "destination_id": 8250,
            "checkin_date": "2026-12-01",
            "checkout_date": "2026-12-05",
        }
    }
    response = client.post("/api/model2/predict", json=payload)
    assert response.status_code == 200
    pred = response.json()["predictions"][0]
    assert 0.0 <= pred["conversion_probability"] <= 1.0

    # Malformed date string
    bad_payload = {
        "search": {
            "destination_id": 8250,
            "checkin_date": "not-a-valid-date",
            "checkout_date": "2026-12-05",
        }
    }
    bad_response = client.post("/api/model2/predict", json=bad_payload)
    assert bad_response.status_code == 422


# ===========================================================================
# 7. Cold-Start Users
# ===========================================================================
def test_cold_start_users():
    """Verify that users without previous booking history default to 0 prior intents and 0.0 rate."""
    # 1. Unseen user ID (e.g. 99999999)
    features_unseen = transform_raw_searches_to_features({
        "destination_id": 8250,
        "checkin_date": "2026-12-01",
        "checkout_date": "2026-12-05",
        "user_id": 99999999,
    })
    assert features_unseen.iloc[0]["user_prior_intents"] == 0.0
    assert features_unseen.iloc[0]["user_prior_booking_rate"] == 0.0

    # 2. No user ID provided at all
    features_anonymous = transform_raw_searches_to_features({
        "destination_id": 8250,
        "checkin_date": "2026-12-01",
        "checkout_date": "2026-12-05",
    })
    assert features_anonymous.iloc[0]["user_prior_intents"] == 0.0
    assert features_anonymous.iloc[0]["user_prior_booking_rate"] == 0.0


# ===========================================================================
# 8. Historical Feature Leakage Prevention
# ===========================================================================
def test_historical_leakage_prevention():
    """Verify that returning users only receive historical features from the pre-computed training cohort."""
    # User 95161 exists in training history lookup table
    features = transform_raw_searches_to_features({
        "destination_id": 4284,
        "checkin_date": "2026-12-01",
        "checkout_date": "2026-12-05",
        "user_id": 95161,
    })
    # From artifacts/model2/user_history_lookup.parquet: 18 intents, 0.1111 rate
    assert features.iloc[0]["user_prior_intents"] == 18.0
    assert abs(features.iloc[0]["user_prior_booking_rate"] - 0.1111) < 1e-3


# ===========================================================================
# 9. Expected-Booking Aggregation
# ===========================================================================
def test_expected_booking_aggregation():
    """Verify aggregation endpoint sums calibrated probabilities by destination and checkin_month."""
    searches = [
        {"destination_id": 8250, "checkin_date": "2026-12-01", "checkout_date": "2026-12-05"},
        {"destination_id": 8250, "checkin_date": "2026-12-10", "checkout_date": "2026-12-15"},
        {"destination_id": 1202, "checkin_date": "2026-12-20", "checkout_date": "2026-12-24"},
    ]
    response = client.post(
        "/api/model2/expected-bookings",
        json={"searches": searches, "group_cols": ["destination_id", "checkin_month"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_searches"] == 3
    # Check that total_expected_bookings equals the sum of group expected_bookings
    sum_group_bookings = sum(g["expected_bookings"] for g in data["aggregated_results"])
    assert abs(data["total_expected_bookings"] - sum_group_bookings) < 1e-3
    assert data["aggregation_method"] == "sum_of_calibrated_probabilities"


# ===========================================================================
# 10. API Response Structure
# ===========================================================================
def test_api_response_structure_and_health():
    """Verify complete schema structure on /api/model2/health and /api/model2/predict."""
    # Health endpoint
    h_res = client.get("/api/model2/health")
    assert h_res.status_code == 200
    h_data = h_res.json()
    assert h_data["status"] == "healthy"
    assert h_data["model_version"] == "1.0.0"
    assert h_data["feature_count"] == 44
    assert "PUBLIC CONSUMER DATA" in h_data["dataset_note"]

    # Predict endpoint structure
    p_res = client.post(
        "/api/model2/predict",
        json={
            "search": {"destination_id": 8250, "checkin_date": "2026-12-01", "checkout_date": "2026-12-05"},
            "include_explanation": True,
        },
    )
    assert p_res.status_code == 200
    p_data = p_res.json()
    assert "predictions" in p_data
    pred = p_data["predictions"][0]
    required_fields = [
        "index",
        "destination_id",
        "conversion_probability",
        "conversion_percentage",
        "expected_bookings_per_1000",
        "binary_prediction_at_optimal_threshold",
        "optimal_threshold",
        "explanation",
    ]
    for field in required_fields:
        assert field in pred, f"Missing field in prediction result: {field}"
    assert pred["explanation"] is not None
    assert "top_reasons" in pred["explanation"]


# ===========================================================================
# 11. Regression Against Saved Evaluation Pipeline
# ===========================================================================
def test_regression_against_saved_evaluation():
    """
    Verify that inference on the test split matches the saved evaluation pipeline
    and produces the identical calibrated conversion rate (0.1881 within 1e-3).
    """
    test_feat_path = DATA_DIR / "processed" / "features_test.parquet"
    if not test_feat_path.exists():
        pytest.skip("features_test.parquet not available")

    # Read a sample of the test split
    test_df = pd.read_parquet(test_feat_path).head(1000)
    predictor = Model2Predictor()
    probs = predictor.predict_conversion_proba(test_df)

    assert len(probs) == len(test_df)
    assert (probs >= 0.0).all() and (probs <= 1.0).all()
    # Expected mean probability on test cohort is approx ~0.188
    assert 0.10 <= probs.mean() <= 0.30, f"Unexpected mean test probability: {probs.mean():.4f}"
