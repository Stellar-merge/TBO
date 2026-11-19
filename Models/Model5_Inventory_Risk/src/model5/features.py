"""
features.py — Feature Specifications, Whitelist, and Leakage Guards for Model 5.

Module: Model 5 — Inventory Risk Prediction (Random Forest Classifier)
System: TBO SmartStock AI

Enforces strict zero-lookahead temporal integrity and explicit feature whitelisting.
Post-decision and realized outcome fields are strictly forbidden from entering
the feature matrix at training and inference time.
"""
from __future__ import annotations

from typing import List, Set, Dict, Any
import pandas as pd
import numpy as np

# ------------------------------------------------------------------------------
# 1. CANONICAL FEATURE WHITELISTS
# ------------------------------------------------------------------------------

CATEGORICAL_FEATURES: List[str] = [
    "property_id",
    "destination_id",
    "destination_type",
    "supplier_id",
    "contract_flexibility"
]

DEMAND_FEATURES: List[str] = [
    "historical_daily_demand_30d_avg",
    "historical_daily_demand_90d_avg",
    "historical_same_month_prior_year_demand",
    "current_pace_on_the_books",
    "pace_vs_historical_ratio",
    "search_inquiry_index",
    "market_segment_ta_to_pct",
    "market_segment_direct_pct"
]

INVENTORY_SUPPLIER_FEATURES: List[str] = [
    "procured_quantity",
    "supplier_capacity",
    "procurement_to_capacity_ratio",
    "supplier_reliability_score",
    "supplier_release_days",
    "procurement_lead_time_days",
    "stay_nights"
]

CANCELLATION_FEATURES: List[str] = [
    "historical_cancellation_rate_30d",
    "cancellation_adjusted_expected_demand"
]

PRICING_MARGIN_FEATURES: List[str] = [
    "procurement_cost_per_room",
    "expected_selling_price",
    "expected_gross_margin_usd",
    "expected_gross_margin_pct",
    "trailing_30d_adr",
    "price_premium_vs_market"
]

CALENDAR_SEASONALITY_FEATURES: List[str] = [
    "checkin_year",
    "checkin_month",
    "checkin_day_of_week",
    "is_weekend",
    "is_high_season",
    "quarter"
]

UPSTREAM_MODEL_PROXY_FEATURES: List[str] = [
    "model1_demand_forecast",
    "model2_conversion_prob_est",
    "model3_cancellation_risk_est",
    "model4_price_momentum_est"
]

# Upstream model forecast and probability estimates
UPSTREAM_MODEL_PROXY_FEATURES: List[str] = [
    "model1_demand_forecast",
    "model2_conversion_prob_est",
    "model3_cancellation_risk_est",
    "model4_price_momentum_est"
]

# Baseline numerical features (33 features)
BASE_NUMERICAL_FEATURES: List[str] = (
    DEMAND_FEATURES +
    INVENTORY_SUPPLIER_FEATURES +
    CANCELLATION_FEATURES +
    PRICING_MARGIN_FEATURES +
    CALENDAR_SEASONALITY_FEATURES +
    UPSTREAM_MODEL_PROXY_FEATURES
)

# Decision-boundary and interaction features (strictly decision-time, zero-lookahead)
DECISION_BOUNDARY_FEATURES: List[str] = [
    "norm_dist_m1",
    "abs_norm_dist_m1",
    "ratio_q_m1",
    "diff_q_m1",
    "ind_m1_above",
    "ind_m1_below",
    "ind_m1_inside"
]

DEMAND_RATIO_TREND_FEATURES: List[str] = [
    "ratio_q_h30",
    "ratio_q_h90",
    "ratio_q_same_month",
    "ratio_q_adj",
    "demand_trend_30_vs_90",
    "demand_pace_completion"
]

BUFFER_CAPACITY_MARGIN_FEATURES: List[str] = [
    "pace_deficit",
    "pace_surplus_vs_exp",
    "ratio_pace_to_q",
    "cap_headroom",
    "cap_headroom_ratio",
    "supplier_risk_adjusted_qty",
    "margin_buffer_ratio",
    "total_capital_at_risk"
]

