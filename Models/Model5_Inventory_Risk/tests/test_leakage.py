"""
test_leakage.py — Data Leakage & Zero-Lookahead Automated Safeguard Tests.

Verifies:
- Any forbidden outcome column passed to feature pipeline triggers an immediate ValueError.
- Target columns passed as predictive features trigger a ValueError.
- Preprocessor strictly rejects contaminated feature matrices.
- All records have decision_timestamp strictly earlier than checkin_date.
"""
import sys
from pathlib import Path
import pytest
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from model5.features import (
    ALL_PREDICTIVE_FEATURES,
    FORBIDDEN_OUTCOME_COLUMNS,
    TARGET_COLUMNS,
    validate_features_dataframe
)
from model5.config import MASTER_DATASET_PARQUET


def test_forbidden_outcome_columns_rejected():
    """Confirms that including any realized outcome column raises a ValueError."""
    for forbidden_col in FORBIDDEN_OUTCOME_COLUMNS:
        bad_df = pd.DataFrame({
            "procured_quantity": [50.0],
            "supplier_capacity": [100.0],
            forbidden_col: [12.0]
        })
        with pytest.raises(ValueError, match="DATA LEAKAGE DETECTED"):
            validate_features_dataframe(bad_df, strict_leakage_check=True)


def test_target_columns_rejected():
    """Confirms that including target columns in the feature matrix raises a ValueError."""
    for target_col in TARGET_COLUMNS:
        bad_df = pd.DataFrame({
            "procured_quantity": [50.0],
            "supplier_capacity": [100.0],
            target_col: [1]
        })
        with pytest.raises(ValueError, match="TARGET LEAKAGE DETECTED"):
            validate_features_dataframe(bad_df, strict_leakage_check=True)


def test_strict_temporal_ordering_in_dataset():
    """Verifies that decision_timestamp is strictly prior to checkin_date for 100% of records."""
    df = pd.read_parquet(MASTER_DATASET_PARQUET)
    dt = pd.to_datetime(df["decision_timestamp"])
    ci = pd.to_datetime(df["checkin_date"])
    
    assert (dt < ci).all(), "Temporal violation: Found records where decision_timestamp >= checkin_date!"
    diff_days = (ci - dt).dt.days
    assert (diff_days >= 14).all(), f"Minimum lead time violated: min days = {diff_days.min()}"
