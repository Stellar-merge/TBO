"""
Hotel Booking Cancellation Prediction — Booking-Time Model
===========================================================
Loads best_booking_time_model.joblib (XGBoost, 36 features, 85.02% val-accuracy).

This model is designed for predictions made at booking time only, using
features available when a reservation is first made — it excludes
post-booking signals like room_changed / assigned_room_type.

Usage:
    python src/predict_booking_time.py
    python src/predict_booking_time.py --csv dataset/hotel_bookings.csv
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
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "trained_models", "best_booking_time_model.joblib")

MONTH_MAP = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12,
}

# Booking-time features (excludes assigned_room_type, room_changed — not known at booking)
BOOKING_TIME_FEATURES = [
    "hotel", "lead_time", "arrival_date_year", "arrival_date_week_number",
    "arrival_date_day_of_month", "stays_in_weekend_nights", "stays_in_week_nights",
    "adults", "children", "babies", "meal", "country", "market_segment",
    "distribution_channel", "is_repeated_guest", "previous_cancellations",
    "previous_bookings_not_canceled", "reserved_room_type", "deposit_type",
    "agent", "company", "customer_type", "adr", "required_car_parking_spaces",
    "total_of_special_requests",
    # Engineered features
    "month_num", "total_nights", "total_guests",
    "has_company", "has_agent", "total_cost", "dow", "booking_ordinal",
    "day_of_year", "adr_per_guest", "prev_cancel_ratio",
]


# ──────────────────────── feature engineering ────────────────────────────────
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add engineered features for the Booking-Time model (36 features)."""
    df = df.copy()

    if "arrival_date_month" in df.columns:
        df["month_num"] = df["arrival_date_month"].map(MONTH_MAP).fillna(0).astype(int)
    else:
        df["month_num"] = 0

    df["total_nights"] = (
        df.get("stays_in_weekend_nights", pd.Series(0, index=df.index)) +
        df.get("stays_in_week_nights", pd.Series(0, index=df.index))
    )

    df["total_guests"] = (
        df.get("adults", pd.Series(1, index=df.index)) +
        df.get("children", pd.Series(0, index=df.index)) +
        df.get("babies", pd.Series(0, index=df.index))
    ).clip(lower=1)

    df["has_company"] = df.get("company", pd.Series(np.nan, index=df.index)).notna().astype(int)
    df["has_agent"] = df.get("agent", pd.Series(np.nan, index=df.index)).notna().astype(int)
    df["total_cost"] = df.get("adr", pd.Series(0, index=df.index)) * df["total_nights"]

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

    df["adr_per_guest"] = df.get("adr", pd.Series(0, index=df.index)) / df["total_guests"]

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
    artifact = joblib.load(path)
    if isinstance(artifact, dict):
        model = artifact["model"]
        feature_cols = artifact["feature_columns"]
        model_name = artifact.get("model_name", "Booking-Time XGBoost")
        val_acc = artifact.get("validation_accuracy", "N/A")
    else:
        model = artifact
        feature_cols = BOOKING_TIME_FEATURES
        model_name = "Booking-Time XGBoost"
        val_acc = "N/A"
    return model, feature_cols, model_name, val_acc


# ────────────────────────── predict function ─────────────────────────────────
def predict(df: pd.DataFrame, model_path: str = MODEL_PATH) -> pd.DataFrame:
    """
    Predict cancellation using only information available at booking time.

    Parameters
    ----------
    df : pd.DataFrame
        Bookings data (hotel_bookings.csv schema; assigned_room_type is optional).
    model_path : str
        Path to model joblib file.

    Returns
    -------
    pd.DataFrame with:
        - cancelled_prediction  : 1 = will cancel, 0 = will not cancel
        - cancel_probability    : cancellation probability (0–1)
    """
    model, feature_cols, model_name, val_acc = load_model(model_path)
    df_feat = engineer_features(df)

    for col in feature_cols:
        if col not in df_feat.columns:
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
    parser = argparse.ArgumentParser(description="Hotel Cancellation — Booking-Time Model")
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
        print("\n🔮  Running demo prediction on a sample booking...")
        sample = pd.DataFrame([{
            "hotel": "Resort Hotel",
            "lead_time": 60,
            "arrival_date_year": 2017,
            "arrival_date_month": "July",
            "arrival_date_week_number": 27,
            "arrival_date_day_of_month": 3,
            "stays_in_weekend_nights": 1,
            "stays_in_week_nights": 2,
            "adults": 2, "children": 1, "babies": 0,
            "meal": "HB",
            "country": "GBR",
            "market_segment": "Direct",
            "distribution_channel": "Direct",
            "is_repeated_guest": 0,
            "previous_cancellations": 0,
            "previous_bookings_not_canceled": 1,
            "reserved_room_type": "D",
            "deposit_type": "No Deposit",
            "agent": np.nan,
            "company": np.nan,
            "customer_type": "Transient",
            "adr": 115,
            "required_car_parking_spaces": 1,
            "total_of_special_requests": 2,
        }])
        result = predict(sample, args.model)
        label = "✈️  WILL CANCEL" if result["cancelled_prediction"].iloc[0] == 1 else "🏨  WILL NOT CANCEL"
        prob = result["cancel_probability"].iloc[0]
        print(f"\n    Prediction       : {label}")
        print(f"    Cancel probability: {prob:.2%}")


if __name__ == "__main__":
    main()