ENGINEERED_DECISION_FEATURES: List[str] = (
    DECISION_BOUNDARY_FEATURES +
    DEMAND_RATIO_TREND_FEATURES +
    BUFFER_CAPACITY_MARGIN_FEATURES
)

# Complete predictive numerical feature whitelist
NUMERICAL_FEATURES: List[str] = BASE_NUMERICAL_FEATURES + ENGINEERED_DECISION_FEATURES

# Complete predictive feature whitelist (59 features total)
ALL_PREDICTIVE_FEATURES: List[str] = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

# ------------------------------------------------------------------------------
# 2. TARGET AND OUTCOME FORBIDDEN BLACKLIST
# ------------------------------------------------------------------------------

TARGET_COLUMNS: List[str] = [
    "risk_class",
    "risk_label"
]

METADATA_COLUMNS: List[str] = [
    "opportunity_id",
    "decision_timestamp",
    "checkin_date",
    "data_provenance",
    "is_synthetic"
]

FORBIDDEN_OUTCOME_COLUMNS: List[str] = [
    "outcome_realized_net_demand",
    "outcome_realized_cancellations",
    "outcome_unconstrained_latent_demand",
    "outcome_actual_rooms_sold",
    "outcome_unsold_rooms",
    "outcome_shortage_rooms",
    "outcome_inventory_coverage_ratio",
    "outcome_realized_revenue_usd",
    "outcome_total_procurement_cost_usd",
    "outcome_realized_gross_profit_usd",
    "outcome_realized_utilization_pct"
]

# Complete forbidden set: any column in this set must NEVER enter model input
FORBIDDEN_COLUMNS: Set[str] = set(TARGET_COLUMNS + METADATA_COLUMNS + FORBIDDEN_OUTCOME_COLUMNS)

# Label mappings
LABEL_TO_CLASS: Dict[str, int] = {
    "BALANCED": 0,
    "UNSOLD": 1,
    "SHORTAGE": 2
}

CLASS_TO_LABEL: Dict[int, str] = {v: k for k, v in LABEL_TO_CLASS.items()}

# ------------------------------------------------------------------------------
# 3. SAFETY AND VALIDATION FUNCTIONS
# ------------------------------------------------------------------------------

def validate_features_dataframe(df: pd.DataFrame, strict_leakage_check: bool = True) -> List[str]:
    """
    Validates that a DataFrame does not contain forbidden outcome/target columns,
    and returns the list of present whitelisted features.
    
    Raises:
        ValueError: If any forbidden outcome or target column is present in input
                    when strict_leakage_check is True.
    """
    input_cols = set(df.columns)
    
    if strict_leakage_check:
        leaked_cols = input_cols.intersection(FORBIDDEN_OUTCOME_COLUMNS)
        if leaked_cols:
            raise ValueError(
                f"DATA LEAKAGE DETECTED! Forbidden outcome columns found in feature matrix: {sorted(list(leaked_cols))}. "
                "These columns reflect future post-decision reality and cannot be used for inference or training."
            )
            
        target_leak = input_cols.intersection(set(TARGET_COLUMNS))
        if target_leak:
            raise ValueError(
                f"TARGET LEAKAGE DETECTED! Target columns found in feature matrix: {sorted(list(target_leak))}."
            )
    
    # Extract only whitelisted predictive features
    valid_features = [col for col in ALL_PREDICTIVE_FEATURES if col in df.columns]
    return valid_features


def derive_calendar_features(checkin_date_series: pd.Series) -> pd.DataFrame:
    """
    Derives calendar and seasonality features from a checkin_date Series.
    """
    dt = pd.to_datetime(checkin_date_series)
    cal_df = pd.DataFrame(index=dt.index)
    cal_df["checkin_year"] = dt.dt.year
    cal_df["checkin_month"] = dt.dt.month
    day_of_week = dt.dt.day_of_week if hasattr(dt.dt, "day_of_week") else dt.dt.dayofweek
    cal_df["checkin_day_of_week"] = day_of_week
    cal_df["is_weekend"] = day_of_week.isin([4, 5, 6]).astype(int)
    cal_df["is_high_season"] = dt.dt.month.isin([6, 7, 8, 12]).astype(int)
    cal_df["quarter"] = dt.dt.quarter
    return cal_df


