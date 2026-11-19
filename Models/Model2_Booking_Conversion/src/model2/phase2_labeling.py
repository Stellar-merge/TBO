"""
Phase 2: Label definition and unit of analysis.
Build ONE ROW PER SEARCH INTENT from the Expedia dataset.
Label = 1 if any event in the group has is_booking = 1.
Writes: data/interim/labeled_groups.parquet (or falls back to event-level)
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from .utils import load_config, get_project_root, setup_logging


GROUP_COLS = [
    "user_id", "srch_destination_id", "srch_ci", "srch_co",
    "srch_rm_cnt", "srch_adults_cnt", "srch_children_cnt"
]

# Columns to keep at first event (known at search time)
KEEP_COLS = [
    "date_time", "site_name", "posa_continent", "user_location_country",
    "user_location_region", "user_location_city", "orig_destination_distance",
    "user_id", "is_mobile", "is_package", "channel",
    "srch_ci", "srch_co", "srch_adults_cnt", "srch_children_cnt", "srch_rm_cnt",
    "srch_destination_id", "srch_destination_type_id",
    "is_booking", "booking_date_time", "hotel_continent", "hotel_country", "hotel_market",
    # NOT: hotel_cluster (post-event), cnt (post-event)
]


def run_phase2(use_sample: bool = True):
    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "phase2_labeling")
    logger.info("Phase 2: Label definition and unit of analysis")

    raw_path = Path(cfg["paths"]["data"]["raw_expedia"])
    train_path = raw_path / cfg["data"]["expedia"]["train_csv"]
    interim_dir = root / cfg["paths"]["data"]["interim"]
    interim_dir.mkdir(parents=True, exist_ok=True)
    decisions_dir = root / cfg["paths"]["docs"]
    decisions_dir.mkdir(parents=True, exist_ok=True)

    chunk_size = cfg["data"]["expedia"]["chunk_size"]
    sample_frac = (cfg["data"]["expedia"]["sample_frac"] if use_sample
                   else cfg["data"]["expedia"]["sample_frac_final"])
    seed = cfg["project"]["seed"]

    logger.info(f"Loading Expedia data, sample_frac={sample_frac}")

    # --- Pass 1: Determine which rows to keep (by user_id sampling) ---
    # Sample user_ids first to get a consistent sample
    # For memory: read user_ids first, sample, then filter
    if sample_frac < 1.0:
        logger.info("Pass 1: Collecting user_ids for sampling...")
        rng = np.random.default_rng(seed)
        user_ids_set = set()
        
        for chunk in pd.read_csv(train_path, chunksize=chunk_size,
                                  usecols=["user_id"], low_memory=False):
            uids = chunk["user_id"].unique()
            sampled = rng.choice(uids, size=max(1, int(len(uids) * sample_frac)),
                                 replace=False)
            user_ids_set.update(sampled.tolist())
        
        logger.info(f"Sampled {len(user_ids_set):,} unique user_ids")
    else:
        user_ids_set = None  # all users

    # --- Pass 2: Load and group ---
    logger.info("Pass 2: Loading data and building search-intent groups...")
    
    all_chunks = []
    total_rows = 0
    
    for i, chunk in enumerate(pd.read_csv(
            train_path, chunksize=chunk_size,
            parse_dates=["date_time", "srch_ci", "srch_co"],
            low_memory=False)):
        
        if user_ids_set is not None:
            chunk = chunk[chunk["user_id"].isin(user_ids_set)]
        
        # Track exact timestamp of booking event (if any)
        chunk["booking_date_time"] = chunk["date_time"].where(chunk["is_booking"] == 1)
        
        # Keep only needed columns
        keep = [c for c in KEEP_COLS if c in chunk.columns]
        chunk = chunk[keep]
        total_rows += len(chunk)
        all_chunks.append(chunk)
        
        if i % 10 == 0:
            logger.info(f"  chunk {i}: {total_rows:,} rows loaded")

    logger.info(f"Total rows loaded: {total_rows:,}")
    df = pd.concat(all_chunks, ignore_index=True)
    del all_chunks

    logger.info(f"DataFrame shape: {df.shape}")

    # --- Build search-intent groups ---
    logger.info("Building search-intent groups...")
    
    # Sort by date_time (ascending) so first event is the earliest
    df = df.sort_values("date_time").reset_index(drop=True)
    
    # For group features: use first event's attributes
    # Label: max(is_booking) per group
    # Timestamp: min(date_time) per group
    # Booking Timestamp: min(booking_date_time) per group (earliest booking event)
    
    group_cols_present = [c for c in GROUP_COLS if c in df.columns]
    
    agg_dict = {
        "is_booking": "max",   # label = 1 if any booking
        "date_time": "min",    # first event timestamp
        "booking_date_time": "min", # earliest booking event timestamp (NaT if no booking)
        # First-event attributes (take first after sorting)
        "site_name": "first",
        "posa_continent": "first",
        "user_location_country": "first",
        "user_location_region": "first",
        "user_location_city": "first",
        "orig_destination_distance": "first",
        "is_mobile": "first",
        "is_package": "first",
        "channel": "first",
        "srch_destination_type_id": "first",
        "hotel_continent": "first",
        "hotel_country": "first",
        "hotel_market": "first",
    }
    # only include cols that exist
    agg_dict = {k: v for k, v in agg_dict.items() if k in df.columns}
    
    grouped = df.groupby(group_cols_present, as_index=False).agg(agg_dict)
    
    n_groups = len(grouped)
    n_booking_groups = grouped["is_booking"].sum()
    group_base_rate = n_booking_groups / n_groups
    
    logger.info(f"Groups: {n_groups:,}")
    logger.info(f"Booking groups: {n_booking_groups:,}")
    logger.info(f"Group base rate: {group_base_rate:.4f}")
    
    # --- Degeneracy check ---
    # Check if single-row groups dominate
    group_sizes = df.groupby(group_cols_present).size()
    single_row_pct = (group_sizes == 1).mean()
    logger.info(f"Single-row groups: {single_row_pct:.3f} ({single_row_pct*100:.1f}%)")
    
    degenerate = False
    fallback_reason = None
    
    if group_base_rate > 0.95 or group_base_rate < 0.001:
        degenerate = True
        fallback_reason = f"Group base_rate={group_base_rate:.4f} is implausible"
        logger.warning(f"DEGENERACY DETECTED: {fallback_reason}")
    elif single_row_pct > 0.98:
        degenerate = True
        fallback_reason = f"single_row_pct={single_row_pct:.3f} — almost all groups have one row"
        logger.warning(f"DEGENERACY DETECTED: {fallback_reason}")
    
    if degenerate:
        logger.info("Falling back to event-level labelling")
        labeled_df = df.copy()
        labeled_df["label"] = labeled_df["is_booking"]
        unit = "event_level"
        label_desc = "is_booking at event level (fallback due to group degeneracy)"
        logger.info(f"Fallback reason: {fallback_reason}")
    else:
        labeled_df = grouped.copy()
        labeled_df["label"] = labeled_df["is_booking"]
        unit = "search_intent_group"
        label_desc = "max(is_booking) per search intent group"
    
    # Drop intermediate is_booking column (keep label)
    if "is_booking" in labeled_df.columns and "label" in labeled_df.columns:
        labeled_df = labeled_df.drop(columns=["is_booking"])
    
    logger.info(f"Final labeled dataset: {len(labeled_df):,} rows, label={labeled_df['label'].mean():.4f}")

    # --- Save to Parquet ---
    out_path = interim_dir / "labeled_groups.parquet"
    labeled_df.to_parquet(out_path, index=False, engine="pyarrow")
    logger.info(f"Saved labeled data to {out_path}")

    # --- Record decision ---
    decision = {
        "unit_of_analysis": unit,
        "label_description": label_desc,
        "group_cols": group_cols_present,
        "n_groups": int(n_groups),
        "n_booking_groups": int(n_booking_groups),
        "group_base_rate": float(group_base_rate),
        "single_row_pct": float(single_row_pct),
        "degenerate": degenerate,
        "fallback_reason": fallback_reason,
        "sample_frac": sample_frac,
        "total_raw_rows": total_rows,
    }
    
    decision_path = interim_dir / "phase2_decision.json"
    with open(decision_path, "w") as f:
        json.dump(decision, f, indent=2)
    
    # Append to DECISIONS.md
    _write_decision_md(decisions_dir, decision)
    
    logger.info("Phase 2 complete.")
    return labeled_df, decision


def _write_decision_md(docs_dir: Path, decision: dict):
    path = docs_dir / "DECISIONS.md"
    mode = "a" if path.exists() else "w"
    with open(path, mode, encoding="utf-8") as f:
        if mode == "w":
            f.write("# Design Decisions Log\n\n")
            f.write("> **Data is public consumer-travel proxy data, NOT TBO B2B data.**\n\n")
        f.write(f"\n## Phase 2: Unit of Analysis\n\n")
        f.write(f"**Date**: {datetime.now().isoformat()}\n\n")
        f.write(f"**Decision**: Unit of analysis = `{decision['unit_of_analysis']}`\n\n")
        f.write(f"**Label**: `{decision['label_description']}`\n\n")
        f.write(f"**Group columns**: `{decision['group_cols']}`\n\n")
        f.write(f"**Stats**:\n")
        f.write(f"- Groups: {decision['n_groups']:,}\n")
        f.write(f"- Booking groups: {decision['n_booking_groups']:,}\n")
        f.write(f"- Base rate: {decision['group_base_rate']:.4f}\n")
        f.write(f"- Single-row group %: {decision['single_row_pct']*100:.1f}%\n")
        if decision["degenerate"]:
            f.write(f"\n**FALLBACK TRIGGERED**: {decision['fallback_reason']}\n")
        f.write(f"\n**Rationale**: Search-intent grouping is preferred because it matches the ")
        f.write(f"B2B prediction task (a search/availability request → booking probability). ")
        f.write(f"Event-level labels double-count repeated clicks on the same intent.\n")


if __name__ == "__main__":
    import sys
    final = "--final" in sys.argv
    run_phase2(use_sample=not final)
