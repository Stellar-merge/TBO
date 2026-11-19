"""
Phase 3: Leakage-safe feature engineering.
All features must be known at the time of the first search event.
Writes: data/processed/features_train.parquet (and val/cal/test)
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import json
import warnings
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import pyarrow.parquet as pq
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

from .utils import load_config, get_project_root, setup_logging


def compute_lead_time(df: pd.DataFrame) -> pd.Series:
    """Days between search date and check-in. Known at search time."""
    dt = pd.to_datetime(df["date_time"], errors="coerce")
    ci = pd.to_datetime(df["srch_ci"], errors="coerce")
    return (ci - dt.dt.normalize()).dt.days.clip(lower=0).fillna(-1)


def compute_los(df: pd.DataFrame) -> pd.Series:
    """Length of stay in nights. Known at search time."""
    ci = pd.to_datetime(df["srch_ci"], errors="coerce")
    co = pd.to_datetime(df["srch_co"], errors="coerce")
    return (co - ci).dt.days.clip(lower=0, upper=365).fillna(-1)


def compute_date_features(df: pd.DataFrame) -> pd.DataFrame:
    """Date/time features from search datetime. Known at search time."""
    dt = pd.to_datetime(df["date_time"], errors="coerce")
    ci = pd.to_datetime(df["srch_ci"], errors="coerce")
    out = pd.DataFrame(index=df.index)
    out["search_year"] = dt.dt.year.fillna(-1).astype(int)
    out["search_month"] = dt.dt.month.fillna(-1).astype(int)
    out["search_dow"] = dt.dt.dayofweek.fillna(-1).astype(int)
    out["search_hour"] = dt.dt.hour.fillna(-1).astype(int)
    out["checkin_month"] = ci.dt.month.fillna(-1).astype(int)
    out["checkin_dow"] = ci.dt.dayofweek.fillna(-1).astype(int)
    # Saturday night stay (weekend flag)
    co = pd.to_datetime(df["srch_co"], errors="coerce")
    # Does the stay include Saturday?
    ci_dow = ci.dt.dayofweek  # 5=Saturday
    los = (co - ci).dt.days.fillna(0)
    out["has_saturday_night"] = (
        ((6 - ci_dow) % 7 < los) | (ci_dow == 5)
    ).astype(int)
    return out


def compute_party_features(df: pd.DataFrame) -> pd.DataFrame:
    """Party composition. Known at search time."""
    out = pd.DataFrame(index=df.index)
    out["num_adults"] = df["srch_adults_cnt"].fillna(1).clip(1, 20).astype(int)
    out["num_children"] = df["srch_children_cnt"].fillna(0).clip(0, 10).astype(int)
    out["num_rooms"] = df["srch_rm_cnt"].fillna(1).clip(1, 10).astype(int)
    out["has_children"] = (out["num_children"] > 0).astype(int)
    out["adults_per_room"] = (out["num_adults"] / out["num_rooms"]).round(2)
    out["total_guests"] = out["num_adults"] + out["num_children"]
    return out


def frequency_encode(df: pd.DataFrame, col: str, freq_map: dict | None = None) -> tuple:
    """Frequency-encode a column. Returns encoded series and freq_map (from train)."""
    if freq_map is None:
        freq_map = df[col].value_counts(normalize=True).to_dict()
    encoded = df[col].map(freq_map).fillna(freq_map.get("__unknown__", 0.0))
    return encoded, freq_map


def compute_distance_features(df: pd.DataFrame) -> pd.DataFrame:
    """Distance features with missing indicator."""
    out = pd.DataFrame(index=df.index)
    dist = df["orig_destination_distance"].copy()
    out["dist_missing"] = dist.isna().astype(int)
    out["orig_destination_distance"] = np.log1p(dist.fillna(0).clip(lower=0))
    return out


def build_pca_features(destinations_path: Path, labeled_df: pd.DataFrame,
                        n_components: int, is_train: bool,
                        pca_model=None, scaler=None, pca_dest_df=None) -> tuple:
    """
    Build PCA features from destinations.csv latent features.
    Fit PCA only on train; transform all splits.
    Returns: pca_df, pca_model, scaler, pca_dest_df
    """
    dest_id_col = "srch_destination_id"
    if pca_dest_df is None:
        dest_df = pd.read_csv(destinations_path)
        latent_cols = [c for c in dest_df.columns if c.startswith("d") and c[1:].isdigit()]
        
        if is_train or pca_model is None:
            X = dest_df[latent_cols].fillna(0).values
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            pca_model = PCA(n_components=min(n_components, len(latent_cols)), random_state=42)
            pca_components = pca_model.fit_transform(X_scaled)
        else:
            X = dest_df[latent_cols].fillna(0).values
            X_scaled = scaler.transform(X)
            pca_components = pca_model.transform(X_scaled)
            
        pca_col_names = [f"dest_pca_{i}" for i in range(pca_components.shape[1])]
        pca_dest_df = pd.DataFrame(pca_components, columns=pca_col_names)
        pca_dest_df[dest_id_col] = dest_df[dest_id_col].values
    else:
        pca_col_names = [c for c in pca_dest_df.columns if c.startswith("dest_pca_")]
    
    # Merge into labeled_df
    merged = labeled_df[[dest_id_col]].merge(pca_dest_df, on=dest_id_col, how="left")
    for col in pca_col_names:
        merged[col] = merged[col].fillna(0.0)
    
    return merged[pca_col_names], pca_model, scaler, pca_dest_df


def build_history_features(train_df: pd.DataFrame, target_df: pd.DataFrame,
                            is_train_target: bool) -> pd.DataFrame:
    """
    Time-respecting user history features.
    Counts a booking ONLY if the booking event's timestamp is strictly earlier than
    the current intent's first event timestamp (no temporal lookahead).
    For train: computed via event sweep-line across user history.
    For val/cal/test: computed from training history using only bookings that matured
    within the training period (booking_date_time <= max(train_df['date_time'])).
    """
    out = pd.DataFrame(index=target_df.index)
    
    if is_train_target:
        n = len(train_df)
        if "booking_date_time" in train_df.columns:
            b_dt = train_df["booking_date_time"]
        else:
            b_dt = train_df["date_time"].where(train_df["label"] == 1, pd.NaT)
            
        s_uids = train_df["user_id"].values
        s_times = pd.to_datetime(train_df["date_time"]).values.astype("int64")
        s_idxs = np.arange(n)
        
        b_mask = b_dt.notna()
        b_uids = train_df.loc[b_mask, "user_id"].values
        b_times = pd.to_datetime(b_dt[b_mask]).values.astype("int64")
        
        all_uids = np.concatenate([s_uids, b_uids])
        all_times = np.concatenate([s_times, b_times])
        # Search is 0, Booking is 1 (so if search and booking tie in time, search is processed before booking)
        all_types = np.concatenate([np.zeros(len(s_uids), dtype=np.int8), np.ones(len(b_uids), dtype=np.int8)])
        all_idxs = np.concatenate([s_idxs, np.full(len(b_uids), -1, dtype=np.int32)])
        
        order = np.lexsort((all_types, all_times, all_uids))
        all_uids = all_uids[order]
        all_types = all_types[order]
        all_idxs = all_idxs[order]
        
        prior_intents = np.zeros(n, dtype=np.int32)
        prior_bookings = np.zeros(n, dtype=np.int32)
        
        cur_user = None
        c_int = 0
        c_bk = 0
        for i in range(len(all_uids)):
            u = all_uids[i]
            if u != cur_user:
                cur_user = u
                c_int = 0
                c_bk = 0
            t = all_types[i]
            idx = all_idxs[i]
            if t == 0:
                prior_intents[idx] = c_int
                prior_bookings[idx] = c_bk
                c_int += 1
            else:
                c_bk += 1
                
        out["user_prior_intents"] = np.clip(prior_intents, 0, 500)
        with np.errstate(divide="ignore", invalid="ignore"):
            prior_rate = np.where(prior_intents > 0, prior_bookings / np.maximum(prior_intents, 1), 0.0)
        out["user_prior_booking_rate"] = np.clip(prior_rate, 0.0, 1.0)
    else:
        # For val/cal/test: compute from training period history only
        ts_train_max = train_df["date_time"].max()
        if "booking_date_time" in train_df.columns:
            valid_booking = (train_df["booking_date_time"].notna()) & (train_df["booking_date_time"] <= ts_train_max)
        else:
            valid_booking = train_df["label"] == 1
            
        train_user_stats = train_df.groupby("user_id").agg(
            user_prior_intents=("user_id", "count"),
        ).copy()
        train_user_bookings = train_df[valid_booking].groupby("user_id").size()
        train_user_stats["user_prior_bookings"] = train_user_bookings
        train_user_stats["user_prior_bookings"] = train_user_stats["user_prior_bookings"].fillna(0).astype(int)
        train_user_stats["user_prior_booking_rate"] = (
            train_user_stats["user_prior_bookings"] / train_user_stats["user_prior_intents"].clip(lower=1)
        )
        
        merged = target_df[["user_id"]].merge(
            train_user_stats[["user_prior_intents", "user_prior_booking_rate"]],
            on="user_id", how="left"
        )
        out["user_prior_intents"] = merged["user_prior_intents"].fillna(0).values.clip(0, 500)
        out["user_prior_booking_rate"] = merged["user_prior_booking_rate"].fillna(0.0).values.clip(0, 1)
    
    return out


def run_phase3(labeled_df: pd.DataFrame | None = None,
               split_dfs: dict | None = None) -> dict:
    """
    Run feature engineering on the labeled dataset (or on pre-split dfs).
    Returns feature DataFrames for each split.
    """
    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "phase3_features")
    logger.info("Phase 3: Feature engineering")

    interim_dir = root / cfg["paths"]["data"]["interim"]
    processed_dir = root / cfg["paths"]["data"]["processed"]
    processed_dir.mkdir(parents=True, exist_ok=True)

    if labeled_df is None:
        labeled_df = pd.read_parquet(interim_dir / "labeled_groups.parquet")
        logger.info(f"Loaded labeled_groups.parquet: {labeled_df.shape}")

    # Load splits if provided externally (from phase 4)
    if split_dfs is not None:
        logger.info("Using pre-split DataFrames")
        splits = split_dfs
    else:
        # Will be called from phase 4 with splits
        splits = {"all": labeled_df}

    # destinations.csv for PCA
    raw_path = Path(cfg["paths"]["data"]["raw_expedia"])
    dest_path = raw_path / cfg["data"]["expedia"]["destinations_csv"]
    n_pca = cfg["features"]["pca_components"]
    freq_encode_cols = cfg["features"]["freq_encode_cols"]

    # We need train split to fit PCA and freq encoders
    train_df = splits.get("train", splits.get("all"))
    
    logger.info("Building PCA features (fit on train)...")
    _, pca_model, pca_scaler, pca_dest_df = build_pca_features(
        dest_path, train_df, n_pca, is_train=True
    )

    # Frequency encoding maps (fit on train)
    logger.info("Building frequency encoders (fit on train)...")
    freq_maps = {}
    for col in freq_encode_cols:
        if col in train_df.columns:
            _, freq_map = frequency_encode(train_df, col)
            freq_map["__unknown__"] = 0.0
            freq_maps[col] = freq_map

    feature_names = []
    result = {}

    for split_name, df in splits.items():
        logger.info(f"Engineering features for split: {split_name} ({len(df):,} rows)")
        is_train = (split_name == "train")

        # 1. Date features
        date_feats = compute_date_features(df)
        
        # 2. Lead time and LOS
        lead_time = compute_lead_time(df).rename("lead_time_days")
        los = compute_los(df).rename("length_of_stay_nights")
        
        # 3. Party features
        party_feats = compute_party_features(df)
        
        # 4. Distance features
        dist_feats = compute_distance_features(df)
        
        # 5. Static features (passthrough)
        static_cols = ["is_mobile", "is_package", "channel", "site_name",
                       "posa_continent", "srch_destination_type_id",
                       "hotel_continent", "hotel_country", "hotel_market"]
        static_feats = df[[c for c in static_cols if c in df.columns]].copy()
        # Fill missing
        for c in static_feats.columns:
            if static_feats[c].dtype in [object, "string"]:
                static_feats[c] = static_feats[c].fillna("unknown")
            else:
                static_feats[c] = static_feats[c].fillna(-1)
        
        # 6. Frequency-encoded cols
        freq_feats = pd.DataFrame(index=df.index)
        for col in freq_encode_cols:
            if col in df.columns:
                encoded, _ = frequency_encode(df, col, freq_maps.get(col))
                freq_feats[f"{col}_freq"] = encoded
        
        # 7. PCA destination features
        pca_feats, _, _, _ = build_pca_features(
            dest_path, df, n_pca, is_train=False,
            pca_model=pca_model, scaler=pca_scaler, pca_dest_df=pca_dest_df
        )
        
        # 8. User history features
        if split_name == "train":
            hist_feats = build_history_features(df, df, is_train_target=True)
        else:
            hist_feats = build_history_features(train_df, df, is_train_target=False)
        
        # --- Combine all features ---
        all_feats = pd.concat([
            date_feats.reset_index(drop=True),
            lead_time.reset_index(drop=True).to_frame(),
            los.reset_index(drop=True).to_frame(),
            party_feats.reset_index(drop=True),
            dist_feats.reset_index(drop=True),
            static_feats.reset_index(drop=True),
            freq_feats.reset_index(drop=True),
            pca_feats.reset_index(drop=True),
            hist_feats.reset_index(drop=True),
        ], axis=1)
        
        # Add label
        all_feats["label"] = df["label"].values
        
        # Add timestamp for reference
        if "date_time" in df.columns:
            all_feats["date_time"] = pd.to_datetime(df["date_time"].values)
        
        # Save
        out_path = processed_dir / f"features_{split_name}.parquet"
        all_feats.to_parquet(out_path, index=False, engine="pyarrow")
        logger.info(f"Saved {split_name} features: {all_feats.shape} -> {out_path}")
        
        result[split_name] = all_feats
        
        if split_name == "train":
            feature_names = [c for c in all_feats.columns if c not in ["label", "date_time"]]

    # Save feature spec
    _save_feature_spec(feature_names, freq_maps, pca_model, pca_scaler, cfg, root, logger)
    
    # Save encoders
    import joblib
    artifacts_dir = root / cfg["paths"]["artifacts"]
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump({"freq_maps": freq_maps, "pca_model": pca_model, "pca_scaler": pca_scaler},
                artifacts_dir / "encoders.joblib")
    logger.info("Phase 3 complete.")
    return result


def _save_feature_spec(feature_names: list, freq_maps: dict, pca_model,
                        pca_scaler, cfg: dict, root: Path, logger):
    """Save feature_spec.json for packaging."""
    artifacts_dir = root / cfg["paths"]["artifacts"]
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    
    spec = {
        "feature_names": feature_names,
        "n_features": len(feature_names),
        "freq_encoded_cols": list(freq_maps.keys()),
        "pca_components": pca_model.n_components_ if pca_model else 0,
        "note": "PUBLIC CONSUMER DATA - NOT TBO B2B",
        "forbidden_cols": ["hotel_cluster", "cnt", "is_booking"],
        "missing_handling": {
            "orig_destination_distance": "log1p(0) + dist_missing indicator",
            "default_numeric": "fill with -1",
            "default_categorical": "fill with 'unknown'",
        },
        "tbo_additional_features": [
            "quoted_rate_usd (from pricing engine)",
            "rate_vs_market_pct (rate competitiveness)",
            "rooms_available (live availability)",
            "cancellation_flexibility_flag",
            "b2b_agent_id_freq_encoded",
            "agency_prior_booking_rate",
        ],
    }
    
    with open(artifacts_dir / "feature_spec.json", "w") as f:
        json.dump(spec, f, indent=2)
    
    # Write feature contract
    docs_dir = root / cfg["paths"]["docs"]
    docs_dir.mkdir(parents=True, exist_ok=True)
    _write_feature_contract(feature_names, docs_dir)
    logger.info("Feature spec and contract written.")


def _write_feature_contract(feature_names: list, docs_dir: Path):
    path = docs_dir / "feature_contract.md"
    with open(path, "w", encoding="utf-8") as f:
        f.write("# Feature Contract\n\n")
        f.write("> **Data is public consumer-travel proxy data, NOT TBO B2B data.**\n\n")
        f.write("Every feature must be known at the time of the first search event (prediction time).\n\n")
        f.write("## Feature Definitions\n\n")
        f.write("| TBO Name | Source | Dataset | Justification | Available at Search Time? |\n")
        f.write("|----------|--------|---------|--------------|---------------------------|\n")
        
        contracts = {
            "lead_time_days": ("lead_time_days", "srch_ci - date_time", "Expedia", "Known when search is made", "✅"),
            "length_of_stay_nights": ("length_of_stay_nights", "srch_co - srch_ci", "Expedia", "Entered by user", "✅"),
            "num_adults": ("num_adults", "srch_adults_cnt", "Expedia", "Entered by user", "✅"),
            "num_children": ("num_children", "srch_children_cnt", "Expedia", "Entered by user", "✅"),
            "num_rooms": ("num_rooms", "srch_rm_cnt", "Expedia", "Entered by user", "✅"),
            "has_children": ("has_children", "derived", "Expedia", "Party composition flag", "✅"),
            "adults_per_room": ("adults_per_room", "derived", "Expedia", "Density metric", "✅"),
            "total_guests": ("total_guests", "derived", "Expedia", "Party size", "✅"),
            "is_mobile": ("is_mobile", "is_mobile", "Expedia", "Device type at search time", "✅"),
            "is_package": ("is_package", "is_package", "Expedia", "Package flag at search time", "✅"),
            "channel": ("channel", "channel", "Expedia", "Booking channel known at search", "✅"),
            "site_name": ("site_name", "site_name", "Expedia", "Site/portal identifier", "✅"),
            "posa_continent": ("posa_continent", "posa_continent", "Expedia", "Point-of-sale continent", "✅"),
            "search_month": ("search_month", "date_time.month", "Expedia", "Seasonality", "✅"),
            "search_dow": ("search_dow", "date_time.dayofweek", "Expedia", "Day-of-week pattern", "✅"),
            "search_hour": ("search_hour", "date_time.hour", "Expedia", "Time-of-day pattern", "✅"),
            "checkin_month": ("checkin_month", "srch_ci.month", "Expedia", "Seasonality of stay", "✅"),
            "checkin_dow": ("checkin_dow", "srch_ci.dayofweek", "Expedia", "Weekend/weekday start", "✅"),
            "has_saturday_night": ("has_saturday_night", "derived", "Expedia", "Weekend stay flag", "✅"),
            "orig_destination_distance": ("orig_destination_distance", "log1p(dist)", "Expedia", "Physical distance (may be missing)", "✅"),
            "dist_missing": ("dist_missing", "distance is null", "Expedia", "Distance missingness indicator", "✅"),
            "srch_destination_type_id": ("destination_type", "srch_destination_type_id", "Expedia", "Type of destination", "✅"),
            "user_prior_intents": ("user_prior_intents", "time-respecting count", "Expedia", "Past engagement (time-safe)", "✅"),
            "user_prior_booking_rate": ("user_prior_booking_rate", "time-respecting rate", "Expedia", "Past conversion (time-safe)", "✅"),
        }
        
        for feat_name, (tbo_name, source, dataset, justification, available) in contracts.items():
            f.write(f"| {tbo_name} | {source} | {dataset} | {justification} | {available} |\n")
        
        f.write("\n## Frequency-Encoded High-Cardinality Features\n\n")
        f.write("| TBO Name | Column | Note |\n|----------|--------|------|\n")
        f.write("| destination_id | srch_destination_id_freq | Freq of destination in training | \n")
        f.write("| hotel_market | hotel_market_freq | Freq of hotel market | \n")
        f.write("| user_country | user_location_country_freq | Freq of user country | \n")
        f.write("| user_region | user_location_region_freq | Freq of user region | \n")
        
        f.write("\n## Destination PCA Features\n\n")
        f.write("| TBO Name | Note |\n|----------|------|\n")
        f.write("| dest_pca_0..N | PCA of destinations.csv latent features, fit on train only |\n")
        
        f.write("\n## Excluded Features (Leakage or Post-Event)\n\n")
        f.write("| Column | Reason |\n|--------|--------|\n")
        f.write("| hotel_cluster | Determined by clicked/booked hotel — post-event |\n")
        f.write("| cnt | Count of events in group — only known after the fact |\n")
        f.write("| user_id | Raw ID — high cardinality, not predictive raw |\n")
        f.write("| is_booking | The label itself |\n")
        
        f.write("\n## Optional TBO-Only Features (for retraining on real data)\n\n")
        f.write("| Feature | Description |\n|---------|-------------|\n")
        f.write("| quoted_rate_usd | Actual quoted price — not available in Expedia data |\n")
        f.write("| rate_vs_market_pct | Competitiveness vs market rate |\n")
        f.write("| rooms_available | Live availability count |\n")
        f.write("| cancellation_flexibility_flag | Whether booking is flexible |\n")
        f.write("| b2b_agent_id | B2B travel agent identifier |\n")
        f.write("| agency_prior_booking_rate | Agency's historical conversion rate |\n")
        
        f.write("\n## Note on Price\n\n")
        f.write("Expedia Hotel Recommendations dataset has NO price or availability columns. ")
        f.write("The model cannot learn price effects. This is a known limitation. ")
        f.write("When retrained on TBO data, price features should be added first.\n")


if __name__ == "__main__":
    run_phase3()
