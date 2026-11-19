"""
Phase 5: Baselines.
(a) Global conversion rate
(b) Historical conversion per segment (destination x month, with smoothing)
(c) Regularized logistic regression
Evaluate on validation set. The model must beat these on log loss and PR-AUC.
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import json
import warnings
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (roc_auc_score, average_precision_score,
                             log_loss, brier_score_loss)
from sklearn.preprocessing import StandardScaler
import joblib

warnings.filterwarnings("ignore")

from .utils import load_config, get_project_root, setup_logging

FEATURE_COLS_EXCL = ["label", "date_time"]


def get_feature_cols(df: pd.DataFrame) -> list:
    return [c for c in df.columns if c not in FEATURE_COLS_EXCL]


def evaluate_preds(y_true: np.ndarray, y_pred: np.ndarray, name: str) -> dict:
    """Compute all metrics for a prediction."""
    y_true = np.array(y_true)
    y_pred = np.clip(np.array(y_pred), 1e-7, 1 - 1e-7)
    metrics = {
        "name": name,
        "roc_auc": float(roc_auc_score(y_true, y_pred)),
        "pr_auc": float(average_precision_score(y_true, y_pred)),
        "log_loss": float(log_loss(y_true, y_pred)),
        "brier_score": float(brier_score_loss(y_true, y_pred)),
        "n_samples": int(len(y_true)),
        "base_rate": float(y_true.mean()),
    }
    return metrics


def baseline_global_rate(train_df: pd.DataFrame, val_df: pd.DataFrame,
                          logger) -> dict:
    """Baseline (a): always predict the global training conversion rate."""
    rate = float(train_df["label"].mean())
    logger.info(f"Global rate baseline: {rate:.4f}")
    y_pred = np.full(len(val_df), rate)
    metrics = evaluate_preds(val_df["label"].values, y_pred, "baseline_global_rate")
    metrics["predicted_rate"] = rate
    return metrics, rate


def baseline_segment(train_df: pd.DataFrame, val_df: pd.DataFrame,
                      logger) -> tuple:
    """
    Baseline (b): historical conversion per destination x check-in month.
    With smoothing (m-estimate) and back-off to global rate.
    """
    global_rate = float(train_df["label"].mean())
    m = 20  # smoothing strength
    
    # Level 1: destination x check-in month
    if "checkin_month" in train_df.columns:
        dest_col = "srch_destination_id" if "srch_destination_id" in train_df.columns else None
        month_col = "checkin_month"
    else:
        dest_col = "srch_destination_id" if "srch_destination_id" in train_df.columns else None
        month_col = None
    
    seg_map = {}
    if dest_col and month_col and dest_col in train_df.columns:
        grouped = train_df.groupby([dest_col, month_col])["label"].agg(["sum", "count"])
        for (dest, month), row in grouped.iterrows():
            seg_map[(int(dest), int(month))] = (row["sum"] + m * global_rate) / (row["count"] + m)
    
    # Destination-only map (back-off)
    dest_map = {}
    if dest_col and dest_col in train_df.columns:
        grouped2 = train_df.groupby(dest_col)["label"].agg(["sum", "count"])
        for dest, row in grouped2.iterrows():
            dest_map[int(dest)] = (row["sum"] + m * global_rate) / (row["count"] + m)
    
    dests = val_df[dest_col].fillna(-1).values.astype(int) if (dest_col and dest_col in val_df.columns) else np.zeros(len(val_df), dtype=int)
    months = val_df[month_col].fillna(-1).values.astype(int) if (month_col and month_col in val_df.columns) else np.zeros(len(val_df), dtype=int)
    y_pred = np.empty(len(val_df), dtype=np.float64)
    for i in range(len(val_df)):
        k = (dests[i], months[i])
        if k in seg_map:
            y_pred[i] = seg_map[k]
        elif dests[i] in dest_map:
            y_pred[i] = dest_map[dests[i]]
        else:
            y_pred[i] = global_rate
            
    logger.info(f"Segment baseline: {len(seg_map)} destination-month segments")
    metrics = evaluate_preds(val_df["label"].values, y_pred, "baseline_segment")
    return metrics, seg_map, dest_map, global_rate


def baseline_logistic(train_df: pd.DataFrame, val_df: pd.DataFrame,
                        logger) -> tuple:
    """Baseline (c): regularized logistic regression."""
    feat_cols = get_feature_cols(train_df)
    # Keep only numeric columns
    numeric_cols = train_df[feat_cols].select_dtypes(include=[np.number]).columns.tolist()
    
    # Subsample train to 200k for fast logistic fitting if larger
    if len(train_df) > 200000:
        sample_idx = np.random.default_rng(42).choice(len(train_df), size=200000, replace=False)
        X_train = train_df[numeric_cols].iloc[sample_idx].fillna(0).values
        y_train = train_df["label"].iloc[sample_idx].values
    else:
        X_train = train_df[numeric_cols].fillna(0).values
        y_train = train_df["label"].values
        
    X_val = val_df[numeric_cols].fillna(0).values
    y_val = val_df["label"].values
    
    logger.info(f"Logistic regression: {len(numeric_cols)} features, {len(X_train):,} train rows")
    
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s = scaler.transform(X_val)
    
    lr = LogisticRegression(C=0.1, max_iter=200, random_state=42, n_jobs=-1,
                             class_weight=None, solver="lbfgs")
    lr.fit(X_train_s, y_train)
    y_pred = lr.predict_proba(X_val_s)[:, 1]
    
    metrics = evaluate_preds(y_val, y_pred, "baseline_logistic_regression")
    metrics["n_features"] = len(numeric_cols)
    
    logger.info(f"Logistic: ROC-AUC={metrics['roc_auc']:.4f}, PR-AUC={metrics['pr_auc']:.4f}, logloss={metrics['log_loss']:.4f}")
    
    return metrics, lr, scaler, numeric_cols


def run_phase5(feature_splits: dict | None = None) -> dict:
    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "phase5_baselines")
    logger.info("Phase 5: Baselines")

    processed_dir = root / cfg["paths"]["data"]["processed"]
    interim_dir = root / cfg["paths"]["data"]["interim"]

    if feature_splits is None:
        feature_splits = {}
        for split in ["train", "val", "cal", "test"]:
            p = processed_dir / f"features_{split}.parquet"
            if p.exists():
                feature_splits[split] = pd.read_parquet(p)
                logger.info(f"Loaded {split}: {feature_splits[split].shape}")

    train_df = feature_splits["train"]
    val_df = feature_splits["val"]
    
    # Also need raw splits for segment baseline (needs srch_destination_id)
    raw_train_path = interim_dir / "split_train_raw.parquet"
    raw_val_path = interim_dir / "split_val_raw.parquet"
    if raw_train_path.exists():
        raw_train = pd.read_parquet(raw_train_path)
        raw_val = pd.read_parquet(raw_val_path)
        # merge checkin_month from feature set
        if "checkin_month" in train_df.columns:
            raw_train["checkin_month"] = train_df["checkin_month"].values[:len(raw_train)]
            raw_val["checkin_month"] = val_df["checkin_month"].values[:len(raw_val)]
    else:
        raw_train = train_df
        raw_val = val_df
    
    logger.info("Computing baselines...")
    
    metrics_a, global_rate = baseline_global_rate(train_df, val_df, logger)
    logger.info(f"(a) Global rate: {metrics_a}")
    
    metrics_b, seg_map, dest_map, _ = baseline_segment(raw_train, raw_val, logger)
    logger.info(f"(b) Segment: ROC-AUC={metrics_b['roc_auc']:.4f}, logloss={metrics_b['log_loss']:.4f}")
    
    metrics_c, lr_model, lr_scaler, lr_cols = baseline_logistic(train_df, val_df, logger)
    logger.info(f"(c) Logistic: ROC-AUC={metrics_c['roc_auc']:.4f}, logloss={metrics_c['log_loss']:.4f}")
    
    baseline_results = {
        "global_rate": metrics_a,
        "segment": metrics_b,
        "logistic_regression": metrics_c,
        "timestamp": datetime.now().isoformat(),
    }
    
    # Save
    artifacts_dir = root / cfg["paths"]["artifacts"]
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    
    with open(artifacts_dir / "baseline_metrics.json", "w") as f:
        json.dump(baseline_results, f, indent=2)
    
    joblib.dump({
        "lr": lr_model, "scaler": lr_scaler, "cols": lr_cols,
        "global_rate": global_rate,
        "seg_map": seg_map, "dest_map": dest_map,
    }, artifacts_dir / "baselines.joblib")
    
    logger.info("Phase 5 complete.")
    return baseline_results


if __name__ == "__main__":
    run_phase5()