def derive_decision_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Derives decision-boundary, buffer, and ratio features strictly using
    information available at or before the decision timestamp (zero lookahead).
    """
    df = df.copy()
    q = df["procured_quantity"].values.astype(float) if "procured_quantity" in df.columns else np.zeros(len(df))
    h30 = np.maximum(df["historical_daily_demand_30d_avg"].values.astype(float), 1.0) if "historical_daily_demand_30d_avg" in df.columns else np.ones(len(df))
    h90 = np.maximum(df["historical_daily_demand_90d_avg"].values.astype(float), 1.0) if "historical_daily_demand_90d_avg" in df.columns else np.ones(len(df))
    h_same = np.maximum(df["historical_same_month_prior_year_demand"].values.astype(float), 1.0) if "historical_same_month_prior_year_demand" in df.columns else h30
    
    # If model1_demand_forecast is provided, use it; otherwise fall back to historical expected baseline
    if "model1_demand_forecast" in df.columns:
        m1_raw = pd.to_numeric(df["model1_demand_forecast"], errors="coerce").values.astype(float)
        m1_fallback = 0.55 * h_same + 0.45 * h30
        m1 = np.where(np.isnan(m1_raw), m1_fallback, m1_raw)
        m1 = np.maximum(m1, 1.0)
    else:
        m1 = np.maximum(0.55 * h_same + 0.45 * h30, 1.0)

    adj = np.maximum(df["cancellation_adjusted_expected_demand"].values.astype(float), 1.0) if "cancellation_adjusted_expected_demand" in df.columns else h30
    pace = df["current_pace_on_the_books"].values.astype(float) if "current_pace_on_the_books" in df.columns else np.zeros(len(df))
    lead = df["procurement_lead_time_days"].values.astype(float) if "procurement_lead_time_days" in df.columns else np.full(len(df), 30.0)
    cap = np.maximum(df["supplier_capacity"].values.astype(float), 1.0) if "supplier_capacity" in df.columns else np.maximum(q * 1.5, 1.0)
    rel = df["supplier_reliability_score"].values.astype(float) if "supplier_reliability_score" in df.columns else np.full(len(df), 0.95)
    cost = np.maximum(df["procurement_cost_per_room"].values.astype(float), 1.0) if "procurement_cost_per_room" in df.columns else np.full(len(df), 75.0)
    margin = df["expected_gross_margin_usd"].values.astype(float) if "expected_gross_margin_usd" in df.columns else np.full(len(df), 20.0)

    tol_m1 = np.maximum(3.0, 0.15 * m1)
    df["norm_dist_m1"] = (q - m1) / tol_m1
    df["abs_norm_dist_m1"] = np.abs(q - m1) / tol_m1
    df["ratio_q_m1"] = q / m1
    df["diff_q_m1"] = q - m1
    df["ind_m1_above"] = (q > (m1 + tol_m1)).astype(float)
    df["ind_m1_below"] = (q < (m1 - tol_m1)).astype(float)
    df["ind_m1_inside"] = (np.abs(q - m1) <= tol_m1).astype(float)

    df["ratio_q_h30"] = q / h30
    df["ratio_q_h90"] = q / h90
    df["ratio_q_same_month"] = q / h_same
    df["ratio_q_adj"] = q / adj

    df["demand_trend_30_vs_90"] = h30 / h90
    df["demand_pace_completion"] = pace / m1

    exp_pace = m1 * np.clip(1.0 - lead / 120.0, 0.1, 0.95)
    df["pace_deficit"] = np.maximum(0.0, q - pace)
    df["pace_surplus_vs_exp"] = pace - exp_pace
    df["ratio_pace_to_q"] = pace / np.maximum(1.0, q)
    df["cap_headroom"] = cap - q
    df["cap_headroom_ratio"] = (cap - q) / cap
    df["supplier_risk_adjusted_qty"] = q * rel

    df["margin_buffer_ratio"] = margin / cost
    df["total_capital_at_risk"] = q * cost
    return df
