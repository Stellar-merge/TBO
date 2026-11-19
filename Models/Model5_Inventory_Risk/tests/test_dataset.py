"""
test_dataset.py — Comprehensive Dataset Integrity & Schema Tests for Model 5.

Verifies:
- Datasets load properly from Datasets_Model5
- Target labels are strictly 0, 1, 2
- Opportunity IDs are globally unique within each split
- Chronological split non-overlap: max(Train) < min(Val) < max(Val) < min(Test)
- Zero scenario overlap across splits
- Zero nulls in predictive features
"""
import sys
from pathlib import Path
import pytest
import pandas as pd
import numpy as np

# Add src to path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from model5.config import (
    DATASETS_ROOT,
    TRAIN_DATASET_PARQUET,
    VAL_DATASET_PARQUET,
    TEST_DATASET_PARQUET,
    MASTER_DATASET_PARQUET
)
from model5.features import ALL_PREDICTIVE_FEATURES, TARGET_COLUMNS, FORBIDDEN_OUTCOME_COLUMNS


def test_master_dataset_integrity():
    """Validates master parquet file existence, schema, and row counts."""
    assert MASTER_DATASET_PARQUET.exists(), f"Master dataset not found at {MASTER_DATASET_PARQUET}"
    df = pd.read_parquet(MASTER_DATASET_PARQUET)
    assert len(df) == 23576, f"Expected 23,576 rows, found {len(df)}"
    assert df["opportunity_id"].nunique() == len(df), "Opportunity IDs must be globally unique!"
    assert df.isnull().sum().sum() == 0, "Master dataset must contain 0 null values!"


def test_target_labels():
    """Validates target classes and mapping."""
    df = pd.read_parquet(MASTER_DATASET_PARQUET)
    assert set(df["risk_class"].unique()) == {0, 1, 2}, "Target risk_class must strictly contain classes 0, 1, 2"
    assert set(df["risk_label"].unique()) == {"BALANCED", "UNSOLD", "SHORTAGE"}
    
    # Check class mapping consistency
    assert (df[df["risk_class"] == 0]["risk_label"] == "BALANCED").all()
    assert (df[df["risk_class"] == 1]["risk_label"] == "UNSOLD").all()
    assert (df[df["risk_class"] == 2]["risk_label"] == "SHORTAGE").all()


def test_split_integrity_and_chronology():
    """Validates chronological non-overlap and scenario grouping across splits."""
    train_df = pd.read_parquet(TRAIN_DATASET_PARQUET)
    val_df = pd.read_parquet(VAL_DATASET_PARQUET)
    test_df = pd.read_parquet(TEST_DATASET_PARQUET)
    
    assert len(train_df) == 10904, f"Expected 10,904 train rows, got {len(train_df)}"
    assert len(val_df) == 4896, f"Expected 4,896 validation rows, got {len(val_df)}"
    assert len(test_df) == 7776, f"Expected 7,776 test rows, got {len(test_df)}"
    
    # Chronological boundaries
    max_train = train_df["checkin_date"].max()
    min_val = val_df["checkin_date"].min()
    max_val = val_df["checkin_date"].max()
    min_test = test_df["checkin_date"].min()
    
    assert max_train < min_val, f"Chronological violation: max(Train)={max_train} >= min(Val)={min_val}"
    assert max_val < min_test, f"Chronological violation: max(Val)={max_val} >= min(Test)={min_test}"


def test_zero_scenario_leakage_across_splits():
    """Verifies that scenarios derived from the same stay date are never split across partitions."""
    train_df = pd.read_parquet(TRAIN_DATASET_PARQUET)
    val_df = pd.read_parquet(VAL_DATASET_PARQUET)
    test_df = pd.read_parquet(TEST_DATASET_PARQUET)
    
    dates_train = set(train_df["checkin_date"])
    dates_val = set(val_df["checkin_date"])
    dates_test = set(test_df["checkin_date"])
    
    assert len(dates_train.intersection(dates_val)) == 0, "Scenario overlap between Train and Validation!"
    assert len(dates_val.intersection(dates_test)) == 0, "Scenario overlap between Validation and Test!"
    assert len(dates_train.intersection(dates_test)) == 0, "Scenario overlap between Train and Test!"
