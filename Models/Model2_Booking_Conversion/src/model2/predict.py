"""
predict.py — Public inference module for Model 2: Booking Conversion Prediction.

Exports:
  - transform_raw_searches_to_features(data, artifacts_dir): raw search to 44 feature matrix
  - predict_conversion_proba(df): calibrated probabilities
  - recalibrate_logit_intercept(probs, actual_matured, predicted_matured): drift adjustment
  - expected_bookings(df, group_cols): aggregate predictions
  - explain_prediction(row, top_k=5): SHAP-based reasons
  - Model2Predictor: main prediction engine class

CLI usage:
  python -m model2.predict --input in.csv --output out.csv

NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
      This model MUST be recalibrated on TBO data before production use.
"""
from __future__ import annotations

import argparse
import datetime
import json
import sys
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

warnings.filterwarnings("ignore")

# Default artifact directory (relative to this file)
_DEFAULT_ARTIFACTS = Path(__file__).resolve().parent.parent.parent / "artifacts" / "model2"
_CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "config.yaml"

FORBIDDEN_COLS = ["hotel_cluster", "cnt", "is_booking"]

# Alias mapping for raw search inputs from frontend / client
FIELD_ALIASES = {
    "destination_id": "srch_destination_id",
    "checkin_date": "srch_ci",
    "checkout_date": "srch_co",
    "checkin": "srch_ci",
    "checkout": "srch_co",
    "adults": "srch_adults_cnt",
    "num_adults": "srch_adults_cnt",
    "children": "srch_children_cnt",
    "num_children": "srch_children_cnt",
    "rooms": "srch_rm_cnt",
    "num_rooms": "srch_rm_cnt",
    "search_datetime": "date_time",
    "distance": "orig_destination_distance",
}


def _check_forbidden_columns(df: pd.DataFrame) -> None:
    """Raise ValueError if any forbidden post-event columns are present."""
    forbidden_found = [c for c in FORBIDDEN_COLS if c in df.columns]
    if forbidden_found:
        raise ValueError(
            f"Input contains forbidden post-event columns: {forbidden_found}. "
            "These represent post-booking outcome leakage and cannot be used at inference time."
        )


