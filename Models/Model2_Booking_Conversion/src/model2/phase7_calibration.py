"""
Phase 7: Calibration.
Fit isotonic and Platt calibrators on the calibration block.
Choose the better one by cross-validation inside that block.
Save calibrator.joblib.
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import json
import warnings
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import brier_score_loss, log_loss
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore")

from .utils import load_config, get_project_root, setup_logging

FEAT_EXCL = ["label", "date_time"]


def get_feature_cols(df: pd.DataFrame, all_feat_cols: list) -> list:
    return [c for c in all_feat_cols if c in df.columns]


def compute_ece(y_true: np.ndarray, y_pred: np.ndarray, n_bins: int = 10) -> float:
    """Expected Calibration Error."""
    bins = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        mask = (y_pred >= bins[i]) & (y_pred < bins[i + 1])
        if mask.sum() == 0:
            continue
        bin_acc = y_true[mask].mean()
        bin_conf = y_pred[mask].mean()
        ece += mask.sum() * abs(bin_acc - bin_conf)
    return float(ece / len(y_true))


def raw_xgb_predict(model, df: pd.DataFrame, feat_cols: list) -> np.ndarray:
    X = df[feat_cols].fillna(-999).values.astype(np.float32)
    dmat = xgb.DMatrix(X, feature_names=feat_cols)
    return model.predict(dmat)


def run_phase7(feature_splits: dict | None = None,
               xgb_model=None, feat_cols: list | None = None) -> dict:
    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "phase7_calibration")
    logger.info("Phase 7: Calibration")

    processed_dir = root / cfg["paths"]["data"]["processed"]
    artifacts_dir = root / cfg["paths"]["artifacts"]
    reports_dir = root / cfg["paths"]["reports"]
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # Load model
    if xgb_model is None:
        xgb_model = xgb.Booster()
        xgb_model.load_model(str(artifacts_dir / "xgb_model.json"))
        logger.info("Loaded xgb_model.json")

    # Load feature info
    if feat_cols is None:
        with open(artifacts_dir / "xgb_feature_info.json") as f:
            feat_info = json.load(f)
        feat_cols = feat_info["feature_names"]

    # Load splits
    if feature_splits is None:
        feature_splits = {}
        for split in ["cal", "val"]:
            p = processed_dir / f"features_{split}.parquet"
            if p.exists():
                feature_splits[split] = pd.read_parquet(p)

    cal_df = feature_splits.get("cal")
    if cal_df is None or len(cal_df) == 0:
        logger.warning("No calibration set available; using validation set")
        cal_df = feature_splits.get("val")

    logger.info(f"Calibration set: {len(cal_df):,} rows")

    # Get raw probabilities from XGBoost
    feat_cols_present = get_feature_cols(cal_df, feat_cols)
    y_raw = raw_xgb_predict(xgb_model, cal_df, feat_cols_present)
    y_true = cal_df["label"].values

    logger.info(f"Raw XGBoost: logloss={log_loss(y_true, y_raw):.5f}, "
                f"brier={brier_score_loss(y_true, y_raw):.5f}, "
                f"ECE={compute_ece(y_true, y_raw):.5f}")

    # --- Isotonic calibration ---
    iso = IsotonicRegression(out_of_bounds="clip")
    
    # CV inside calibration block
    kf = StratifiedKFold(n_splits=5, shuffle=False)
    iso_logloss_cv = []
    platt_logloss_cv = []

    for fold_i, (tr_idx, va_idx) in enumerate(kf.split(y_raw, y_true)):
        # Isotonic
        iso_fold = IsotonicRegression(out_of_bounds="clip")
        iso_fold.fit(y_raw[tr_idx], y_true[tr_idx])
        y_iso_va = iso_fold.predict(y_raw[va_idx]).clip(1e-7, 1 - 1e-7)
        iso_logloss_cv.append(log_loss(y_true[va_idx], y_iso_va))

        # Platt (sigmoid logistic)
        X_platt = y_raw[tr_idx].reshape(-1, 1)
        platt_fold = LogisticRegression(C=1.0, max_iter=1000)
        platt_fold.fit(X_platt, y_true[tr_idx])
        y_platt_va = platt_fold.predict_proba(y_raw[va_idx].reshape(-1, 1))[:, 1]
        platt_logloss_cv.append(log_loss(y_true[va_idx], y_platt_va))

    iso_mean = np.mean(iso_logloss_cv)
    platt_mean = np.mean(platt_logloss_cv)
    logger.info(f"CV logloss — Isotonic: {iso_mean:.5f}, Platt: {platt_mean:.5f}")

    # Choose best
    if iso_mean <= platt_mean:
        chosen_method = "isotonic"
        iso.fit(y_raw, y_true)
        calibrator = iso
        logger.info("Chosen calibrator: Isotonic")
    else:
        chosen_method = "platt_sigmoid"
        platt = LogisticRegression(C=1.0, max_iter=1000)
        platt.fit(y_raw.reshape(-1, 1), y_true)
        calibrator = platt
        logger.info("Chosen calibrator: Platt sigmoid")

    # --- Calibrated probabilities ---
    if chosen_method == "isotonic":
        y_cal = calibrator.predict(y_raw).clip(1e-7, 1 - 1e-7)
    else:
        y_cal = calibrator.predict_proba(y_raw.reshape(-1, 1))[:, 1]

    cal_logloss = log_loss(y_true, y_cal)
    cal_brier = brier_score_loss(y_true, y_cal)
    cal_ece = compute_ece(y_true, y_cal)
    logger.info(f"Calibrated: logloss={cal_logloss:.5f}, brier={cal_brier:.5f}, ECE={cal_ece:.5f}")

    # --- Calibration curve plot ---
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("Calibration Analysis\n(PUBLIC CONSUMER DATA — NOT TBO B2B)",
                 fontsize=11, fontweight="bold")

    # Raw
    frac_pos_raw, mean_pred_raw = calibration_curve(y_true, y_raw, n_bins=20)
    ax1.plot([0, 1], [0, 1], "k--", label="Perfect")
    ax1.plot(mean_pred_raw, frac_pos_raw, "o-b", label=f"Raw XGB (ECE={compute_ece(y_true, y_raw):.4f})")
    ax1.plot(mean_pred_raw,
             (calibrator.predict(mean_pred_raw) if chosen_method == "isotonic"
              else calibrator.predict_proba(mean_pred_raw.reshape(-1, 1))[:, 1]),
             "s-r", label=f"{chosen_method} (ECE={cal_ece:.4f})")
    ax1.set_xlabel("Mean Predicted Probability")
    ax1.set_ylabel("Fraction of Positives")
    ax1.set_title("Calibration Curve")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    # Reliability diagram — binned
    n_bins = 10
    bins = np.linspace(0, 1, n_bins + 1)
    bin_centers = (bins[:-1] + bins[1:]) / 2
    actual_rates = []
    pred_rates = []
    for i in range(n_bins):
        mask = (y_cal >= bins[i]) & (y_cal < bins[i + 1])
        if mask.sum() > 0:
            actual_rates.append(y_true[mask].mean())
            pred_rates.append(y_cal[mask].mean())
        else:
            actual_rates.append(np.nan)
            pred_rates.append(bins[i] + 0.05)

    ax2.bar(bin_centers, actual_rates, width=0.08, alpha=0.7, color="steelblue", label="Actual")
    ax2.plot(bin_centers, bin_centers, "k--", label="Perfect")
    ax2.set_xlabel("Predicted Probability Bin")
    ax2.set_ylabel("Actual Positive Rate")
    ax2.set_title(f"Reliability Diagram ({chosen_method})")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    chart_path = reports_dir / "07_calibration.png"
    plt.savefig(chart_path, dpi=120, bbox_inches="tight")
    plt.close()
    logger.info(f"Calibration chart saved to {chart_path}")

    # --- Save calibrator ---
    cal_path = artifacts_dir / "calibrator.joblib"
    joblib.dump({
        "method": chosen_method,
        "calibrator": calibrator,
        "feat_cols": feat_cols_present,
    }, cal_path)
    logger.info(f"Calibrator saved to {cal_path}")

    result = {
        "chosen_method": chosen_method,
        "cv_logloss_isotonic": float(iso_mean),
        "cv_logloss_platt": float(platt_mean),
        "cal_metrics": {
            "logloss": float(cal_logloss),
            "brier_score": float(cal_brier),
            "ece": float(cal_ece),
        },
        "raw_metrics": {
            "logloss": float(log_loss(y_true, y_raw)),
            "brier_score": float(brier_score_loss(y_true, y_raw)),
            "ece": float(compute_ece(y_true, y_raw)),
        },
    }

    with open(artifacts_dir / "calibration_info.json", "w") as f:
        json.dump(result, f, indent=2)

    logger.info("Phase 7 complete.")
    return result, calibrator, chosen_method


if __name__ == "__main__":
    run_phase7()
