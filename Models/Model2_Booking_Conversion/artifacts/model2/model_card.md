# Model Card: Model 2 — Booking Conversion Prediction

> **⚠️ IMPORTANT: Trained on PUBLIC CONSUMER-TRAVEL PROXY DATA, NOT TBO B2B data.**
> Calibration WILL shift on real TBO traffic. Recalibrate before production use.

**Version**: 1.0.0  
**Date**: 2026-11-18  
**Algorithm**: XGBoost (binary:logistic) + Calibration  

## Intended Use

Estimate the probability that a hotel search/availability request results in a confirmed booking. Used by the TBO SmartStock AI optimizer to compute expected bookings per destination/date and decide pre-purchase volumes.

## Data

| Item | Value |
|------|-------|
| Primary dataset | Expedia Hotel Recommendations (Kaggle 2016) |
| Data type | PUBLIC consumer travel (proxy for B2B) |
| Label | search intent group → 1 if any booking event |
| Training period | ~60% of data by time |
| No price/availability | Expedia data lacks price columns |

## Performance (Test Set)

| Metric | Value |
|--------|-------|
| roc_auc | 0.75346 |
| pr_auc | 0.40781 |
| log_loss | 0.40476 |
| brier_score | 0.12688 |
| ece | 0.01048 |
| base_rate | 0.17778 |
| shuffled_label_auc | 0.50014 |

## Limitations

- Trained on **public consumer** data — NOT B2B. Consumer behaviour differs from travel agents.
- No price or availability columns in the Expedia dataset — model cannot learn price effects.
- Calibration will shift on TBO B2B traffic. Must recalibrate on real TBO data.
- Trivago dataset was identified as a secondary/robustness check only (different label definition).
- Destination PCA features capture latent geography but cannot substitute for real availability data.
- Model is snapshot-trained; must be retrained periodically as booking patterns evolve.

## Files in this Package

| File | Description |
|------|-------------|
| xgb_model.json | Trained XGBoost booster |
| calibrator.joblib | Chosen probability calibrator |
| feature_spec.json | Feature names, dtypes, missing handling |
| metrics.json | All evaluation metrics (source of truth) |
| requirements.txt | Pinned dependency versions |
| shap_explainer.joblib | SHAP TreeExplainer |