def transform_raw_searches_to_features(
    data: Union[pd.DataFrame, Dict[str, Any], List[Dict[str, Any]]],
    artifacts_dir: Union[str, Path, None] = None,
) -> pd.DataFrame:
    """
    Transform raw search records into the exact 44-feature matrix required by Model 2.
    
    Guarantees:
      - 100% faithful to the training-time feature engineering pipeline.
      - Strict temporal safety: historical features use only prior matured events.
      - Cold-start handling: unseen users default to 0 prior intents and 0.0 prior rate.
      - Missing value robustness: distance and static fields filled with sensible defaults.
      - Forbidden columns (hotel_cluster, cnt, is_booking) raise ValueError.
      
    Args:
        data: Single dict, list of dicts, or pandas DataFrame of search queries.
        artifacts_dir: Optional path to artifacts directory.
        
    Returns:
        pd.DataFrame with exactly the 44 feature columns in the exact order.
    """
    artifacts_path = Path(artifacts_dir or _DEFAULT_ARTIFACTS)
    
    # Standardize input to DataFrame
    if isinstance(data, dict):
        df = pd.DataFrame([data])
    elif isinstance(data, list):
        df = pd.DataFrame(data)
    elif isinstance(data, pd.DataFrame):
        df = data.copy()
    else:
        raise TypeError(f"Expected dict, list of dicts, or DataFrame, got {type(data)}")

    # Check for forbidden columns early
    _check_forbidden_columns(df)

    # Load feature spec
    with open(artifacts_path / "feature_spec.json", encoding="utf-8") as f:
        spec = json.load(f)
    expected_cols = spec["feature_names"]

    # Check if the DataFrame already has all 44 feature columns
    if all(col in df.columns for col in expected_cols):
        return df[expected_cols].copy()

    # Apply alias mapping
    rename_dict = {}
    for alias, target in FIELD_ALIASES.items():
        if alias in df.columns and target not in df.columns:
            rename_dict[alias] = target
    if rename_dict:
        df = df.rename(columns=rename_dict)

    # Re-check forbidden columns after rename
    _check_forbidden_columns(df)

    n_rows = len(df)
    out = pd.DataFrame(index=df.index)

    now_utc = pd.Timestamp.now("UTC").tz_localize(None)

    # 1. Search datetime
    if "date_time" in df.columns and df["date_time"].notna().any():
        dt = pd.to_datetime(df["date_time"], errors="coerce")
        if hasattr(dt.dt, "tz") and dt.dt.tz is not None:
            dt = dt.dt.tz_convert("UTC").dt.tz_localize(None)
        # Fill missing with current UTC timestamp
        dt = dt.fillna(now_utc)
    else:
        dt = pd.Series([now_utc] * n_rows, index=df.index)

    # 2. Check-in and check-out dates
    if "srch_ci" in df.columns:
        ci = pd.to_datetime(df["srch_ci"], errors="coerce")
        if hasattr(ci.dt, "tz") and ci.dt.tz is not None:
            ci = ci.dt.tz_convert("UTC").dt.tz_localize(None)
    else:
        # Default: tomorrow
        default_ci = dt.dt.normalize() + pd.Timedelta(days=1)
        ci = default_ci

    if "srch_co" in df.columns:
        co = pd.to_datetime(df["srch_co"], errors="coerce")
        if hasattr(co.dt, "tz") and co.dt.tz is not None:
            co = co.dt.tz_convert("UTC").dt.tz_localize(None)
    else:
        # Default: 3 nights after check-in
        co = ci + pd.Timedelta(days=3)

    # Fallback for any unparseable dates
    ci = ci.fillna(dt.dt.normalize() + pd.Timedelta(days=1))
    co = co.fillna(ci + pd.Timedelta(days=3))

    # Date / Time features
    out["search_year"] = dt.dt.year.fillna(-1).astype(int)
    out["search_month"] = dt.dt.month.fillna(-1).astype(int)
    out["search_dow"] = dt.dt.day_of_week.fillna(-1).astype(int)
    out["search_hour"] = dt.dt.hour.fillna(-1).astype(int)
    out["checkin_month"] = ci.dt.month.fillna(-1).astype(int)
    out["checkin_dow"] = ci.dt.day_of_week.fillna(-1).astype(int)

    ci_dow = ci.dt.day_of_week
    los_raw = (co - ci).dt.days.fillna(0)
    out["has_saturday_night"] = (
        ((6 - ci_dow) % 7 < los_raw) | (ci_dow == 5)
    ).astype(int)

    # Lead time and length of stay
    out["lead_time_days"] = (ci - dt.dt.normalize()).dt.days.clip(lower=0).fillna(-1)
    out["length_of_stay_nights"] = (co - ci).dt.days.clip(lower=0, upper=365).fillna(-1)

    # Party composition
    srch_adults = df["srch_adults_cnt"] if "srch_adults_cnt" in df.columns else pd.Series(1, index=df.index)
    srch_children = df["srch_children_cnt"] if "srch_children_cnt" in df.columns else pd.Series(0, index=df.index)
    srch_rooms = df["srch_rm_cnt"] if "srch_rm_cnt" in df.columns else pd.Series(1, index=df.index)

    out["num_adults"] = pd.to_numeric(srch_adults, errors="coerce").fillna(1).clip(1, 20).astype(int)
    out["num_children"] = pd.to_numeric(srch_children, errors="coerce").fillna(0).clip(0, 10).astype(int)
    out["num_rooms"] = pd.to_numeric(srch_rooms, errors="coerce").fillna(1).clip(1, 10).astype(int)
    out["has_children"] = (out["num_children"] > 0).astype(int)
    out["adults_per_room"] = (out["num_adults"] / out["num_rooms"]).round(2)
    out["total_guests"] = out["num_adults"] + out["num_children"]

    # Distance features
    if "orig_destination_distance" in df.columns:
        dist = pd.to_numeric(df["orig_destination_distance"], errors="coerce")
        out["dist_missing"] = dist.isna().astype(int)
        out["orig_destination_distance"] = np.log1p(dist.fillna(0).clip(lower=0))
    else:
        out["dist_missing"] = 1
        out["orig_destination_distance"] = 0.0

    # Static categorical / integer passthrough
    static_defaults = {
        "is_mobile": 0,
        "is_package": 0,
        "channel": 0,
        "site_name": 2,
        "posa_continent": 3,
        "srch_destination_type_id": 1,
        "hotel_continent": 2,
        "hotel_country": 50,
        "hotel_market": 628,
    }
    for col, default_val in static_defaults.items():
        if col in df.columns:
            out[col] = pd.to_numeric(df[col], errors="coerce").fillna(default_val).astype(int)
        else:
            out[col] = default_val

    # Frequency-encoded features
    encoders_path = artifacts_path / "encoders.joblib"
    encoders = joblib.load(encoders_path)
    freq_maps = encoders.get("freq_maps", {})

    srch_dest_series = df["srch_destination_id"] if "srch_destination_id" in df.columns else pd.Series(0, index=df.index)
    hotel_mkt_series = df["hotel_market"] if "hotel_market" in df.columns else pd.Series(628, index=df.index)
    user_cntry_series = df["user_location_country"] if "user_location_country" in df.columns else pd.Series(66, index=df.index)
    user_rgn_series = df["user_location_region"] if "user_location_region" in df.columns else pd.Series(311, index=df.index)

    srch_dest_id = pd.to_numeric(srch_dest_series, errors="coerce").fillna(0).astype(int)
    hotel_mkt = pd.to_numeric(hotel_mkt_series, errors="coerce").fillna(628).astype(int)
    user_cntry = pd.to_numeric(user_cntry_series, errors="coerce").fillna(66).astype(int)
    user_rgn = pd.to_numeric(user_rgn_series, errors="coerce").fillna(311).astype(int)

    out["srch_destination_id_freq"] = srch_dest_id.map(freq_maps.get("srch_destination_id", {})).fillna(0.0)
    out["hotel_market_freq"] = hotel_mkt.map(freq_maps.get("hotel_market", {})).fillna(0.0)
    out["user_location_country_freq"] = user_cntry.map(freq_maps.get("user_location_country", {})).fillna(0.0)
    out["user_location_region_freq"] = user_rgn.map(freq_maps.get("user_location_region", {})).fillna(0.0)

    # Destination PCA features (looked up from precomputed table)
    dest_pca_path = artifacts_path / "dest_pca_lookup.parquet"
    if dest_pca_path.exists():
        dest_pca_lookup = pd.read_parquet(dest_pca_path)
        temp_dest = pd.DataFrame({"srch_destination_id": srch_dest_id}, index=df.index)
        merged_pca = temp_dest.merge(dest_pca_lookup, on="srch_destination_id", how="left")
        for i in range(12):
            col_name = f"dest_pca_{i}"
            out[col_name] = merged_pca[col_name].fillna(0.0).values
    else:
        for i in range(12):
            out[f"dest_pca_{i}"] = 0.0

    # User history features
    # Check if explicitly provided in input first
    has_explicit_intents = "user_prior_intents" in df.columns and df["user_prior_intents"].notna().any()
    has_explicit_rate = "user_prior_booking_rate" in df.columns and df["user_prior_booking_rate"].notna().any()

    if has_explicit_intents and has_explicit_rate:
        out["user_prior_intents"] = pd.to_numeric(df["user_prior_intents"], errors="coerce").fillna(0).clip(0, 500)
        out["user_prior_booking_rate"] = pd.to_numeric(df["user_prior_booking_rate"], errors="coerce").fillna(0.0).clip(0.0, 1.0)
    elif "user_id" in df.columns:
        user_hist_path = artifacts_path / "user_history_lookup.parquet"
        if user_hist_path.exists():
            user_hist_lookup = pd.read_parquet(user_hist_path)
            uids = pd.to_numeric(df["user_id"], errors="coerce").fillna(-1).astype(int)
            temp_users = pd.DataFrame({"user_id": uids}, index=df.index)
            merged_hist = temp_users.merge(user_hist_lookup, on="user_id", how="left")
            out["user_prior_intents"] = merged_hist["user_prior_intents"].fillna(0).clip(0, 500).values
            out["user_prior_booking_rate"] = merged_hist["user_prior_booking_rate"].fillna(0.0).clip(0.0, 1.0).values
        else:
            out["user_prior_intents"] = 0.0
            out["user_prior_booking_rate"] = 0.0
    else:
        # Cold start fallback
        out["user_prior_intents"] = 0.0
        out["user_prior_booking_rate"] = 0.0

    return out[expected_cols]


