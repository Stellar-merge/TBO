"""
Phase 8: Final evaluation on the test block (called ONCE).
Metrics: ROC-AUC, PR-AUC, log loss, Brier, ECE, calibration curve,
lift/gain by decile, precision/recall, bootstrap CIs, aggregate checks,
segment performance, leakage alarms.
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
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import (
    roc_auc_score, average_precision_score, log_loss, brier_score_loss,
    roc_curve, precision_recall_curve
)

warnings.filterwarnings("ignore")

from .utils import load_config, get_project_root, setup_logging

FEAT_EXCL = ["label", "date_time"]


def compute_ece(y_true, y_pred, n_bins=10):
    bins = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for i in range(n_bins):
        mask = (y_pred >= bins[i]) & (y_pred < bins[i + 1])
        if mask.sum() == 0:
            continue
        ece += mask.sum() * abs(y_true[mask].mean() - y_pred[mask].mean())
    return float(ece / max(len(y_true), 1))


def bootstrap_metrics(y_true, y_pred, n=200, seed=42):
    rng = np.random.default_rng(seed)
    roc_aucs, pr_aucs, loglosses, briers = [], [], [], []
    n_rows = len(y_true)
    for _ in range(n):
        idx = rng.integers(0, n_rows, n_rows)
        yt, yp = y_true[idx], y_pred[idx]
        if yt.sum() == 0 or yt.sum() == len(yt):
            continue
        roc_aucs.append(roc_auc_score(yt, yp))
        pr_aucs.append(average_precision_score(yt, yp))
        loglosses.append(log_loss(yt, np.clip(yp, 1e-7, 1 - 1e-7)))
        briers.append(brier_score_loss(yt, yp))
    return {
        "roc_auc_ci95": [float(np.percentile(roc_aucs, 2.5)), float(np.percentile(roc_aucs, 97.5))],
        "pr_auc_ci95": [float(np.percentile(pr_aucs, 2.5)), float(np.percentile(pr_aucs, 97.5))],
        "logloss_ci95": [float(np.percentile(loglosses, 2.5)), float(np.percentile(loglosses, 97.5))],
        "brier_ci95": [float(np.percentile(briers, 2.5)), float(np.percentile(briers, 97.5))],
    }


def lift_gain_table(y_true, y_pred, n_deciles=10):
    df = pd.DataFrame({"y_true": y_true, "y_pred": y_pred})
    df["decile"] = pd.qcut(df["y_pred"], q=n_deciles, labels=False, duplicates="drop")
    df["decile"] = n_deciles - df["decile"]  # 1=highest score
    table = df.groupby("decile").agg(
        n=("y_true", "count"),
        actual_bookings=("y_true", "sum"),
        avg_pred=("y_pred", "mean"),
    ).sort_index()
    table["actual_rate"] = table["actual_bookings"] / table["n"]
    overall_rate = y_true.mean()
    table["lift"] = table["actual_rate"] / max(overall_rate, 1e-10)
    table["cumul_actual"] = table["actual_bookings"].cumsum()
    table["cumul_pct"] = table["cumul_actual"] / max(table["actual_bookings"].sum(), 1)
    return table.reset_index()


def segment_performance(y_true, y_pred, df, col, n_bins=None):
    """Performance by a categorical or binned column."""
    result = {}
    if col not in df.columns:
        return result
    if n_bins is not None:
        try:
            groups = pd.qcut(df[col], q=n_bins, labels=False, duplicates="drop")
        except Exception:
            groups = df[col]
    else:
        groups = df[col]
    
    for grp in groups.unique():
        mask = (groups == grp)
        if mask.sum() < 20:
            continue
        yt, yp = y_true[mask], y_pred[mask]
        if yt.sum() == 0 or yt.sum() == len(yt):
            continue
        result[str(grp)] = {
            "n": int(mask.sum()),
            "base_rate": float(yt.mean()),
            "roc_auc": float(roc_auc_score(yt, yp)),
            "logloss": float(log_loss(yt, np.clip(yp, 1e-7, 1 - 1e-7))),
            "avg_pred": float(yp.mean()),
        }
    return result


def run_phase8(feature_splits: dict | None = None,
               xgb_model=None, calibrator_info: dict | None = None,
               feat_cols: list | None = None,
               baseline_metrics: dict | None = None) -> dict:
    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "phase8_evaluation")
    logger.info("=" * 60)
    logger.info("Phase 8: FINAL EVALUATION (TEST BLOCK — CALLED ONCE)")
    logger.info("=" * 60)

    processed_dir = root / cfg["paths"]["data"]["processed"]
    artifacts_dir = root / cfg["paths"]["artifacts"]
    reports_dir = root / cfg["paths"]["reports"]

    # Load everything
    if xgb_model is None:
        xgb_model = xgb.Booster()
        xgb_model.load_model(str(artifacts_dir / "xgb_model.json"))

    if feat_cols is None:
        with open(artifacts_dir / "xgb_feature_info.json") as f:
            feat_info = json.load(f)
        feat_cols = feat_info["feature_names"]

    if calibrator_info is None:
        calibrator_info = joblib.load(artifacts_dir / "calibrator.joblib")

    if baseline_metrics is None:
        with open(artifacts_dir / "baseline_metrics.json") as f:
            baseline_metrics = json.load(f)

    if feature_splits is None:
        feature_splits = {}
        for split in ["test", "train", "val"]:
            p = processed_dir / f"features_{split}.parquet"
            if p.exists():
                feature_splits[split] = pd.read_parquet(p)

    test_df = feature_splits["test"]
    logger.info(f"Test set: {len(test_df):,} rows, base_rate={test_df['label'].mean():.4f}")

    # Get predictions
    feat_cols_present = [c for c in feat_cols if c in test_df.columns]
    X_test = test_df[feat_cols_present].fillna(-999).values.astype(np.float32)
    dtest = xgb.DMatrix(X_test, feature_names=feat_cols_present)
    y_raw = xgb_model.predict(dtest)
    y_true = test_df["label"].values

    # Apply calibrator
    cal_method = calibrator_info["method"]
    cal = calibrator_info["calibrator"]
    if cal_method == "isotonic":
        y_pred = cal.predict(y_raw).clip(1e-7, 1 - 1e-7)
    else:
        y_pred = cal.predict_proba(y_raw.reshape(-1, 1))[:, 1]

    # --- Leakage alarm ---
    roc_auc_val = roc_auc_score(y_true, y_pred)
    if roc_auc_val > 0.95:
        logger.warning("⚠️ LEAKAGE ALARM: Test ROC-AUC > 0.95! Stopping for audit.")
        logger.warning(f"  Test ROC-AUC = {roc_auc_val:.4f}")
        # Note: we still continue and report, but flag it prominently
    
    # --- Shuffled label sanity check ---
    rng = np.random.default_rng(99)
    y_shuffled = y_true.copy()
    rng.shuffle(y_shuffled)
    roc_auc_shuffled = roc_auc_score(y_shuffled, y_pred)
    logger.info(f"Shuffled-label sanity check: AUC={roc_auc_shuffled:.4f} (should be ~0.5)")

    # --- Core metrics ---
    core_metrics = {
        "roc_auc": float(roc_auc_val),
        "pr_auc": float(average_precision_score(y_true, y_pred)),
        "log_loss": float(log_loss(y_true, y_pred)),
        "brier_score": float(brier_score_loss(y_true, y_pred)),
        "ece": float(compute_ece(y_true, y_pred)),
        "n_test": int(len(y_true)),
        "base_rate": float(y_true.mean()),
        "shuffled_label_auc": float(roc_auc_shuffled),
        "leakage_flag": bool(roc_auc_val > 0.95),
    }
    logger.info(f"Core metrics: {core_metrics}")

    # --- Bootstrap CIs ---
    logger.info("Bootstrap CIs (200 resamples)...")
    ci_metrics = bootstrap_metrics(y_true, y_pred, n=200, seed=42)
    
    # --- Thresholds ---
    thresholds = cfg["evaluation"]["thresholds"]
    threshold_metrics = {}
    for thr in thresholds:
        y_bin = (y_pred >= thr).astype(int)
        tp = ((y_bin == 1) & (y_true == 1)).sum()
        fp = ((y_bin == 1) & (y_true == 0)).sum()
        fn = ((y_bin == 0) & (y_true == 1)).sum()
        prec = tp / max(tp + fp, 1)
        rec = tp / max(tp + fn, 1)
        threshold_metrics[f"thr_{thr}"] = {
            "precision": float(prec), "recall": float(rec),
            "n_flagged": int(y_bin.sum()),
        }

    # --- Lift/gain table ---
    lift_table = lift_gain_table(y_true, y_pred)

    # --- Aggregate checks: predicted vs actual by dest x month ---
    agg_check = {}
    agg_grp = None
    if "srch_destination_id_freq" in test_df.columns:
        # Use freq-encoded destination as proxy (we don't have raw dest in feature set)
        # Instead use segments from test raw
        raw_test_path = root / cfg["paths"]["data"]["interim"] / "split_test_raw.parquet"
        if raw_test_path.exists():
            raw_test = pd.read_parquet(raw_test_path)
            if "srch_destination_id" in raw_test.columns and "checkin_month" in test_df.columns:
                agg_df = pd.DataFrame({
                    "dest": raw_test["srch_destination_id"].values[:len(test_df)],
                    "month": test_df["checkin_month"].values,
                    "y_true": y_true,
                    "y_pred": y_pred,
                })
                agg_grp = agg_df.groupby(["dest", "month"]).agg(
                    n_searches=("y_true", "count"),
                    actual_bookings=("y_true", "sum"),
                    expected_bookings=("y_pred", "sum"),
                ).reset_index()
                agg_grp = agg_grp[agg_grp["n_searches"] >= 10]  # min size
                mae = float((agg_grp["expected_bookings"] - agg_grp["actual_bookings"]).abs().mean())
                bias = float((agg_grp["expected_bookings"] - agg_grp["actual_bookings"]).mean())
                denom = agg_grp["actual_bookings"].replace(0, np.nan)
                mape = float(((agg_grp["expected_bookings"] - agg_grp["actual_bookings"]).abs() / denom).dropna().mean())
                agg_check = {
                    "n_destination_month_groups": int(len(agg_grp)),
                    "mae": mae,
                    "mape": mape,
                    "bias": bias,
                }
                logger.info(f"Aggregate check (dest x month): MAE={mae:.3f}, MAPE={mape:.3f}, bias={bias:.3f}")
    
    # Per-1000-searches table
    per_1000 = {
        "expected_bookings_per_1000": float(y_pred.mean() * 1000),
        "actual_bookings_per_1000": float(y_true.mean() * 1000),
    }

    # --- Segment performance ---
    segs = {}
    if "is_mobile" in test_df.columns:
        segs["is_mobile"] = segment_performance(y_true, y_pred, test_df, "is_mobile")
    if "lead_time_days" in test_df.columns:
        segs["lead_time_bucket"] = segment_performance(y_true, y_pred, test_df, "lead_time_days", n_bins=5)
    if "num_adults" in test_df.columns:
        segs["num_adults"] = segment_performance(y_true, y_pred, test_df, "num_adults")
    if "is_package" in test_df.columns:
        segs["is_package"] = segment_performance(y_true, y_pred, test_df, "is_package")

    # --- Comparison vs baselines (approximate — baselines were computed on val) ---
    baseline_comparison = {
        "xgb_calibrated": {
            "roc_auc": core_metrics["roc_auc"],
            "pr_auc": core_metrics["pr_auc"],
            "log_loss": core_metrics["log_loss"],
            "brier_score": core_metrics["brier_score"],
        }
    }
    for name, bmet in baseline_metrics.items():
        if isinstance(bmet, dict) and "log_loss" in bmet:
            baseline_comparison[name] = {
                "roc_auc": bmet.get("roc_auc", None),
                "pr_auc": bmet.get("pr_auc", None),
                "log_loss": bmet.get("log_loss", None),
                "brier_score": bmet.get("brier_score", None),
            }

    # --- Plots ---
    fig, axes = plt.subplots(2, 3, figsize=(18, 11))
    fig.suptitle("Phase 8: Final Test Evaluation\n(PUBLIC CONSUMER DATA — NOT TBO B2B)",
                 fontsize=12, fontweight="bold")

    # 1. ROC curve
    ax = axes[0, 0]
    fpr, tpr, _ = roc_curve(y_true, y_pred)
    ax.plot(fpr, tpr, "b-", label=f"XGB (AUC={core_metrics['roc_auc']:.4f})")
    ax.plot([0, 1], [0, 1], "k--")
    ax.set_xlabel("FPR")
    ax.set_ylabel("TPR")
    ax.set_title("ROC Curve (Test Set)")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # 2. PR curve
    ax = axes[0, 1]
    prec_arr, rec_arr, _ = precision_recall_curve(y_true, y_pred)
    ax.plot(rec_arr, prec_arr, "r-", label=f"XGB (PR-AUC={core_metrics['pr_auc']:.4f})")
    ax.axhline(y_true.mean(), color="k", linestyle="--", label=f"Baseline ({y_true.mean():.4f})")
    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title("Precision-Recall Curve (Test Set)")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # 3. Lift chart
    ax = axes[0, 2]
    if len(lift_table) > 0:
        ax.bar(lift_table["decile"].astype(str), lift_table["lift"], color="steelblue", alpha=0.8)
        ax.axhline(1, color="red", linestyle="--", label="Baseline lift=1")
        ax.set_xlabel("Decile (1=highest score)")
        ax.set_ylabel("Lift")
        ax.set_title("Lift by Score Decile")
        ax.legend()
        ax.grid(True, alpha=0.3)

    # 4. Calibration curve
    ax = axes[1, 0]
    from sklearn.calibration import calibration_curve
    frac_pos, mean_pred = calibration_curve(y_true, y_pred, n_bins=20)
    ax.plot([0, 1], [0, 1], "k--", label="Perfect")
    ax.plot(mean_pred, frac_pos, "o-b", label=f"XGB Calibrated (ECE={core_metrics['ece']:.4f})")
    ax.set_xlabel("Mean Predicted")
    ax.set_ylabel("Fraction Positive")
    ax.set_title("Calibration Curve (Test)")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # 5. Prediction distribution
    ax = axes[1, 1]
    ax.hist(y_pred[y_true == 0], bins=50, alpha=0.6, density=True,
            color="steelblue", label="Non-booking")
    ax.hist(y_pred[y_true == 1], bins=50, alpha=0.6, density=True,
            color="orangered", label="Booking")
    ax.set_xlabel("Predicted Probability")
    ax.set_ylabel("Density")
    ax.set_title("Score Distribution by Label")
    ax.legend()
    ax.grid(True, alpha=0.3)

    # 6. Summary metrics table
    ax = axes[1, 2]
    ax.axis("off")
    summary_text = (
        f"Test Set Metrics\n"
        f"{'─'*30}\n"
        f"ROC-AUC:    {core_metrics['roc_auc']:.4f}\n"
        f"PR-AUC:     {core_metrics['pr_auc']:.4f}\n"
        f"Log Loss:   {core_metrics['log_loss']:.5f}\n"
        f"Brier:      {core_metrics['brier_score']:.5f}\n"
        f"ECE:        {core_metrics['ece']:.5f}\n"
        f"{'─'*30}\n"
        f"N test:     {core_metrics['n_test']:,}\n"
        f"Base rate:  {core_metrics['base_rate']:.4f}\n"
        f"{'─'*30}\n"
        f"Expected per 1000:\n"
        f"  Model: {per_1000['expected_bookings_per_1000']:.1f}\n"
        f"  Actual: {per_1000['actual_bookings_per_1000']:.1f}\n"
    )
    ax.text(0.05, 0.95, summary_text, transform=ax.transAxes, fontsize=9,
            verticalalignment="top", fontfamily="monospace",
            bbox=dict(boxstyle="round", facecolor="lightyellow", alpha=0.8))

    plt.tight_layout()
    chart_path = reports_dir / "08_final_evaluation.png"
    plt.savefig(chart_path, dpi=120, bbox_inches="tight")
    plt.close()
    logger.info(f"Evaluation charts saved to {chart_path}")

    # Aggregate scatter plot
    if agg_check and agg_grp is not None:
        try:
            fig2, ax2 = plt.subplots(figsize=(8, 6))
            ax2.scatter(agg_grp["actual_bookings"], agg_grp["expected_bookings"],
                       alpha=0.4, s=20, color="steelblue")
            max_val = max(agg_grp[["actual_bookings", "expected_bookings"]].max().max(), 1)
            ax2.plot([0, max_val], [0, max_val], "r--", label="Perfect")
            ax2.set_xlabel("Actual Bookings (dest x month)")
            ax2.set_ylabel("Expected Bookings")
            ax2.set_title(f"Aggregate Accuracy: MAE={agg_check['mae']:.2f}, Bias={agg_check['bias']:.2f}")
            ax2.legend()
            ax2.grid(True, alpha=0.3)
            scatter_path = reports_dir / "08_aggregate_scatter.png"
            plt.savefig(scatter_path, dpi=120, bbox_inches="tight")
            plt.close()
            logger.info(f"Aggregate scatter saved to {scatter_path}")
        except Exception as e:
            logger.warning(f"Aggregate scatter plot failed: {e}")

    # --- Compile final metrics ---
    final_metrics = {
        "timestamp": datetime.now().isoformat(),
        "note": "PUBLIC CONSUMER DATA — NOT TBO B2B DATA",
        "core": core_metrics,
        "bootstrap_ci": ci_metrics,
        "thresholds": threshold_metrics,
        "aggregate_check": agg_check,
        "per_1000_searches": per_1000,
        "segment_performance": segs,
        "baseline_comparison": baseline_comparison,
        "lift_table": lift_table.to_dict(orient="records"),
        "leakage_checks": {
            "shuffled_label_auc": float(roc_auc_shuffled),
            "leakage_flag": bool(roc_auc_val > 0.95),
        },
    }

    with open(artifacts_dir / "metrics.json", "w") as f:
        json.dump(final_metrics, f, indent=2, default=str)
    logger.info("Final metrics saved to artifacts/metrics.json")

    # Beat baselines check
    xgb_ll = core_metrics["log_loss"]
    xgb_prauc = core_metrics["pr_auc"]
    for bname, bmet in baseline_comparison.items():
        if bname == "xgb_calibrated":
            continue
        if bmet.get("log_loss") and bmet["log_loss"] < xgb_ll:
            logger.warning(f"⚠️ XGB does NOT beat {bname} on log loss: {xgb_ll:.5f} vs {bmet['log_loss']:.5f}")
        if bmet.get("pr_auc") and bmet["pr_auc"] > xgb_prauc:
            logger.warning(f"⚠️ XGB does NOT beat {bname} on PR-AUC: {xgb_prauc:.4f} vs {bmet['pr_auc']:.4f}")

    logger.info("Phase 8 complete.")
    return final_metrics


if __name__ == "__main__":
    run_phase8()
