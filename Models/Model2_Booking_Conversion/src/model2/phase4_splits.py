"""
Phase 4: Chronological splits.
Split labeled data: train 60%, val 15%, cal 10%, test 15%.
No shuffling. Small gap between blocks.
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import timedelta

import pandas as pd
import numpy as np

from .utils import load_config, get_project_root, setup_logging


def run_phase4(labeled_df: pd.DataFrame | None = None) -> dict:
    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "phase4_splits")
    logger.info("Phase 4: Chronological splits")

    interim_dir = root / cfg["paths"]["data"]["interim"]
    processed_dir = root / cfg["paths"]["data"]["processed"]
    processed_dir.mkdir(parents=True, exist_ok=True)

    if labeled_df is None:
        labeled_df = pd.read_parquet(interim_dir / "labeled_groups.parquet")
        logger.info(f"Loaded labeled_groups.parquet: {labeled_df.shape}")

    # Ensure date_time is datetime
    labeled_df["date_time"] = pd.to_datetime(labeled_df["date_time"], errors="coerce")
    
    # Drop rows with no timestamp
    n_before = len(labeled_df)
    labeled_df = labeled_df.dropna(subset=["date_time"])
    logger.info(f"Dropped {n_before - len(labeled_df)} rows with null timestamps")

    # Sort chronologically
    labeled_df = labeled_df.sort_values("date_time").reset_index(drop=True)
    
    n = len(labeled_df)
    logger.info(f"Total rows for splitting: {n:,}")
    
    # Compute split indices
    train_frac = cfg["splits"]["train_frac"]
    val_frac = cfg["splits"]["val_frac"]
    cal_frac = cfg["splits"]["cal_frac"]
    test_frac = cfg["splits"]["test_frac"]
    gap_days = cfg["splits"]["gap_days"]
    
    # Cumulative fractions
    t1 = int(n * train_frac)
    t2 = int(n * (train_frac + val_frac))
    t3 = int(n * (train_frac + val_frac + cal_frac))
    
    # Get timestamps at boundaries
    ts_t1 = labeled_df["date_time"].iloc[t1]
    ts_t2 = labeled_df["date_time"].iloc[t2]
    ts_t3 = labeled_df["date_time"].iloc[t3]
    
    # Apply gap
    gap = timedelta(days=gap_days)
    
    # Train: everything before ts_t1
    # Val: everything after ts_t1 + gap, before ts_t2
    # Cal: everything after ts_t2 + gap, before ts_t3
    # Test: everything after ts_t3 + gap
    
    train_df = labeled_df[labeled_df["date_time"] < ts_t1].copy()
    val_df = labeled_df[
        (labeled_df["date_time"] >= ts_t1 + gap) &
        (labeled_df["date_time"] < ts_t2)
    ].copy()
    cal_df = labeled_df[
        (labeled_df["date_time"] >= ts_t2 + gap) &
        (labeled_df["date_time"] < ts_t3)
    ].copy()
    test_df = labeled_df[labeled_df["date_time"] >= ts_t3 + gap].copy()
    
    splits = {"train": train_df, "val": val_df, "cal": cal_df, "test": test_df}
    
    split_stats = {}
    for name, df in splits.items():
        base_rate = df["label"].mean() if len(df) > 0 else 0
        date_min = df["date_time"].min() if len(df) > 0 else None
        date_max = df["date_time"].max() if len(df) > 0 else None
        logger.info(
            f"{name}: {len(df):,} rows, base_rate={base_rate:.4f}, "
            f"date_range=[{date_min}, {date_max}]"
        )
        split_stats[name] = {
            "n_rows": len(df),
            "n_positive": int(df["label"].sum()),
            "base_rate": float(base_rate),
            "date_min": str(date_min),
            "date_max": str(date_max),
        }
    
    # Drift check: compare base rates
    base_rates = [split_stats[s]["base_rate"] for s in ["train", "val", "cal", "test"]]
    max_drift = max(base_rates) - min(base_rates)
    logger.info(f"Base rate drift across splits: {max_drift:.4f}")
    if max_drift > 0.05:
        logger.warning(f"DRIFT DETECTED: base rate varies by {max_drift:.4f} across splits!")
    
    split_stats["gap_days"] = gap_days
    split_stats["base_rate_drift"] = float(max_drift)
    split_stats["drift_warning"] = max_drift > 0.05
    
    # Save split stats
    with open(root / cfg["paths"]["data"]["interim"] / "split_stats.json", "w") as f:
        json.dump(split_stats, f, indent=2, default=str)
    
    # Save raw splits (before feature engineering)
    for name, df in splits.items():
        out_path = interim_dir / f"split_{name}_raw.parquet"
        df.to_parquet(out_path, index=False, engine="pyarrow")
        logger.info(f"Saved {name} raw split to {out_path}")
    
    logger.info("Phase 4 complete.")
    return splits, split_stats


if __name__ == "__main__":
    run_phase4()
