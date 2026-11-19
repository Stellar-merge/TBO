"""
batch_predict.py — Run both models on a CSV and compare results side-by-side.

Usage:
    python src/batch_predict.py --csv dataset/hotel_bookings.csv
    python src/batch_predict.py --csv dataset/hotel_bookings.csv --output reports/predictions.csv
"""

import argparse
import os
import sys
import warnings

import pandas as pd
import numpy as np

warnings.filterwarnings("ignore")

HERE = os.path.dirname(__file__)
sys.path.insert(0, HERE)

from predict_overall import predict as predict_overall, load_model as load_overall
from predict_booking_time import predict as predict_booking_time, load_model as load_booking_time

OVERALL_MODEL_PATH = os.path.join(HERE, "..", "trained_models", "best_overall_model.joblib")
BOOKING_TIME_MODEL_PATH = os.path.join(HERE, "..", "trained_models", "best_booking_time_model.joblib")


def run_both(df: pd.DataFrame) -> pd.DataFrame:
    """Run both models and return a combined result DataFrame."""
    r1 = predict_overall(df, OVERALL_MODEL_PATH)
    r2 = predict_booking_time(df, BOOKING_TIME_MODEL_PATH)

    result = df.copy()
    result["overall_prediction"] = r1["cancelled_prediction"]
    result["overall_cancel_prob"] = r1["cancel_probability"]
    result["booking_time_prediction"] = r2["cancelled_prediction"]
    result["booking_time_cancel_prob"] = r2["cancel_probability"]
    result["models_agree"] = (result["overall_prediction"] == result["booking_time_prediction"]).astype(int)
    return result


def print_summary(result: pd.DataFrame):
    n = len(result)
    print(f"\n{'='*60}")
    print(f"  BATCH PREDICTION SUMMARY  ({n:,} bookings)")
    print(f"{'='*60}")

    print(f"\n  Overall Model (86.22% accuracy):")
    n_cancel = result["overall_prediction"].sum()
    print(f"    Cancel : {n_cancel:,} ({n_cancel/n*100:.1f}%)")
    print(f"    Keep   : {n-n_cancel:,} ({(n-n_cancel)/n*100:.1f}%)")

    print(f"\n  Booking-Time Model (85.02% accuracy):")
    n_cancel2 = result["booking_time_prediction"].sum()
    print(f"    Cancel : {n_cancel2:,} ({n_cancel2/n*100:.1f}%)")
    print(f"    Keep   : {n-n_cancel2:,} ({(n-n_cancel2)/n*100:.1f}%)")

    agree = result["models_agree"].sum()
    print(f"\n  Agreement between models: {agree:,}/{n:,} ({agree/n*100:.1f}%)")
    print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(description="Batch predict with both hotel cancellation models")
    parser.add_argument("--csv", required=True, help="Path to hotel bookings CSV")
    parser.add_argument("--output", default=None, help="Output CSV path for predictions")
    args = parser.parse_args()

    print(f"📂  Loading: {args.csv}")
    df = pd.read_csv(args.csv)
    print(f"    Rows: {len(df):,}")

    result = run_both(df)
    print_summary(result)

    if args.output:
        result.to_csv(args.output, index=False)
        print(f"\n💾  Saved predictions to: {args.output}")
    else:
        print(f"\n📋  First 5 rows:")
        cols = ["overall_prediction", "overall_cancel_prob", "booking_time_prediction", "booking_time_cancel_prob", "models_agree"]
        print(result[cols].head().to_string())


if __name__ == "__main__":
    main()
