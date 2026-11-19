"""
Hotel Booking Cancellation Prediction — Overall Model
======================================================
Loads best_overall_model.joblib (XGBoost, 40 features, 86.22% val-accuracy)
and predicts cancellation probability for new bookings.

Usage:
    python src/predict_overall.py
    python src/predict_overall.py --csv dataset/hotel_bookings.csv
"""

import argparse
import warnings
import sys
import os

import pandas as pd
import numpy as np
import joblib

warnings.filterwarnings("ignore")

# ─────────────────────────── paths ──────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "trained_models", "best_overall_model.joblib")

# ──────────────────────────── feature lists ───────────────────────────────────
OVERALL_FEATURES = [
    "hotel", "lead_time", "arrival_date_year", "arrival_date_week_number",
    "arrival_date_day_of_month", "stays_in_weekend_nights", "stays_in_week_nights",
    "adults", "children", "babies", "meal", "country", "market_segment",
    "distribution_channel", "is_repeated_guest", "previous_cancellations",
    "previous_bookings_not_canceled", "reserved_room_type", "assigned_room_type",
    "booking_changes", "deposit_type", "agent", "company", "days_in_waiting_list",
    "customer_type", "adr", "required_car_parking_spaces", "total_of_special_requests",
    # Engineered features
    "month_num", "total_nights", "total_guests", "room_changed",
    "has_company", "has_agent", "total_cost", "dow", "booking_ordinal",
    "day_of_year", "adr_per_guest", "prev_cancel_ratio",
]

MONTH_MAP = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12,
}