class Model2Predictor:
    """
    Encapsulates the XGBoost + Isotonic calibration model for booking conversion.
    Thread-safe (read-only after initialization).
    Supports both pre-engineered feature DataFrames and raw incoming search queries.
    """

    def __init__(self, artifacts_dir: Union[str, Path, None] = None):
        self.artifacts_dir = Path(artifacts_dir or _DEFAULT_ARTIFACTS)
        self._load()

    def _load(self):
        # Load XGBoost model
        self.xgb_model = xgb.Booster()
        self.xgb_model.load_model(str(self.artifacts_dir / "xgb_model.json"))

        # Load feature spec
        with open(self.artifacts_dir / "feature_spec.json", encoding="utf-8") as f:
            self.feature_spec = json.load(f)
        self.feat_cols = self.feature_spec["feature_names"]

        # Load calibrator
        cal_info = joblib.load(self.artifacts_dir / "calibrator.joblib")
        self.calibrator = cal_info["calibrator"]
        self.cal_method = cal_info["method"]

        # Load SHAP explainer (optional)
        self._explainer = None
        shap_path = self.artifacts_dir / "shap_explainer.joblib"
        if shap_path.exists():
            try:
                self._explainer = joblib.load(shap_path)
            except Exception:
                pass

    def _validate_and_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate input DataFrame and transform if it contains raw search columns."""
        _check_forbidden_columns(df)

        # If all 44 feature columns are already present, validate and pass through
        if all(c in df.columns for c in self.feat_cols):
            return df[self.feat_cols].copy()

        # Check if it has mostly feature columns (e.g. synthetic test with missing feats)
        matching_feats = sum(1 for c in self.feat_cols if c in df.columns)
        if matching_feats >= len(self.feat_cols) - 5 and "srch_ci" not in df.columns:
            # Impute missing feature columns directly
            df_out = df.copy()
            for c in self.feat_cols:
                if c not in df_out.columns:
                    df_out[c] = -999.0
            return df_out[self.feat_cols]

        # Otherwise, treat as raw search queries and transform
        return transform_raw_searches_to_features(df, artifacts_dir=self.artifacts_dir)

    def predict_conversion_proba(
        self,
        df: Union[pd.DataFrame, Dict[str, Any], List[Dict[str, Any]]],
        actual_matured_rate: Optional[float] = None,
        predicted_matured_rate: Optional[float] = None,
    ) -> np.ndarray:
        """
        Predict calibrated booking conversion probability for each record.
        Optionally recalibrates via logit-intercept shift if matured rates are provided.
        
        Args:
            df: DataFrame, dict, or list of dicts with raw searches or features.
                (must NOT contain hotel_cluster, cnt, or is_booking)
            actual_matured_rate: Optional observed rate in matured cohort
            predicted_matured_rate: Optional mean predicted rate in matured cohort
        
        Returns:
            np.ndarray of shape (n,) with calibrated probabilities strictly in [0, 1]
        """
        if not isinstance(df, pd.DataFrame):
            df = pd.DataFrame([df] if isinstance(df, dict) else df)

        df_feat = self._validate_and_transform(df)

        X = df_feat[self.feat_cols].fillna(-999).values.astype(np.float32)
        dmat = xgb.DMatrix(X, feature_names=self.feat_cols)
        y_raw = self.xgb_model.predict(dmat)

        if self.cal_method == "isotonic":
            y_cal = self.calibrator.predict(y_raw)
        else:
            y_cal = self.calibrator.predict_proba(y_raw.reshape(-1, 1))[:, 1]

        y_cal = np.clip(y_cal, 0.0, 1.0)

        if actual_matured_rate is not None and predicted_matured_rate is not None:
            y_cal = recalibrate_logit_intercept(
                y_cal, actual_matured_rate, predicted_matured_rate
            )

        return y_cal

    def expected_bookings(
        self,
        df: pd.DataFrame,
        group_cols: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        """
        Compute expected bookings, search count, and conversion rate per group.
        Aggregates calibrated probabilities (never threshold-based binary predictions).
        
        Args:
            df: Input DataFrame (raw searches or pre-engineered features)
            group_cols: Columns to group by (default: ["srch_destination_id", "checkin_month"])
        
        Returns:
            DataFrame with group columns + [n_searches, expected_bookings, expected_conversion_rate]
        """
        df_copy = df.copy()
        
        # Check forbidden columns
        _check_forbidden_columns(df_copy)

        # Handle alias mapping for group columns if requested
        if group_cols is None:
            if "destination_id" in df_copy.columns:
                group_cols = ["destination_id", "checkin_month"]
            elif "srch_destination_id" in df_copy.columns:
                group_cols = ["srch_destination_id", "checkin_month"]
            else:
                group_cols = ["checkin_month"]

        # Ensure checkin_month exists on input if grouping by it
        if "checkin_month" in group_cols and "checkin_month" not in df_copy.columns:
            if "checkin_date" in df_copy.columns:
                df_copy["checkin_month"] = pd.to_datetime(df_copy["checkin_date"], errors="coerce").dt.month.fillna(-1).astype(int)
            elif "srch_ci" in df_copy.columns:
                df_copy["checkin_month"] = pd.to_datetime(df_copy["srch_ci"], errors="coerce").dt.month.fillna(-1).astype(int)

        proba = self.predict_conversion_proba(df_copy)
        df_copy["_proba"] = proba

        result = (
            df_copy.groupby(group_cols, observed=True)
            .agg(
                n_searches=("_proba", "count"),
                expected_bookings=("_proba", "sum"),
            )
            .reset_index()
        )
        result["expected_conversion_rate"] = (
            result["expected_bookings"] / result["n_searches"].clip(lower=1)
        )

        # Verification: expected_bookings sum must equal total proba sum
        total_pred = float(result["expected_bookings"].sum())
        total_proba = float(proba.sum())
        assert abs(total_pred - total_proba) < 1e-3, (
            f"expected_bookings sum mismatch: {total_pred:.4f} vs {total_proba:.4f}"
        )

        return result

    def explain_prediction(
        self,
        row: Union[pd.Series, pd.DataFrame, Dict[str, Any]],
        top_k: int = 5,
    ) -> Dict[str, Any]:
        """
        Explain a single prediction with SHAP values.
        Returns human-readable reasons for frontend and agents.
        
        Args:
            row: Single-row Series, single-row DataFrame, or raw dict
            top_k: Number of top reasons to return
        
        Returns:
            dict with keys: raw_probability, calibrated_probability, top_reasons, prediction_text
        """
        if self._explainer is None:
            raise RuntimeError(
                "SHAP explainer not loaded. Ensure shap_explainer.joblib exists in artifacts."
            )

        if isinstance(row, dict):
            row_df = pd.DataFrame([row])
        elif isinstance(row, pd.Series):
            row_df = pd.DataFrame([row])
        else:
            row_df = row.head(1).copy()

        df_feat = self._validate_and_transform(row_df)
        X = df_feat[self.feat_cols].fillna(-999).values.astype(np.float32)

        dmat = xgb.DMatrix(X, feature_names=self.feat_cols)
        y_raw = float(self.xgb_model.predict(dmat)[0])

        if self.cal_method == "isotonic":
            y_cal = float(np.clip(self.calibrator.predict([y_raw])[0], 0, 1))
        else:
            y_cal = float(self.calibrator.predict_proba([[y_raw]])[0, 1])

        # Exact Tree SHAP contributions directly from XGBoost Booster (robust, fast, thread-safe)
        contribs = self.xgb_model.predict(dmat, pred_contribs=True)
        shap_arr = contribs[0, :len(self.feat_cols)]

        top_idx = np.argsort(np.abs(shap_arr))[::-1][:top_k]
        reasons = []
        for idx in top_idx:
            feat_name = self.feat_cols[idx]
            feat_val = X[0, idx]
            sv = float(shap_arr[idx])
            direction = "increases" if sv > 0 else "decreases"
            display_val = "missing" if feat_val == -999 else f"{feat_val:.4g}"
            reasons.append({
                "feature": feat_name,
                "value": display_val,
                "shap_value": sv,
                "direction": direction,
                "explanation": (
                    f"`{feat_name}` = {display_val} → {direction} booking probability "
                    f"by {abs(sv):.4f} log-odds units"
                ),
            })

        return {
            "raw_probability": y_raw,
            "calibrated_probability": y_cal,
            "top_reasons": reasons,
            "prediction_text": (
                f"Estimated booking probability: {y_cal:.3%} "
                f"({y_cal * 1000:.1f} expected bookings per 1,000 similar searches)"
            ),
        }


def recalibrate_logit_intercept(
    probs: np.ndarray,
    actual_matured_rate: float,
    predicted_matured_rate: float,
    eps: float = 1e-6,
) -> np.ndarray:
    """
    Recalibrates predicted probabilities via logit-intercept shift:
        logit(p*) = logit(p) + Delta_0
    where Delta_0 = logit(actual_matured_rate) - logit(predicted_matured_rate).
    
    Guarantees output stays strictly in [0, 1] smoothly while eliminating aggregate drift.
    """
    p = np.clip(probs, eps, 1.0 - eps)
    r_act = np.clip(actual_matured_rate, eps, 1.0 - eps)
    r_pred = np.clip(predicted_matured_rate, eps, 1.0 - eps)

    delta_0 = np.log(r_act / (1.0 - r_act)) - np.log(r_pred / (1.0 - r_pred))

    logit_p = np.log(p / (1.0 - p))
    new_logit = logit_p + delta_0
    recalibrated = 1.0 / (1.0 + np.exp(-new_logit))
    return np.clip(recalibrated, 0.0, 1.0)


# Module-level singleton
_predictor: Optional[Model2Predictor] = None


def _get_predictor() -> Model2Predictor:
    global _predictor
    if _predictor is None:
        _predictor = Model2Predictor()
    return _predictor


def predict_conversion_proba(
    df: Union[pd.DataFrame, Dict[str, Any], List[Dict[str, Any]]],
    actual_matured_rate: Optional[float] = None,
    predicted_matured_rate: Optional[float] = None,
) -> np.ndarray:
    """Module-level function: predict calibrated booking probability."""
    return _get_predictor().predict_conversion_proba(
        df,
        actual_matured_rate=actual_matured_rate,
        predicted_matured_rate=predicted_matured_rate,
    )


def expected_bookings(
    df: pd.DataFrame,
    group_cols: Optional[List[str]] = None,
) -> pd.DataFrame:
    """Module-level function: expected bookings per group."""
    return _get_predictor().expected_bookings(df, group_cols)


def explain_prediction(
    row: Union[pd.Series, pd.DataFrame, Dict[str, Any]],
    top_k: int = 5,
) -> Dict[str, Any]:
    """Module-level function: explain a single prediction."""
    return _get_predictor().explain_prediction(row, top_k)


def _cli():
    parser = argparse.ArgumentParser(
        description="Model 2: Booking Conversion Prediction — CLI"
    )
    parser.add_argument("--input", required=True, help="Input CSV file path")
    parser.add_argument("--output", required=True, help="Output CSV file path")
    parser.add_argument("--artifacts", default=None,
                        help="Path to artifacts directory (default: auto-detect)")
    parser.add_argument("--group-cols", nargs="+", default=None,
                        help="Columns to group by for expected_bookings output")
    args = parser.parse_args()

    print(f"Loading model from {args.artifacts or _DEFAULT_ARTIFACTS}")
    predictor = Model2Predictor(artifacts_dir=args.artifacts)

    print(f"Reading input: {args.input}")
    df = pd.read_csv(args.input)
    print(f"Input shape: {df.shape}")

    proba = predictor.predict_conversion_proba(df)
    df["predicted_conversion_proba"] = proba

    if args.group_cols:
        agg = predictor.expected_bookings(df, args.group_cols)
        agg_path = Path(args.output).with_suffix("").with_name(
            Path(args.output).stem + "_aggregated.csv"
        )
        agg.to_csv(agg_path, index=False)
        print(f"Aggregated predictions saved to {agg_path}")

    out_path = args.output
    df.to_csv(out_path, index=False)
    print(f"Predictions saved to {out_path}")
    print(f"Mean predicted conversion rate: {proba.mean():.4f}")
    print(f"Expected bookings per 1,000 searches: {proba.mean() * 1000:.1f}")


if __name__ == "__main__":
    _cli()
