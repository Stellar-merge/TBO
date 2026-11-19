"""
config.py — Centralized Configuration and Path Management for Model 5.

Provides portable paths across local development environments, containers,
and CI/CD runners, resolving paths relative to the project directory.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict

# Resolve project root: Model5_Inventory_Risk/
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Workspace root: D:\Competition\Voyage_Hack (parent of Model5_Inventory_Risk)
WORKSPACE_ROOT = PROJECT_ROOT.parent

# Datasets root: D:\Competition\Voyage_Hack\Datasets\Datasets_Model5
DEFAULT_DATASETS_ROOT = (WORKSPACE_ROOT / "Datasets" / "Datasets_Model5").resolve()

# Allow override via environment variable if needed
DATASETS_ROOT = Path(os.getenv("MODEL5_DATASETS_DIR", str(DEFAULT_DATASETS_ROOT))).resolve()

# Dataset subdirectories
RAW_DIR = DATASETS_ROOT / "raw"
INTERIM_DIR = DATASETS_ROOT / "interim"
PROCESSED_DIR = DATASETS_ROOT / "processed"

# Specific dataset paths
RAW_HOTELS_CSV = RAW_DIR / "historical_bookings" / "hotels.csv"
INTERIM_CLEANED_BOOKINGS = INTERIM_DIR / "cleaned_data" / "hotel_bookings_cleaned.parquet"
INTERIM_DAILY_DEMAND = INTERIM_DIR / "aggregated_data" / "daily_demand_pace.parquet"
MASTER_DATASET_PARQUET = PROCESSED_DIR / "final_dataset" / "model5_inventory_risk_dataset.parquet"
MASTER_DATASET_CSV_SAMPLE = PROCESSED_DIR / "final_dataset" / "model5_inventory_risk_dataset.csv"
TRAIN_DATASET_PARQUET = PROCESSED_DIR / "train" / "model5_train.parquet"
VAL_DATASET_PARQUET = PROCESSED_DIR / "validation" / "model5_validation.parquet"
TEST_DATASET_PARQUET = PROCESSED_DIR / "test" / "model5_test.parquet"

# Project directories (inside Model5_Inventory_Risk)
SRC_DIR = PROJECT_ROOT / "src"
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
DOCS_DIR = PROJECT_ROOT / "docs"
REPORTS_DIR = DOCS_DIR / "reports"
METADATA_DIR = PROJECT_ROOT / "metadata"
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
LOGS_DIR = PROJECT_ROOT / "logs"
TESTS_DIR = PROJECT_ROOT / "tests"

# Metadata and schema paths
DATASET_AUDIT_JSON = METADATA_DIR / "dataset_audit.json"
DATASET_MANIFEST_CSV = METADATA_DIR / "dataset_manifest.csv"
FEATURE_SCHEMA_JSON = METADATA_DIR / "model5_feature_schema.json"
DATA_DICTIONARY_MD = DOCS_DIR / "model5_data_dictionary.md"

CONFIG_FILE = PROJECT_ROOT / "config.yaml"


def load_config() -> Dict[str, Any]:
    """Loads configuration dictionary from config.yaml if available."""
    if CONFIG_FILE.exists():
        try:
            import yaml
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        except Exception:
            pass
    return {
        "project": {"name": "Model 5 - Inventory Risk Prediction", "algorithm": "Random Forest Classifier"},
        "paths": {
            "project_root": str(PROJECT_ROOT),
            "datasets_root": str(DATASETS_ROOT),
        }
    }
