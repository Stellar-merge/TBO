"""
Phase 6: XGBoost training with Optuna hyperparameter tuning.
Objective: binary:logistic. Device: cuda (GPU). Early stopping on val logloss.
~40 Optuna trials. Saves best model.
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import json
import logging
import warnings
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import xgboost as xgb
import optuna
from optuna.samplers import TPESampler
import joblib

warnings.filterwarnings("ignore")
optuna.logging.set_verbosity(optuna.logging.WARNING)

from .utils import load_config, get_project_root, setup_logging

FEAT_EXCL = ["label", "date_time"]


def get_feature_cols(df: pd.DataFrame) -> list:
    return [c for c in df.columns if c not in FEAT_EXCL]


def try_cuda_else_cpu(cfg: dict, logger) -> tuple:
    """Try cuda, fall back to cpu if unavailable."""
    tree_method = cfg["model"]["tree_method"]
    device = cfg["model"]["device"]
    
    try:
        # Quick test
        test_dmat = xgb.DMatrix(np.random.rand(100, 5), label=np.random.randint(0, 2, 100))
        xgb.train({"tree_method": "hist", "device": "cuda", "verbosity": 0}, test_dmat,
                  num_boost_round=1)
        logger.info("CUDA available — using GPU for XGBoost")
        return "hist", "cuda"
    except Exception as e:
        logger.warning(f"CUDA not available ({e}), falling back to CPU hist")
        return "hist", "cpu"


def build_dmatrix(df: pd.DataFrame, feat_cols: list) -> xgb.DMatrix:
    X = df[feat_cols].fillna(-999).values.astype(np.float32)
    y = df["label"].values.astype(np.float32)
    return xgb.DMatrix(X, label=y, feature_names=feat_cols)


def run_optuna_trial(trial, dtrain, dval, tree_method, device, cfg, logger):
    """Single Optuna trial."""
    space = cfg["optuna"]["search_space"]
    
    params = {
        "objective": cfg["model"]["objective"],
        "tree_method": tree_method,
        "device": device,
        "eval_metric": ["logloss", "aucpr"],
        "seed": cfg["project"]["seed"],
        "verbosity": 0,
        "max_depth": trial.suggest_int("max_depth", *space["max_depth"]),
        "learning_rate": trial.suggest_float("learning_rate", *space["learning_rate"], log=True),
        "min_child_weight": trial.suggest_int("min_child_weight", *space["min_child_weight"]),
        "subsample": trial.suggest_float("subsample", *space["subsample"]),
        "colsample_bytree": trial.suggest_float("colsample_bytree", *space["colsample_bytree"]),
        "reg_lambda": trial.suggest_float("reg_lambda", *space["reg_lambda"], log=True),
        "reg_alpha": trial.suggest_float("reg_alpha", *space["reg_alpha"]),
        "gamma": trial.suggest_float("gamma", *space["gamma"]),
    }
    
    evals_result = {}
    model = xgb.train(
        params,
        dtrain,
        num_boost_round=cfg["model"]["num_boost_round"],
        evals=[(dtrain, "train"), (dval, "val")],
        early_stopping_rounds=cfg["model"]["early_stopping_rounds"],
        evals_result=evals_result,
        verbose_eval=False,
    )
    
    best_score = min(evals_result["val"]["logloss"])
    return best_score, model, params


def run_phase6(feature_splits: dict | None = None) -> dict:
    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "phase6_xgboost")
    logger.info("Phase 6: XGBoost training + Optuna tuning")

    processed_dir = root / cfg["paths"]["data"]["processed"]
    artifacts_dir = root / cfg["paths"]["artifacts"]
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    reports_dir = root / cfg["paths"]["reports"]

    if feature_splits is None:
        feature_splits = {}
        for split in ["train", "val"]:
            p = processed_dir / f"features_{split}.parquet"
            feature_splits[split] = pd.read_parquet(p)
            logger.info(f"Loaded {split}: {feature_splits[split].shape}")

    train_df = feature_splits["train"]
    val_df = feature_splits["val"]
    
    feat_cols = get_feature_cols(train_df)
    # Keep only numeric
    feat_cols = [c for c in feat_cols if train_df[c].dtype in [np.float32, np.float64,
                                                                  np.int32, np.int64,
                                                                  "float32", "float64",
                                                                  "int32", "int64"]]
    logger.info(f"Feature count: {len(feat_cols)}")
    logger.info(f"Train: {len(train_df):,}, Val: {len(val_df):,}")

    # Try GPU
    tree_method, device = try_cuda_else_cpu(cfg, logger)
    
    # Update config decision
    cfg["model"]["tree_method"] = tree_method
    cfg["model"]["device"] = device
    
    logger.info("Building DMatrices...")
    dtrain = build_dmatrix(train_df, feat_cols)
    dval = build_dmatrix(val_df, feat_cols)

    # --- Optuna study ---
    n_trials = cfg["optuna"]["n_trials"]
    timeout = cfg["optuna"]["timeout_seconds"]
    seed = cfg["project"]["seed"]
    
    logger.info(f"Starting Optuna: {n_trials} trials, timeout={timeout}s")
    
    best_score = float("inf")
    best_model = None
    best_params = None
    all_trials = []
    
    sampler = TPESampler(seed=seed)
    study = optuna.create_study(direction="minimize", sampler=sampler)
    
    def objective(trial):
        nonlocal best_score, best_model, best_params
        score, model, params = run_optuna_trial(
            trial, dtrain, dval, tree_method, device, cfg, logger
        )
        all_trials.append({
            "trial": trial.number,
            "score": score,
            "params": params,
        })
        if score < best_score:
            best_score = score
            best_model = model
            best_params = params
            logger.info(f"Trial {trial.number}: NEW BEST logloss={score:.5f}")
        else:
            logger.info(f"Trial {trial.number}: logloss={score:.5f}")
        return score
    
    study.optimize(objective, n_trials=n_trials, timeout=timeout, show_progress_bar=False)
    
    logger.info(f"Best trial: logloss={best_score:.5f}")
    logger.info(f"Best params: {best_params}")
    
    # --- Refit best configuration ---
    logger.info("Refitting best configuration on train data...")
    evals_result = {}
    best_model = xgb.train(
        best_params,
        dtrain,
        num_boost_round=cfg["model"]["num_boost_round"],
        evals=[(dtrain, "train"), (dval, "val")],
        early_stopping_rounds=cfg["model"]["early_stopping_rounds"],
        evals_result=evals_result,
        verbose_eval=False,
    )
    best_score = min(evals_result["val"]["logloss"])
    logger.info(f"Refitted model best val logloss: {best_score:.5f}")
    
    # Save model
    model_path = artifacts_dir / "xgb_model.json"
    best_model.save_model(str(model_path))
    logger.info(f"Model saved to {model_path}")
    
    # Save trial history
    trial_path = reports_dir / "optuna_trials.json"
    with open(trial_path, "w") as f:
        json.dump(all_trials, f, indent=2, default=str)
    
    # Save feature list used by model
    feature_info = {
        "feature_names": feat_cols,
        "n_features": len(feat_cols),
        "best_params": best_params,
        "best_val_logloss": best_score,
        "tree_method": tree_method,
        "device": device,
        "n_trials": len(all_trials),
    }
    with open(artifacts_dir / "xgb_feature_info.json", "w") as f:
        json.dump(feature_info, f, indent=2)
    
    # Leakage alarm
    if best_score < 0.05:
        logger.warning("⚠️ LEAKAGE ALARM: val logloss is suspiciously low! Audit features.")
    
    logger.info("Phase 6 complete.")
    return best_model, best_params, feat_cols, feature_info


if __name__ == "__main__":
    run_phase6()
