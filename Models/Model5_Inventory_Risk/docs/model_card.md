# Model Card — Model 5: Inventory Risk Prediction

**System**: TBO SmartStock AI — Intelligent Travel Inventory Procurement & Risk Recovery  
**Model Name**: Model 5 — Hotel Inventory Procurement Risk Classifier  
**Algorithm**: Scikit-Learn `RandomForestClassifier` with Isotonic Probability Calibration  
**Model Version**: `2.0.0` (High-Performance >92% Accuracy Architecture)  
**Date**: November 2026  
**License**: Proprietary (TBO SmartStock AI Team)  

---

## 1. Model Overview

Model 5 classifies wholesale hotel inventory procurement commitments into three operational risk categories prior to committing wholesaler capital:
- **`BALANCED (0)`**: Realized net demand aligns within a $\pm 15\%$ tolerance window ($\ge 3$ rooms) of procured inventory.
- **`UNSOLD (1)`**: Procured room inventory exceeds realized customer demand by $> 15\%$, risking room spoilage or liquidation losses.
- **`SHORTAGE (2)`**: Procured room inventory falls short of customer demand by $> 15\%$, causing stockouts and lost revenue.

The model serves as the pre-commitment decision filter for TBO inventory procurement desks and automated algorithmic procurement workflows.

---

## 2. Intended Use & Scope

### Primary Use Case
- Automated pre-commitment risk scoring for prospective B2B hotel allotments and bedbank room commitments.
- Identifying high-risk room commitments (severe over-procurement or stockouts) 14 to 90 days before arrival.
- Generating calibrated probabilities to guide hedging, release-cutoff decisions, and downstream Dynamic Pricing (Model 4).

### Out-of-Scope / Misuse
- **Not a real-world production TBO model**: The model is trained on a **prototype hybrid dataset** featuring simulated wholesale procurement scenarios anchored to empirical demand from 2 Portuguese hotel properties (`hotels.csv`).
- **No direct flight or car rental application**: Specifically designed for hotel night allotments.
- **No autonomous supplier contract cancellations**: Outputs advisory probability scores only.

---

## 3. Training & Validation Data

- **Underlying Empirical Anchor**: Real reservation demand, cancellation pace, lead times, and ADR from `hotels.csv` (Antonio, de Almeida, and Nunes, 2019; Elsevier Data in Brief). Covers 119,388 cleaned bookings across 792 consecutive calendar days (July 2015 to August 2017) for two properties (`HOTEL_RESORT_01` in Algarve, `HOTEL_CITY_02` in Lisbon).
- **Synthetic Procurement Opportunities**: 23,576 simulated B2B procurement opportunities across 4 procurement strategies (Conservative, Balanced, Aggressive, Speculative), 4 simulated wholesaler suppliers (`SUP_AGODA_WHOLESALE`, `SUP_TBO_DIRECT`, `SUP_WEB_BEDS`, `SUP_HOTELBEDS`), and 3 contract flexibility tiers (`FLEXIBLE`, `SEMI_FLEXIBLE`, `NON_REFUNDABLE`).
- **Chronological Data Splits**:
  - **Train**: 2015-07-31 to 2016-07-31 (10,904 rows, 46.3%)
  - **Validation**: 2016-08-01 to 2016-12-31 (4,896 rows, 20.8%)
  - **Test**: 2017-01-01 to 2017-08-31 (7,776 rows, 33.0%)
- **Zero-Lookahead Safeguard**: All candidate predictive features are computed strictly on data preceding $T_{decision} = \text{checkin\_date} - \text{lead\_time}$. All scenarios for any single stay date reside in the exact same split.

---

## 4. Hyperparameters & Architecture

```json
{
  "n_estimators": 200,
  "max_depth": 18,
  "min_samples_split": 4,
  "min_samples_leaf": 2,
  "max_features": "sqrt",
  "class_weight": "balanced",
  "random_state": 42,
  "n_jobs": -1
}
```

- **Preprocessing**: `OneHotEncoder(handle_unknown='ignore')` on 5 categorical features, `SimpleImputer(strategy='median')` on 54 numerical features (33 baseline + 21 engineered decision features). Total transformed dimension: 67 columns.
- **Calibration**: Isotonic regression fitted on held-out validation set using `FrozenEstimator`.

---

## 5. Performance Summary (Held-Out Test Set, N = 7,776)

### Four-Model Performance Comparison (Held-Out Test Set)

| Model Configuration | Test Accuracy | Balanced Accuracy | Macro F1 | Weighted F1 | Brier Score |
|---|---|---|---|---|---|
| **1. Baseline RF (Original Features, un-tuned)** | 85.71% | 80.52% | 0.8119 | 0.8570 | 0.2577 |
| **2. RF + Feature Engineering (un-tuned)** | **92.37%** | **90.66%** | **0.9079** | **0.9236** | **0.1119** |
| **3. Tuned RF (Optimized Hyperparameters)** | **92.13%** | **91.47%** | **0.9085** | **0.9213** | **0.1149** |
| **4. Final Selected RF (Tuned + Calibrated)** | **92.34%** | **90.74%** | **0.9078** | **0.9233** | **0.1122** |

### Per-Class Performance on Test Set
- **UNSOLD (1)**: Precision = 94.96%, Recall = 95.65%, **F1 = 0.9530**
- **SHORTAGE (2)**: Precision = 95.26%, Recall = 94.52%, **F1 = 0.9489**
- **BALANCED (0)**: Precision = 82.24%, Recall = 82.05%, **F1 = 0.8214**

### Cross-Polar Error Rate
- **UNSOLD misclassified as SHORTAGE**: **0 cases (0.0%)**
- **SHORTAGE misclassified as UNSOLD**: **0 cases (0.0%)**

---

## 6. Key Driving Features

1. `ratio_q_m1` (Gini: 0.1561) — Ratio of commitment $Q$ to Model 1 demand forecast
2. `norm_dist_m1` (Gini: 0.1546) — Normalized distance from forecast in units of tolerance
3. `diff_q_m1` (Gini: 0.1303) — Absolute room difference between commitment and forecast
4. `abs_norm_dist_m1` (Gini: 0.1138) — Absolute distance from BALANCED corridor center
5. `ind_m1_below` (Gini: 0.0770) — Flag for $Q < M1 - \text{Tol}$ (SHORTAGE corridor)
6. `ind_m1_above` (Gini: 0.0769) — Flag for $Q > M1 + \text{Tol}$ (UNSOLD corridor)
7. `ind_m1_inside` (Gini: 0.0650) — Flag for $|Q - M1| \le \text{Tol}$ (BALANCED corridor)
8. `pace_deficit` (Gini: 0.0212) — Uncovered commitment: $\max(0, Q - \text{Pace})$

---

## 7. Known Limitations & Caveats

1. **Two Portuguese Properties**: Ground truth demand is anchored to 2 hotel properties in Portugal. Transferability to international metropolitan hubs requires real wholesaler transactional ingestion.
2. **Synthetic Procurement Quantities**: Procurement opportunities represent realistic simulated scenarios ($Q/D \in [0.4, 2.3]$); this prototype demonstrates structural feasibility and leakage-safe engineering.
3. **Upstream Model Dependency**: Features `model1_demand_forecast`, `model2_conversion_prob_est`, `model3_cancellation_risk_est`, and `model4_price_momentum_est` are simulated proxies. In production, they are populated by live inference pipelines from Models 1–4.
