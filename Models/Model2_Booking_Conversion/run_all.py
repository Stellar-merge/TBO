"""
run_all.py — Single entry point. Reproduces everything from raw data.
Usage: python run_all.py [--sample] [--skip-phase N]
  --sample: use sample_frac (dev mode, default for all phases except phase 2 final)
  --final: use full data (slow)
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from datetime import datetime

# Ensure src is on path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from model2.utils import load_config, get_project_root, setup_logging


def main():
    parser = argparse.ArgumentParser(description="Model 2: Booking Conversion — Full Pipeline")
    parser.add_argument("--final", action="store_true",
                        help="Run on full data (default: use sample_frac for speed)")
    parser.add_argument("--skip-phases", nargs="+", type=int, default=[],
                        help="Phase numbers to skip (e.g. --skip-phases 1 2)")
    parser.add_argument("--only-phase", type=int, default=None,
                        help="Run only this phase number")
    args = parser.parse_args()

    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "run_all")
    
    logger.info("=" * 70)
    logger.info("Model 2: Booking Conversion Prediction — Full Pipeline")
    logger.info("NOTE: PUBLIC CONSUMER DATA — NOT TBO B2B DATA")
    logger.info(f"Mode: {'FULL DATA' if args.final else 'SAMPLE (dev)'}")
    logger.info(f"Started: {datetime.now().isoformat()}")
    logger.info("=" * 70)

    use_sample = not args.final
    skip = set(args.skip_phases)
    only = args.only_phase
    
    timings = {}
    artifacts = {}
    
    def should_run(phase_n: int) -> bool:
        if only is not None:
            return phase_n == only
        return phase_n not in skip
    
    # =========================================
    # PHASE 0: Environment
    # =========================================
    if should_run(0):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 0: Environment\n" + "="*50)
        from model2.phase0_environment import run_phase0
        env_info = run_phase0()
        timings[0] = time.time() - t0
        logger.info(f"Phase 0 done in {timings[0]:.1f}s")

    # =========================================
    # PHASE 1: Data Audit
    # =========================================
    if should_run(1):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 1: Data Audit\n" + "="*50)
        from model2.phase1_data_audit import run_phase1
        expedia_stats, archive_stats = run_phase1()
        timings[1] = time.time() - t0
        logger.info(f"Phase 1 done in {timings[1]:.1f}s")
        logger.info(f"  Expedia: {expedia_stats['total_rows']:,} rows, "
                    f"base_rate={expedia_stats['base_rate']:.4f}")

    # =========================================
    # PHASE 2: Labeling
    # =========================================
    if should_run(2):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 2: Label + Unit of Analysis\n" + "="*50)
        from model2.phase2_labeling import run_phase2
        labeled_df, decision = run_phase2(use_sample=use_sample)
        timings[2] = time.time() - t0
        logger.info(f"Phase 2 done in {timings[2]:.1f}s")
        logger.info(f"  Unit: {decision['unit_of_analysis']}, "
                    f"N={decision['n_groups']:,}, rate={decision['group_base_rate']:.4f}")
        artifacts["labeled_df"] = labeled_df
        artifacts["phase2_decision"] = decision
    else:
        # Load from disk
        import pandas as pd
        interim_dir = root / cfg["paths"]["data"]["interim"]
        p = interim_dir / "labeled_groups.parquet"
        if p.exists():
            labeled_df = pd.read_parquet(p)
            artifacts["labeled_df"] = labeled_df
            logger.info(f"Loaded labeled_groups.parquet: {labeled_df.shape}")

    # =========================================
    # PHASE 4: Splits (before 3, because 3 needs splits)
    # =========================================
    if should_run(4):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 4: Chronological Splits\n" + "="*50)
        from model2.phase4_splits import run_phase4
        raw_splits, split_stats = run_phase4(labeled_df=artifacts.get("labeled_df"))
        timings[4] = time.time() - t0
        logger.info(f"Phase 4 done in {timings[4]:.1f}s")
        for sname, sstats in split_stats.items():
            if isinstance(sstats, dict) and "n_rows" in sstats:
                logger.info(f"  {sname}: {sstats['n_rows']:,} rows, rate={sstats['base_rate']:.4f}")
        artifacts["raw_splits"] = raw_splits
    else:
        import pandas as pd
        interim_dir = root / cfg["paths"]["data"]["interim"]
        raw_splits = {}
        for sname in ["train", "val", "cal", "test"]:
            p = interim_dir / f"split_{sname}_raw.parquet"
            if p.exists():
                raw_splits[sname] = pd.read_parquet(p)
        artifacts["raw_splits"] = raw_splits

    # =========================================
    # PHASE 3: Feature Engineering
    # =========================================
    if should_run(3):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 3: Feature Engineering\n" + "="*50)
        from model2.phase3_features import run_phase3
        feature_splits = run_phase3(split_dfs=artifacts.get("raw_splits"))
        timings[3] = time.time() - t0
        logger.info(f"Phase 3 done in {timings[3]:.1f}s")
        for sname, fdf in feature_splits.items():
            logger.info(f"  {sname} features: {fdf.shape}")
        artifacts["feature_splits"] = feature_splits
    else:
        import pandas as pd
        processed_dir = root / cfg["paths"]["data"]["processed"]
        feature_splits = {}
        for sname in ["train", "val", "cal", "test"]:
            p = processed_dir / f"features_{sname}.parquet"
            if p.exists():
                feature_splits[sname] = pd.read_parquet(p)
        artifacts["feature_splits"] = feature_splits

    # =========================================
    # PHASE 5: Baselines
    # =========================================
    if should_run(5):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 5: Baselines\n" + "="*50)
        from model2.phase5_baselines import run_phase5
        baseline_metrics = run_phase5(feature_splits=artifacts.get("feature_splits"))
        timings[5] = time.time() - t0
        logger.info(f"Phase 5 done in {timings[5]:.1f}s")
        artifacts["baseline_metrics"] = baseline_metrics
    else:
        artifacts_dir = root / cfg["paths"]["artifacts"]
        p = artifacts_dir / "baseline_metrics.json"
        if p.exists():
            with open(p) as f:
                artifacts["baseline_metrics"] = json.load(f)

    # =========================================
    # PHASE 6: XGBoost
    # =========================================
    if should_run(6):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 6: XGBoost + Optuna\n" + "="*50)
        from model2.phase6_xgboost import run_phase6
        xgb_model, best_params, feat_cols, feature_info = run_phase6(
            feature_splits=artifacts.get("feature_splits")
        )
        timings[6] = time.time() - t0
        logger.info(f"Phase 6 done in {timings[6]:.1f}s")
        artifacts["xgb_model"] = xgb_model
        artifacts["feat_cols"] = feat_cols
        artifacts["feature_info"] = feature_info
    else:
        import xgboost as xgb
        artifacts_dir = root / cfg["paths"]["artifacts"]
        model_path = artifacts_dir / "xgb_model.json"
        if model_path.exists():
            xgb_model = xgb.Booster()
            xgb_model.load_model(str(model_path))
            with open(artifacts_dir / "xgb_feature_info.json") as f:
                feature_info = json.load(f)
            feat_cols = feature_info["feature_names"]
            artifacts["xgb_model"] = xgb_model
            artifacts["feat_cols"] = feat_cols
        else:
            logger.warning("xgb_model.json not found — skipping model load")

    # =========================================
    # PHASE 7: Calibration
    # =========================================
    if should_run(7):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 7: Calibration\n" + "="*50)
        from model2.phase7_calibration import run_phase7
        cal_result, calibrator, cal_method = run_phase7(
            feature_splits=artifacts.get("feature_splits"),
            xgb_model=artifacts.get("xgb_model"),
            feat_cols=artifacts.get("feat_cols"),
        )
        timings[7] = time.time() - t0
        logger.info(f"Phase 7 done in {timings[7]:.1f}s")
        logger.info(f"  Chosen calibrator: {cal_result['chosen_method']}")
        artifacts["calibrator_info"] = {
            "method": cal_method, "calibrator": calibrator
        }

    # =========================================
    # PHASE 8: Final Evaluation (ONCE)
    # =========================================
    if should_run(8):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 8: FINAL TEST EVALUATION\n" + "="*50)
        from model2.phase8_evaluation import run_phase8
        final_metrics = run_phase8(
            feature_splits=artifacts.get("feature_splits"),
            xgb_model=artifacts.get("xgb_model"),
            feat_cols=artifacts.get("feat_cols"),
            baseline_metrics=artifacts.get("baseline_metrics"),
        )
        timings[8] = time.time() - t0
        logger.info(f"Phase 8 done in {timings[8]:.1f}s")
        core = final_metrics.get("core", {})
        logger.info(f"  Test ROC-AUC: {core.get('roc_auc', '?'):.4f}")
        logger.info(f"  Test PR-AUC:  {core.get('pr_auc', '?'):.4f}")
        logger.info(f"  Test LogLoss: {core.get('log_loss', '?'):.5f}")
        artifacts["final_metrics"] = final_metrics

    # =========================================
    # PHASE 9: SHAP
    # =========================================
    if should_run(9):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 9: SHAP Explainability\n" + "="*50)
        from model2.phase9_shap import run_phase9
        shap_result, explainer = run_phase9(
            feature_splits=artifacts.get("feature_splits"),
            xgb_model=artifacts.get("xgb_model"),
            feat_cols=artifacts.get("feat_cols"),
        )
        timings[9] = time.time() - t0
        logger.info(f"Phase 9 done in {timings[9]:.1f}s")
        artifacts["shap_result"] = shap_result

    # =========================================
    # PHASE 10: Packaging + Docs
    # =========================================
    if should_run(10):
        t0 = time.time()
        logger.info("\n" + "="*50 + "\nPHASE 10: Packaging + Docs\n" + "="*50)
        from model2.phase10_packaging import run_phase10
        run_phase10(artifacts=artifacts)
        timings[10] = time.time() - t0
        logger.info(f"Phase 10 done in {timings[10]:.1f}s")

    # =========================================
    # Summary
    # =========================================
    total_time = sum(timings.values())
    logger.info("\n" + "="*70)
    logger.info("PIPELINE COMPLETE")
    logger.info(f"Total time: {total_time/60:.1f} minutes")
    logger.info("Phase timings:")
    for ph, t in timings.items():
        logger.info(f"  Phase {ph}: {t:.1f}s")
    
    if "final_metrics" in artifacts:
        core = artifacts["final_metrics"].get("core", {})
        logger.info(f"\nFINAL TEST METRICS:")
        logger.info(f"  ROC-AUC: {core.get('roc_auc', 'N/A')}")
        logger.info(f"  PR-AUC:  {core.get('pr_auc', 'N/A')}")
        logger.info(f"  LogLoss: {core.get('log_loss', 'N/A')}")
        logger.info(f"  Brier:   {core.get('brier_score', 'N/A')}")
        logger.info(f"  ECE:     {core.get('ece', 'N/A')}")
    
    logger.info("="*70)
    logger.info("Run: python run_all.py --final  to run on full data")
    logger.info("Run: python -m pytest tests/  to run all tests")
    logger.info("="*70)


if __name__ == "__main__":
    main()
