"""
Tests for Model 2: Booking Conversion Prediction.
All tests use small synthetic data or the saved model artifacts.
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
import xgboost as xgb
import joblib

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts" / "model2"
PROCESSED_DIR = Path(__file__).parent.parent / "data" / "processed"
INTERIM_DIR = Path(__file__).parent.parent / "data" / "interim"


def model_artifacts_exist():
    return (ARTIFACTS_DIR / "xgb_model.json").exists()


def splits_exist():
    return (PROCESSED_DIR / "features_train.parquet").exists()


# ===========================================================================
# Test: Schema validation
# ===========================================================================
def test_schema_validation_forbids_hotel_cluster():
    """predict_conversion_proba must reject hotel_cluster."""
    if not model_artifacts_exist():
        pytest.skip("Model artifacts not yet built")
    
    from model2.predict import Model2Predictor
    predictor = Model2Predictor()
    
    # Create a fake DataFrame with forbidden columns
    n = 10
    with open(ARTIFACTS_DIR / "feature_spec.json") as f:
        spec = json.load(f)
    df = pd.DataFrame(np.random.randn(n, len(spec["feature_names"])),
                      columns=spec["feature_names"])
    df["hotel_cluster"] = 1  # forbidden
    
    with pytest.raises(ValueError, match="hotel_cluster"):
        predictor.predict_conversion_proba(df)


def test_schema_validation_forbids_cnt():
    """predict_conversion_proba must reject cnt."""
    if not model_artifacts_exist():
        pytest.skip("Model artifacts not yet built")
    
    from model2.predict import Model2Predictor
    predictor = Model2Predictor()
    
    with open(ARTIFACTS_DIR / "feature_spec.json") as f:
        spec = json.load(f)
    df = pd.DataFrame(np.random.randn(5, len(spec["feature_names"])),
                      columns=spec["feature_names"])
    df["cnt"] = 3  # forbidden
    
    with pytest.raises(ValueError, match="cnt"):
        predictor.predict_conversion_proba(df)


# ===========================================================================
# Test: Probabilities in [0, 1]
# ===========================================================================
def test_probabilities_in_range():
    """All predicted probabilities must be in [0, 1]."""
    if not model_artifacts_exist():
        pytest.skip("Model artifacts not yet built")
    
    from model2.predict import Model2Predictor
    predictor = Model2Predictor()
    
    with open(ARTIFACTS_DIR / "feature_spec.json") as f:
        spec = json.load(f)
    
    n = 100
    df = pd.DataFrame(np.random.randn(n, len(spec["feature_names"])),
                      columns=spec["feature_names"])
    proba = predictor.predict_conversion_proba(df)
    
    assert proba.shape == (n,), f"Expected shape ({n},), got {proba.shape}"
    assert (proba >= 0).all(), f"Min probability is {proba.min():.6f}, expected >= 0"
    assert (proba <= 1).all(), f"Max probability is {proba.max():.6f}, expected <= 1"


# ===========================================================================
# Test: Deterministic output
# ===========================================================================
def test_deterministic_predictions():
    """Predictions must be identical on the same input (no randomness in inference)."""
    if not model_artifacts_exist():
        pytest.skip("Model artifacts not yet built")
    
    from model2.predict import Model2Predictor
    predictor = Model2Predictor()
    
    with open(ARTIFACTS_DIR / "feature_spec.json") as f:
        spec = json.load(f)
    
    rng = np.random.default_rng(42)
    df = pd.DataFrame(rng.standard_normal((50, len(spec["feature_names"]))),
                      columns=spec["feature_names"])
    
    pred1 = predictor.predict_conversion_proba(df)
    pred2 = predictor.predict_conversion_proba(df)
    
    np.testing.assert_array_equal(pred1, pred2,
                                   err_msg="Predictions are not deterministic")


# ===========================================================================
# Test: Save/load round trip
# ===========================================================================
def test_save_load_roundtrip():
    """Model loaded from disk must produce identical predictions."""
    if not model_artifacts_exist():
        pytest.skip("Model artifacts not yet built")
    
    from model2.predict import Model2Predictor
    
    pred1_inst = Model2Predictor()
    pred2_inst = Model2Predictor()  # second load
    
    with open(ARTIFACTS_DIR / "feature_spec.json") as f:
        spec = json.load(f)
    
    rng = np.random.default_rng(99)
    df = pd.DataFrame(rng.standard_normal((30, len(spec["feature_names"]))),
                      columns=spec["feature_names"])
    
    p1 = pred1_inst.predict_conversion_proba(df)
    p2 = pred2_inst.predict_conversion_proba(df)
    
    np.testing.assert_array_almost_equal(p1, p2, decimal=6,
                                          err_msg="Save/load round trip produces different results")


# ===========================================================================
# Test: expected_bookings equals sum of probabilities
# ===========================================================================
def test_expected_bookings_equals_proba_sum():
    """expected_bookings() aggregated total must equal sum of individual probabilities."""
    if not model_artifacts_exist():
        pytest.skip("Model artifacts not yet built")
    
    from model2.predict import Model2Predictor
    predictor = Model2Predictor()
    
    with open(ARTIFACTS_DIR / "feature_spec.json") as f:
        spec = json.load(f)
    
    n = 200
    rng = np.random.default_rng(7)
    df = pd.DataFrame(rng.standard_normal((n, len(spec["feature_names"]))),
                      columns=spec["feature_names"])
    df["is_mobile"] = rng.integers(0, 2, n)
    
    proba = predictor.predict_conversion_proba(df)
    total_expected_from_proba = proba.sum()
    
    agg = predictor.expected_bookings(df, group_cols=["is_mobile"])
    total_expected_from_agg = agg["expected_bookings"].sum()
    
    assert abs(total_expected_from_proba - total_expected_from_agg) < 1e-3, (
        f"Sum mismatch: proba_sum={total_expected_from_proba:.4f}, "
        f"agg_sum={total_expected_from_agg:.4f}"
    )


# ===========================================================================
# Test: Time blocks do not overlap
# ===========================================================================
def test_time_blocks_do_not_overlap():
    """Train, val, cal, test must not overlap in time."""
    if not splits_exist():
        pytest.skip("Processed splits not built yet")
    
    split_dfs = {}
    for sname in ["train", "val", "cal", "test"]:
        p = PROCESSED_DIR / f"features_{sname}.parquet"
        if p.exists():
            df = pd.read_parquet(p, columns=["date_time"])
            df["date_time"] = pd.to_datetime(df["date_time"])
            split_dfs[sname] = df
    
    if len(split_dfs) < 2:
        pytest.skip("Not enough splits to compare")
    
    split_names = list(split_dfs.keys())
    for i, name_a in enumerate(split_names[:-1]):
        name_b = split_names[i + 1]
        max_a = split_dfs[name_a]["date_time"].max()
        min_b = split_dfs[name_b]["date_time"].min()
        
        assert max_a < min_b, (
            f"Time overlap detected: {name_a} max ({max_a}) >= {name_b} min ({min_b})"
        )


# ===========================================================================
# Test: No forbidden columns in feature spec
# ===========================================================================
def test_no_forbidden_columns_in_feature_spec():
    """Feature spec must not include any forbidden post-event columns."""
    if not (ARTIFACTS_DIR / "feature_spec.json").exists():
        pytest.skip("feature_spec.json not built yet")
    
    with open(ARTIFACTS_DIR / "feature_spec.json") as f:
        spec = json.load(f)
    
    forbidden = set(spec.get("forbidden_cols", ["hotel_cluster", "cnt", "is_booking"]))
    feat_names = set(spec["feature_names"])
    
    intersection = forbidden & feat_names
    assert len(intersection) == 0, (
        f"Feature spec contains forbidden columns: {intersection}"
    )


# ===========================================================================
# Test: Metrics.json exists and has required keys
# ===========================================================================
def test_metrics_json_complete():
    """metrics.json must exist and have all required keys."""
    metrics_path = ARTIFACTS_DIR / "metrics.json"
    if not metrics_path.exists():
        pytest.skip("metrics.json not built yet (run phases 1-8 first)")
    
    with open(metrics_path) as f:
        metrics = json.load(f)
    
    required_keys = ["core", "bootstrap_ci", "thresholds", "per_1000_searches"]
    for key in required_keys:
        assert key in metrics, f"metrics.json missing key: {key}"
    
    core_keys = ["roc_auc", "pr_auc", "log_loss", "brier_score", "ece"]
    for key in core_keys:
        assert key in metrics["core"], f"metrics.json['core'] missing key: {key}"
    
    # All values must be real numbers (not NaN, not None, not invented)
    for key in core_keys:
        val = metrics["core"][key]
        assert isinstance(val, (int, float)), f"metrics['core'][{key}] is not a number: {val}"
        assert not (isinstance(val, float) and (val != val)), f"metrics['core'][{key}] is NaN"


# ===========================================================================
# Test: Missing value handling (graceful imputation)
# ===========================================================================
def test_missing_value_handling():
    """Model must handle rows with NaN without crashing."""
    if not model_artifacts_exist():
        pytest.skip("Model artifacts not yet built")
    
    from model2.predict import Model2Predictor
    predictor = Model2Predictor()
    
    with open(ARTIFACTS_DIR / "feature_spec.json") as f:
        spec = json.load(f)
    
    n = 20
    rng = np.random.default_rng(42)
    df = pd.DataFrame(rng.standard_normal((n, len(spec["feature_names"]))),
                      columns=spec["feature_names"])
    # Set half the values to NaN
    df.iloc[:, ::2] = np.nan
    
    proba = predictor.predict_conversion_proba(df)
    assert len(proba) == n, "Output length mismatch with missing values"
    assert (proba >= 0).all() and (proba <= 1).all(), "Probabilities out of range with NaN input"


# ===========================================================================
# Test: User history features use only strictly earlier data (no lookahead)
# ===========================================================================
def test_user_history_features_strictly_earlier():
    """Prove that user history features use ONLY data strictly earlier than search time."""
    from model2.phase3_features import build_history_features
    
    # Construct synthetic user search history across 4 dates
    user_data = pd.DataFrame({
        "user_id": [101, 101, 101, 102, 102],
        "date_time": pd.to_datetime([
            "2014-01-01 10:00:00",
            "2014-01-05 12:00:00",
            "2014-01-10 14:00:00",
            "2014-01-02 08:00:00",
            "2014-01-03 09:00:00",
        ]),
        "label": [1, 0, 1, 0, 1],  # user 101: books at t0, browses at t1, books at t2
    })
    
    hist = build_history_features(user_data, user_data, is_train_target=True)
    
    # Event 0 for user 101: First event ever
    # MUST have 0 prior intents and 0 prior booking rate (even though this event ended in a booking!)
    assert hist.iloc[0]["user_prior_intents"] == 0, "First search must have 0 prior intents"
    assert hist.iloc[0]["user_prior_booking_rate"] == 0.0, "First search must have 0.0 prior booking rate"
    
    # Event 1 for user 101: Second event (after 1 prior booking)
    # MUST have 1 prior intent and 1.0 prior booking rate (from event 0)
    assert hist.iloc[1]["user_prior_intents"] == 1, "Second search must have 1 prior intent"
    assert hist.iloc[1]["user_prior_booking_rate"] == 1.0, "Second search must reflect 1/1=1.0 booking rate"
    
    # Event 2 for user 101: Third event (after 1 booking and 1 click)
    # MUST have 2 prior intents and 0.5 prior booking rate (1 booking / 2 intents)
    assert hist.iloc[2]["user_prior_intents"] == 2, "Third search must have 2 prior intents"
    assert abs(hist.iloc[2]["user_prior_booking_rate"] - 0.5) < 1e-5, "Third search must reflect 1/2=0.5 rate"
    
    # Event 3 for user 102: First search
    assert hist.iloc[3]["user_prior_intents"] == 0, "User 102 first search must have 0 prior intents"
    assert hist.iloc[3]["user_prior_booking_rate"] == 0.0, "User 102 first search must have 0 prior rate"
    
    # Event 4 for user 102: Second search after 0 bookings
    assert hist.iloc[4]["user_prior_intents"] == 1, "User 102 second search must have 1 prior intent"
    assert hist.iloc[4]["user_prior_booking_rate"] == 0.0, "User 102 second search must reflect 0/1=0.0 rate"


# ===========================================================================
# Test: User history features respect booking event timestamp (no lookahead)
# ===========================================================================
def test_user_history_features_booking_event_timestamp():
    """
    Prove that a booking is counted ONLY if the booking event's timestamp is earlier
    than the current intent's first event, not merely if the earlier intent started earlier.
    Edge case: Intent 0 starts at 10:00, books at 12:00.
    Intent 1 starts at 11:00 (before Intent 0 booked). MUST NOT count Intent 0 as a booking!
    Intent 2 starts at 13:00 (after Intent 0 booked). MUST count Intent 0 as a booking!
    """
    from model2.phase3_features import build_history_features
    
    user_data = pd.DataFrame({
        "user_id": [201, 201, 201],
        "date_time": pd.to_datetime([
            "2014-05-01 10:00:00",  # Intent 0: starts 10:00
            "2014-05-01 11:00:00",  # Intent 1: starts 11:00 (before Intent 0 booked)
            "2014-05-01 13:00:00",  # Intent 2: starts 13:00 (after Intent 0 booked)
        ]),
        "booking_date_time": pd.to_datetime([
            "2014-05-01 12:00:00",  # Intent 0 booked at 12:00
            pd.NaT,
            pd.NaT,
        ]),
        "label": [1, 0, 0],
    })
    
    hist = build_history_features(user_data, user_data, is_train_target=True)
    
    # Intent 0: first search ever
    assert hist.iloc[0]["user_prior_intents"] == 0, "Intent 0 must have 0 prior intents"
    assert hist.iloc[0]["user_prior_booking_rate"] == 0.0, "Intent 0 must have 0.0 prior booking rate"
    
    # Intent 1: starts at 11:00, BEFORE Intent 0 booked at 12:00!
    # Must have 1 prior intent, but 0 prior bookings!
    assert hist.iloc[1]["user_prior_intents"] == 1, "Intent 1 must have 1 prior intent"
    assert hist.iloc[1]["user_prior_booking_rate"] == 0.0, (
        f"Intent 1 started at 11:00 before Intent 0 booked at 12:00; "
        f"booking rate must be 0.0, got {hist.iloc[1]['user_prior_booking_rate']}"
    )
    
    # Intent 2: starts at 13:00, AFTER Intent 0 booked at 12:00!
    # Must have 2 prior intents and 1 prior booking (rate = 1/2 = 0.5)
    assert hist.iloc[2]["user_prior_intents"] == 2, "Intent 2 must have 2 prior intents"
    assert abs(hist.iloc[2]["user_prior_booking_rate"] - 0.5) < 1e-5, (
        f"Intent 2 started at 13:00 after Intent 0 booked at 12:00; "
        f"booking rate must be 0.5, got {hist.iloc[2]['user_prior_booking_rate']}"
    )


# ===========================================================================
# Test: Logit-intercept recalibration
# ===========================================================================
def test_logit_intercept_recalibration():
    """Test mathematical properties of logit-intercept recalibration."""
    from model2.predict import recalibrate_logit_intercept
    
    probs = np.array([0.05, 0.10, 0.20, 0.50, 0.80])
    
    # 1. Identity when actual == predicted
    rec_identity = recalibrate_logit_intercept(probs, actual_matured_rate=0.18, predicted_matured_rate=0.18)
    np.testing.assert_array_almost_equal(probs, rec_identity, decimal=5)
    
    # 2. Downward adjustment when actual < predicted (overprediction correction)
    rec_down = recalibrate_logit_intercept(probs, actual_matured_rate=0.15, predicted_matured_rate=0.20)
    assert (rec_down <= probs).all(), "Recalibrated probabilities must decrease when actual < predicted"
    assert (rec_down >= 0.0).all() and (rec_down <= 1.0).all(), "Must remain in [0, 1]"
    # Monotonicity check
    assert np.all(np.diff(rec_down) > 0), "Recalibration must preserve strict monotonicity"
    
    # 3. Upward adjustment when actual > predicted
    rec_up = recalibrate_logit_intercept(probs, actual_matured_rate=0.25, predicted_matured_rate=0.20)
    assert (rec_up >= probs).all(), "Recalibrated probabilities must increase when actual > predicted"
    assert (rec_up >= 0.0).all() and (rec_up <= 1.0).all(), "Must remain in [0, 1]"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
