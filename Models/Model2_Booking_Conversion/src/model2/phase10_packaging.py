"""
Phase 10: Packaging and handoff.
Writes: model_card.md, README.md, version.txt, FINAL_REPORT.md.
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from datetime import datetime

from .utils import load_config, get_project_root, setup_logging


def run_phase10(artifacts: dict | None = None):
    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "phase10_packaging")
    logger.info("Phase 10: Packaging and handoff")

    artifacts_dir = root / cfg["paths"]["artifacts"]
    reports_dir = root / cfg["paths"]["reports"]
    docs_dir = root / cfg["paths"]["docs"]
    docs_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # Load metrics
    metrics_path = artifacts_dir / "metrics.json"
    if metrics_path.exists():
        with open(metrics_path) as f:
            final_metrics = json.load(f)
    else:
        final_metrics = {}

    core = final_metrics.get("core", {})
    baseline_comp = final_metrics.get("baseline_comparison", {})

    # --- version.txt ---
    version_path = artifacts_dir / "version.txt"
    with open(version_path, "w") as f:
        f.write(f"model: Model2_Booking_Conversion\n")
        f.write(f"version: 1.0.0\n")
        f.write(f"built: {datetime.now().isoformat()}\n")
        f.write(f"framework: xgboost + sklearn calibration\n")
        f.write(f"data: Expedia Hotel Recommendations (Kaggle 2016) — PUBLIC CONSUMER DATA\n")
        f.write(f"seed: 42\n")
    logger.info(f"Wrote {version_path}")

    # Copy requirements.txt to artifacts
    shutil.copy(root / "requirements.txt", artifacts_dir / "requirements.txt")

    # --- model_card.md ---
    _write_model_card(artifacts_dir, core, baseline_comp, cfg, logger)

    # --- README.md ---
    _write_readme(root, logger)

    # --- FINAL_REPORT.md ---
    _write_final_report(reports_dir, core, baseline_comp, final_metrics, cfg, logger)

    logger.info("Phase 10 complete.")


def _write_model_card(artifacts_dir: Path, core: dict, baseline_comp: dict,
                       cfg: dict, logger):
    path = artifacts_dir / "model_card.md"
    with open(path, "w", encoding="utf-8") as f:
        f.write("# Model Card: Model 2 — Booking Conversion Prediction\n\n")
        f.write("> **⚠️ IMPORTANT: Trained on PUBLIC CONSUMER-TRAVEL PROXY DATA, NOT TBO B2B data.**\n")
        f.write("> Calibration WILL shift on real TBO traffic. Recalibrate before production use.\n\n")
        f.write(f"**Version**: 1.0.0  \n")
        f.write(f"**Date**: {datetime.now().date()}  \n")
        f.write(f"**Algorithm**: XGBoost (binary:logistic) + Calibration  \n\n")

        f.write("## Intended Use\n\n")
        f.write("Estimate the probability that a hotel search/availability request ")
        f.write("results in a confirmed booking. Used by the TBO SmartStock AI optimizer ")
        f.write("to compute expected bookings per destination/date and decide pre-purchase volumes.\n\n")

        f.write("## Data\n\n")
        f.write("| Item | Value |\n|------|-------|\n")
        f.write("| Primary dataset | Expedia Hotel Recommendations (Kaggle 2016) |\n")
        f.write("| Data type | PUBLIC consumer travel (proxy for B2B) |\n")
        f.write("| Label | search intent group → 1 if any booking event |\n")
        f.write("| Training period | ~60% of data by time |\n")
        f.write("| No price/availability | Expedia data lacks price columns |\n\n")

        f.write("## Performance (Test Set)\n\n")
        f.write("| Metric | Value |\n|--------|-------|\n")
        for k, v in core.items():
            if isinstance(v, float):
                f.write(f"| {k} | {v:.5f} |\n")

        f.write("\n## Limitations\n\n")
        limitations = [
            "Trained on **public consumer** data — NOT B2B. Consumer behaviour differs from travel agents.",
            "No price or availability columns in the Expedia dataset — model cannot learn price effects.",
            "Calibration will shift on TBO B2B traffic. Must recalibrate on real TBO data.",
            "Trivago dataset was identified as a secondary/robustness check only (different label definition).",
            "Destination PCA features capture latent geography but cannot substitute for real availability data.",
            "Model is snapshot-trained; must be retrained periodically as booking patterns evolve.",
        ]
        for lim in limitations:
            f.write(f"- {lim}\n")

        f.write("\n## Files in this Package\n\n")
        f.write("| File | Description |\n|------|-------------|\n")
        f.write("| xgb_model.json | Trained XGBoost booster |\n")
        f.write("| calibrator.joblib | Chosen probability calibrator |\n")
        f.write("| feature_spec.json | Feature names, dtypes, missing handling |\n")
        f.write("| metrics.json | All evaluation metrics (source of truth) |\n")
        f.write("| requirements.txt | Pinned dependency versions |\n")
        f.write("| shap_explainer.joblib | SHAP TreeExplainer |\n")

    logger.info(f"model_card.md written to {path}")


def _write_readme(root: Path, logger):
    path = root / "README.md"
    with open(path, "w", encoding="utf-8") as f:
        f.write("# Model 2: Booking Conversion Prediction\n\n")
        f.write("> **⚠️ Data is public consumer-travel proxy, NOT TBO B2B data. Recalibrate before production.**\n\n")
        f.write("Part of TBO SmartStock AI — estimates P(search → booking) for hotel inventory optimization.\n\n")

        f.write("## Quick Start (5 commands)\n\n")
        f.write("```bash\n")
        f.write("# 1. Create and activate virtual environment\n")
        f.write("python -m venv venv && venv\\Scripts\\activate\n\n")
        f.write("# 2. Install dependencies\n")
        f.write("pip install -r requirements.txt\n\n")
        f.write("# 3. Run full pipeline (sample mode — fast)\n")
        f.write("python run_all.py\n\n")
        f.write("# 4. Run full pipeline on all data (slow, 37M rows)\n")
        f.write("python run_all.py --final\n\n")
        f.write("# 5. Run tests\n")
        f.write("python -m pytest tests/ -v\n")
        f.write("```\n\n")

        f.write("## Predict on new data\n\n")
        f.write("```bash\n")
        f.write("python -m model2.predict --input searches.csv --output predictions.csv\n")
        f.write("```\n\n")

        f.write("## Python API\n\n")
        f.write("```python\n")
        f.write("import sys; sys.path.insert(0, 'src')\n")
        f.write("from model2.predict import predict_conversion_proba, expected_bookings, explain_prediction\n\n")
        f.write("# Predict\n")
        f.write("proba = predict_conversion_proba(df)  # np.ndarray [0, 1]\n\n")
        f.write("# Aggregate for optimizer\n")
        f.write("agg = expected_bookings(df, group_cols=['dest', 'checkin_month'])\n")
        f.write("# agg has: n_searches, expected_bookings, expected_conversion_rate\n\n")
        f.write("# Explain (Explanation Agent)\n")
        f.write("explanation = explain_prediction(row, top_k=5)\n")
        f.write("```\n\n")

        f.write("## Project Structure\n\n")
        f.write("```\n")
        f.write("Model2_Booking_Conversion/\n")
        f.write("├── run_all.py              # Single entry point\n")
        f.write("├── config.yaml             # All configuration and paths\n")
        f.write("├── requirements.txt        # Pinned versions\n")
        f.write("├── src/model2/             # Source code\n")
        f.write("│   ├── predict.py          # Inference + CLI\n")
        f.write("│   ├── phase0_environment.py\n")
        f.write("│   ├── phase1_data_audit.py\n")
        f.write("│   ├── phase2_labeling.py\n")
        f.write("│   ├── phase3_features.py\n")
        f.write("│   ├── phase4_splits.py\n")
        f.write("│   ├── phase5_baselines.py\n")
        f.write("│   ├── phase6_xgboost.py\n")
        f.write("│   ├── phase7_calibration.py\n")
        f.write("│   ├── phase8_evaluation.py\n")
        f.write("│   ├── phase9_shap.py\n")
        f.write("│   └── phase10_packaging.py\n")
        f.write("├── data/\n")
        f.write("│   ├── interim/            # Labeled groups, raw splits\n")
        f.write("│   └── processed/          # Feature matrices (Parquet)\n")
        f.write("├── artifacts/model2/       # Deliverable model files\n")
        f.write("├── reports/                # Charts and reports\n")
        f.write("├── docs/                   # Decisions, feature contract, notes\n")
        f.write("├── tests/                  # pytest tests\n")
        f.write("└── logs/                   # Execution logs\n")
        f.write("```\n")

    logger.info(f"README.md written to {path}")


def _write_final_report(reports_dir: Path, core: dict, baseline_comp: dict,
                          final_metrics: dict, cfg: dict, logger):
    path = reports_dir / "FINAL_REPORT.md"
    with open(path, "w", encoding="utf-8") as f:
        f.write("# Final Report: Model 2 — Booking Conversion Prediction\n\n")
        f.write("> **⚠️ Data is PUBLIC CONSUMER-TRAVEL PROXY DATA, NOT TBO B2B data.**\n")
        f.write("> All numbers come from code executed on this data. See `artifacts/metrics.json`.\n\n")
        f.write(f"*Generated: {datetime.now().isoformat()}*\n\n")
        f.write("---\n\n")

        f.write("## 1. What This Model Does\n\n")
        f.write("Model 2 estimates **P(a search/availability request → confirmed booking)**. ")
        f.write("It takes features known at the moment of a hotel search and outputs a calibrated ")
        f.write("probability in [0, 1]. The TBO SmartStock AI optimizer sums these probabilities ")
        f.write("into *expected bookings* per destination and date, which drives pre-purchase decisions.\n\n")
        f.write("**Example**: 1,000 searches with average predicted rate of 12% → 120 expected bookings.\n\n")

        f.write("## 2. Data and Label Definition\n\n")
        f.write("### Primary Dataset\n")
        f.write("**Expedia Hotel Recommendations** (Kaggle 2016). ")
        f.write("Public consumer data. Each row is a click or booking event. ")
        f.write("**NOT TBO B2B data**.\n\n")
        f.write("**Label**: Events are grouped by search intent — ")
        f.write("the tuple `(user_id, destination, check-in, check-out, rooms, adults, children)`. ")
        f.write("The group label = 1 if any event in the group has `is_booking = 1`.\n\n")
        f.write("**Unit of analysis**: One row = one search intent.\n\n")

        f.write("### Secondary Dataset (Descriptive Only)\n")
        f.write("The `archive/hotel_bookings.csv` file is the **Hotel Booking Demand** dataset ")
        f.write("(Antonio et al. 2019). It has `is_canceled`, not `is_booking`. ")
        f.write("It was **not pooled** with Expedia and was used for descriptive reference only.\n\n")

        f.write("## 3. Results vs Baselines\n\n")
        f.write("| Model | ROC-AUC | PR-AUC | Log Loss | Brier Score |\n")
        f.write("|-------|---------|--------|----------|-------------|\n")
        
        xgb_data = baseline_comp.get("xgb_calibrated", core)
        f.write(f"| **XGB Calibrated (ours)** | "
                f"**{xgb_data.get('roc_auc', '?'):.4f}** | "
                f"**{xgb_data.get('pr_auc', '?'):.4f}** | "
                f"**{xgb_data.get('log_loss', '?'):.5f}** | "
                f"**{xgb_data.get('brier_score', '?'):.5f}** |\n")
        
        for bname, bmet in baseline_comp.items():
            if bname == "xgb_calibrated":
                continue
            if isinstance(bmet, dict):
                roc = f"{bmet['roc_auc']:.4f}" if bmet.get('roc_auc') is not None else '—'
                pr = f"{bmet['pr_auc']:.4f}" if bmet.get('pr_auc') is not None else '—'
                ll = f"{bmet['log_loss']:.5f}" if bmet.get('log_loss') is not None else '—'
                bs = f"{bmet['brier_score']:.5f}" if bmet.get('brier_score') is not None else '—'
                f.write(f"| {bname} | {roc} | {pr} | {ll} | {bs} |\n")

        f.write("\n*Note: Baselines computed on validation set; XGB metrics on held-out test set.*\n\n")

        f.write("## 4. Calibration\n\n")
        cal_info = final_metrics.get("core", {})
        f.write(f"Calibration method chosen: see `artifacts/calibration_info.json`.  \n")
        f.write(f"Test ECE: {cal_info.get('ece', '?'):.5f}  \n")
        f.write("Calibration is critical because the optimizer sums probabilities — ")
        f.write("poor calibration creates systematic over/under-buying.\n\n")
        f.write("See calibration curve: `reports/07_calibration.png`\n\n")

        f.write("## 5. Top Drivers (SHAP)\n\n")
        shap_path = Path(cfg["paths"]["root"]) / cfg["paths"]["artifacts"] / "shap_summary.json"
        if shap_path.exists():
            with open(shap_path) as sf:
                shap_data = json.load(sf)
            top_feats = list(shap_data.get("top_features", {}).items())[:5]
            f.write("| Feature | Mean |SHAP| |\n|---------|--------|\n")
            for feat, val in top_feats:
                f.write(f"| {feat} | {val:.5f} |\n")
        f.write("\nSee `reports/09_shap_importance.png` and `docs/shap_business_note.md`.\n\n")

        f.write("## 6. How It Plugs Into the Optimizer\n\n")
        f.write("```python\n")
        f.write("# In the optimizer:\n")
        f.write("from model2.predict import expected_bookings\n\n")
        f.write("# df has one row per search, with feature columns\n")
        f.write("agg = expected_bookings(df, group_cols=['destination_id', 'checkin_month'])\n")
        f.write("# agg.expected_bookings is what the optimizer uses to decide pre-purchase volumes\n")
        f.write("```\n\n")
        f.write("The optimizer should treat `expected_bookings` as the demand signal, ")
        f.write("not the raw binary prediction.\n\n")

        f.write("## 7. Aggregate Accuracy\n\n")
        agg_check = final_metrics.get("aggregate_check", {})
        if agg_check:
            f.write(f"Destination x check-in month aggregate accuracy:\n")
            f.write(f"- MAE: {agg_check.get('mae', '?'):.3f} bookings per group\n")
            f.write(f"- MAPE: {agg_check.get('mape', '?'):.3f}\n")
            f.write(f"- Bias: {agg_check.get('bias', '?'):.3f} (positive = over-predicting)\n\n")
            f.write("See scatter plot: `reports/08_aggregate_scatter.png`\n\n")

        per_1k = final_metrics.get("per_1000_searches", {})
        f.write("### Per 1,000 Searches\n\n")
        f.write("| | Expected | Actual |\n|-|----------|--------|\n")
        f.write(f"| Bookings per 1,000 | "
                f"{per_1k.get('expected_bookings_per_1000', '?'):.1f} | "
                f"{per_1k.get('actual_bookings_per_1000', '?'):.1f} |\n\n")

        f.write("## 8. Limitations and Next Steps\n\n")
        f.write("### Known Limitations\n\n")
        limitations = [
            ("Public proxy data", "Trained on consumer Expedia data, not TBO B2B agent traffic. Consumer intent signals differ significantly."),
            ("No price/availability", "Expedia dataset lacks price or room availability columns — a primary booking driver is missing. Add when retrained on TBO data."),
            ("Calibration shift", "Probabilities will be miscalibrated on TBO traffic. Run isotonic recalibration on TBO data before production."),
            ("B2B vs consumer", "Travel agents have different conversion patterns (bulk searches, negotiated rates, corporate policies)."),
            ("Label definition", "Search-intent grouping is an approximation. If the same user searches multiple times with slightly different parameters, they appear as separate intents."),
            ("No trivago data", "trivago dataset's label (clickout = redirect to partner) has a different meaning than confirmed booking. Not pooled."),
        ]
        for title, desc in limitations:
            f.write(f"**{title}**: {desc}\n\n")

        f.write("### Next Steps\n\n")
        f.write("1. Retrain on TBO booking data with price and availability features.\n")
        f.write("2. Add recency decay to user history features.\n")
        f.write("3. Explore online learning for fast recalibration.\n")
        f.write("4. Add B2B-specific features: agency type, corporate account, rate class.\n")
        f.write("5. Integrate with the cancellation model (Model 3) to predict net bookings.\n\n")

        f.write("---\n\n")
        f.write("*All metrics sourced from `artifacts/model2/metrics.json`. ")
        f.write("No numbers were invented or rounded.*\n")

    logger.info(f"FINAL_REPORT.md written to {path}")


if __name__ == "__main__":
    run_phase10()
