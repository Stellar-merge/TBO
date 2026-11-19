# Model 5: Feature Importance & Explainability Report

**System**: TBO SmartStock AI  
**Module**: Model 5 — Inventory Risk Prediction  
**Evaluation Scope**: Gini Impurity (Tree-Based) & Permutation Importance (Validation Split)  
**Artifact Source**: `artifacts/model5/feature_importance.csv`  
**Status**: High-Accuracy Architecture (> 92% Test Accuracy)  

---

## 1. Executive Summary

Understanding why Model 5 assigns a procurement commitment to `UNSOLD`, `SHORTAGE`, or `BALANCED` is critical for building operational trust with TBO inventory managers. This report examines both global model mechanics (feature importances across 67 transformed inputs) and local prediction explainability.

> [!IMPORTANT]
> **Correlation vs. Causation Warning**: High feature importance signifies strong statistical predictive association within the decision-tree ensemble. It does not establish mathematical or economic causation. For instance, high procurement volume is associated with unsold outcomes because buying beyond historical market absorption creates inventory overhang, not because high volume inherently decreases traveler demand.

---

## 2. Top 15 Predictive Features

| Rank | Feature Name | Category | Gini Importance (MDI) | Permutation Importance (Mean $\pm$ Std) | Primary Operational Role |
|---|---|---|---|---|---|
| **1** | `ratio_q_m1` | Decision Boundary | **0.1561** (15.6%) | **0.0012** $\pm$ 0.0024 | Ratio of commitment $Q$ to Model 1 demand forecast |
| **2** | `norm_dist_m1` | Decision Boundary | **0.1546** (15.5%) | **0.0014** $\pm$ 0.0016 | Normalized distance from forecast in units of tolerance |
| **3** | `diff_q_m1` | Decision Boundary | **0.1303** (13.0%) | **0.0014** $\pm$ 0.0017 | Absolute room difference between commitment and forecast |
| **4** | `abs_norm_dist_m1` | Decision Boundary | **0.1138** (11.4%) | **0.0007** $\pm$ 0.0022 | Distance from BALANCED corridor center |
| **5** | `ind_m1_below` | Decision Boundary | **0.0770** (7.7%) | **0.0011** $\pm$ 0.0013 | Binary flag: $Q < M1 - \text{Tol}$ (SHORTAGE corridor) |
| **6** | `ind_m1_above` | Decision Boundary | **0.0769** (7.7%) | **0.0020** $\pm$ 0.0010 | Binary flag: $Q > M1 + \text{Tol}$ (UNSOLD corridor) |
| **7** | `ind_m1_inside` | Decision Boundary | **0.0650** (6.5%) | **0.0001** $\pm$ 0.0005 | Binary flag: $|Q - M1| \le \text{Tol}$ (BALANCED corridor) |
| **8** | `pace_deficit` | Buffer / Pace | **0.0212** (2.1%) | **0.0003** $\pm$ 0.0006 | Uncovered commitment: $\max(0, Q - \text{Pace})$ |
| **9** | `model1_demand_forecast` | Upstream Proxy | **0.0154** (1.5%) | **0.0003** $\pm$ 0.0005 | Projected total market demand |
| **10**| `supplier_risk_adjusted_qty` | Supplier / Margin | **0.0151** (1.5%) | **0.0001** $\pm$ 0.0003 | Volume weighted by supplier fulfillment reliability |
| **11**| `ratio_pace_to_q` | Buffer / Pace | **0.0135** (1.3%) | **0.0006** $\pm$ 0.0006 | Current pace as percentage of commitment |
| **12**| `procured_quantity` | Inventory | **0.0128** (1.3%) | **0.0005** $\pm$ 0.0005 | Absolute room nights committed |
| **13**| `ratio_q_h30` | Demand Ratio | **0.0106** (1.1%) | -0.0002 $\pm$ 0.0002 | Commitment relative to trailing 30-day demand |
| **14**| `ratio_q_h90` | Demand Ratio | **0.0084** (0.8%) | **0.0005** $\pm$ 0.0006 | Commitment relative to trailing 90-day demand |
| **15**| `pace_vs_historical_ratio` | Demand | **0.0077** (0.8%) | **0.0007** $\pm$ 0.0008 | Early booking velocity relative to curve |

---

## 3. Structural Findings

1. **Why the Decision-Boundary Features Solved the Accuracy Deficit**:
   - The top 7 features are all newly engineered decision-boundary features, accounting for **77.37% of total tree splitting power**.
   - Because standard Random Forest trees create orthogonal, axis-aligned splits, approximating a diagonal boundary ($Q \approx 1.15 D$) forced trees into a staircase approximation with high error variance along the boundary.
   - Introducing `ratio_q_m1`, `norm_dist_m1`, and `ind_m1_*` allowed single orthogonal splits to isolate the exact target tolerance boundary ($|Q - D| \le 15\%$), immediately improving test accuracy from $85.71\%$ to **$92.34\%$**.
2. **Buffer and Pace Protection**:
   - `pace_deficit` ($2.12\%$) and `supplier_risk_adjusted_qty` ($1.51\%$) provide the secondary safety filter: if $Q$ is high but already backed by confirmed reservations on the books (`pace_deficit` $\approx 0$), the model correctly suppresses false UNSOLD alarms.
3. **Multi-Window Demand Anchors**:
   - Ratios against 30-day and 90-day demand curves (`ratio_q_h30`, `ratio_q_h90`) guard against upstream demand forecast volatility.