# ──────────────────────── feature engineering ────────────────────────────────
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add all engineered features expected by the Overall model (40 features)."""
    df = df.copy()

    # Month number
    if "arrival_date_month" in df.columns:
        df["month_num"] = df["arrival_date_month"].map(MONTH_MAP).fillna(0).astype(int)
    else:
        df["month_num"] = 0

    # Stay duration
    df["total_nights"] = (
        df.get("stays_in_weekend_nights", pd.Series(0, index=df.index)) +
        df.get("stays_in_week_nights", pd.Series(0, index=df.index))
    )

    # Guest count
    df["total_guests"] = (
        df.get("adults", pd.Series(1, index=df.index)) +
        df.get("children", pd.Series(0, index=df.index)) +
        df.get("babies", pd.Series(0, index=df.index))
    )
    df["total_guests"] = df["total_guests"].clip(lower=1)

    # Room change flag
    if "reserved_room_type" in df.columns and "assigned_room_type" in df.columns:
        df["room_changed"] = (df["reserved_room_type"] != df["assigned_room_type"]).astype(int)
    else:
        df["room_changed"] = 0

    # Company / agent flags
    df["has_company"] = df.get("company", pd.Series(np.nan, index=df.index)).notna().astype(int)
    df["has_agent"] = df.get("agent", pd.Series(np.nan, index=df.index)).notna().astype(int)

    # Total revenue proxy
    df["total_cost"] = df.get("adr", pd.Series(0, index=df.index)) * df["total_nights"]

    # Day-of-week (0 = Monday, via arrival_date_day_of_month + month + year)
    try:
        df["_arrival_date"] = pd.to_datetime(
            df["arrival_date_year"].astype(str) + "-" +
            df["month_num"].astype(str) + "-" +
            df["arrival_date_day_of_month"].astype(str),
            errors="coerce",
        )
        df["dow"] = df["_arrival_date"].dt.dayofweek.fillna(0).astype(int)
        df["day_of_year"] = df["_arrival_date"].dt.dayofyear.fillna(0).astype(int)
        df["booking_ordinal"] = df["_arrival_date"].map(
            lambda d: d.toordinal() if pd.notna(d) else 0
        )
        df.drop(columns=["_arrival_date"], inplace=True)
    except Exception:
        df["dow"] = 0
        df["day_of_year"] = 0
        df["booking_ordinal"] = 0

    # Rate per guest
    df["adr_per_guest"] = df.get("adr", pd.Series(0, index=df.index)) / df["total_guests"]

    # Previous cancellation ratio
    total_prev = (
        df.get("previous_cancellations", pd.Series(0, index=df.index)) +
        df.get("previous_bookings_not_canceled", pd.Series(0, index=df.index))
    )
    df["prev_cancel_ratio"] = (
        df.get("previous_cancellations", pd.Series(0, index=df.index)) /
        total_prev.replace(0, 1)
    )

    return df


# ─────────────────────────── load model ──────────────────────────────────────
def load_model(path: str = MODEL_PATH):
    """Load the saved model dict."""
    artifact = joblib.load(path)
    if isinstance(artifact, dict):
        model = artifact["model"]
        feature_cols = artifact["feature_columns"]
        model_name = artifact.get("model_name", "Overall XGBoost")
        val_acc = artifact.get("validation_accuracy", "N/A")
    else:
        model = artifact
        feature_cols = OVERALL_FEATURES
        model_name = "Overall XGBoost"
        val_acc = "N/A"
    return model, feature_cols, model_name, val_acc


# ────────────────────────── predict function ─────────────────────────────────
def predict(df: pd.DataFrame, model_path: str = MODEL_PATH) -> pd.DataFrame:
    """
    Predict hotel booking cancellation.

    Parameters
    ----------
    df : pd.DataFrame
        Raw bookings data (same schema as hotel_bookings.csv, without is_canceled).
    model_path : str
        Path to the saved model joblib file.

    Returns
    -------
    pd.DataFrame with two new columns:
        - cancelled_prediction  : 1 = will cancel, 0 = will not cancel
        - cancel_probability    : probability of cancellation (0–1)
    """
    model, feature_cols, model_name, val_acc = load_model(model_path)
    df_feat = engineer_features(df)

    # Keep only expected columns; fill missing with 0
    missing = [c for c in feature_cols if c not in df_feat.columns]
    for col in missing:
        df_feat[col] = 0

    X = df_feat[feature_cols].copy()
    # Model was trained with enable_categorical=True — cast object cols to category
    for col in X.select_dtypes(include="object").columns:
        X[col] = X[col].astype("category")

    preds = model.predict(X)
    probs = model.predict_proba(X)[:, 1]

    result = df.copy()
    result["cancelled_prediction"] = preds
    result["cancel_probability"] = np.round(probs, 4)
    return result


# ──────────────────────────── CLI ────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Hotel Cancellation — Overall Model")
    parser.add_argument("--csv", type=str, default=None, help="Path to bookings CSV")
    parser.add_argument("--model", type=str, default=MODEL_PATH, help="Path to model file")
    parser.add_argument("--output", type=str, default=None, help="Save predictions CSV")
    args = parser.parse_args()

    model, feature_cols, model_name, val_acc = load_model(args.model)
    print(f"\n✅  Model loaded: {model_name}")
    print(f"    Validation accuracy: {val_acc}%")
    print(f"    Features expected:   {len(feature_cols)}")

    if args.csv:
        print(f"\n📂  Loading data: {args.csv}")
        df = pd.read_csv(args.csv)
        print(f"    Rows: {len(df):,}")
        result = predict(df, args.model)
        n_cancel = result["cancelled_prediction"].sum()
        print(f"\n📊  Predictions:")
        print(f"    Will cancel    : {n_cancel:,} ({n_cancel/len(df)*100:.1f}%)")
        print(f"    Will not cancel: {len(df)-n_cancel:,} ({(len(df)-n_cancel)/len(df)*100:.1f}%)")
        print(f"\n    Sample output:")
        print(result[["cancelled_prediction", "cancel_probability"]].head(10).to_string())
        if args.output:
            result.to_csv(args.output, index=False)
            print(f"\n💾  Saved to: {args.output}")
    else:
        # Demo with a single synthetic booking
        print("\n🔮  Running demo prediction on a sample booking...")
        sample = pd.DataFrame([{
            "hotel": "City Hotel",
            "lead_time": 120,
            "arrival_date_year": 2017,
            "arrival_date_month": "August",
            "arrival_date_week_number": 32,
            "arrival_date_day_of_month": 7,
            "stays_in_weekend_nights": 2,
            "stays_in_week_nights": 3,
            "adults": 2, "children": 0, "babies": 0,
            "meal": "BB",
            "country": "PRT",
            "market_segment": "Online TA",
            "distribution_channel": "TA/TO",
            "is_repeated_guest": 0,
            "previous_cancellations": 1,
            "previous_bookings_not_canceled": 0,
            "reserved_room_type": "A",
            "assigned_room_type": "A",
            "booking_changes": 0,
            "deposit_type": "No Deposit",
            "agent": 9.0,
            "company": np.nan,
            "days_in_waiting_list": 0,
            "customer_type": "Transient",
            "adr": 95,
            "required_car_parking_spaces": 0,
            "total_of_special_requests": 0,
        }])
        result = predict(sample, args.model)
        label = "✈️  WILL CANCEL" if result["cancelled_prediction"].iloc[0] == 1 else "🏨  WILL NOT CANCEL"
        prob = result["cancel_probability"].iloc[0]
        print(f"\n    Prediction       : {label}")
        print(f"    Cancel probability: {prob:.2%}")


if __name__ == "__main__":
    main()
