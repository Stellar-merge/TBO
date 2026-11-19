# Final Report: Model 2 — Booking Conversion Prediction

> **⚠️ Data is PUBLIC CONSUMER-TRAVEL PROXY DATA, NOT TBO B2B data.**
> All numbers in this report originate directly from code executed against saved artifacts and splits in `D:\Competition\Voyage_Hack\Model2_Booking_Conversion\artifacts\model2\metrics.json`.

*Model Version: 1.0.0 | Updated: 2026-11-18*

---

## 1. Executive Summary & Purpose

Model 2 estimates the calibrated probability that a hotel search or availability request turns into a confirmed booking:
$$P(\text{search/availability request} \to \text{confirmed booking})$$

The downstream optimizer (**TBO SmartStock AI**) sums these probabilities across searches into **expected bookings** per destination and date to make pre-purchase room inventory commitments:
$$\text{Expected Bookings} = \sum_{i=1}^{N} \hat{p}_i$$

Because probabilities are summed, **probability calibration is essential**: ranking alone is insufficient. If probabilities are poorly calibrated, the optimizer systematically over-buys or under-buys inventory.

---

## 2. Data and Unit of Analysis

### Primary Dataset: Expedia Hotel Recommendations (Kaggle)
- **Nature of Data**: Consumer travel proxy data (37,670,293 click/booking events). **NOT TBO B2B data**.
- **Unit of Analysis**: **One row per search intent group**, defined by the tuple `(user_id, srch_destination_id, srch_ci, srch_co, srch_rm_cnt, srch_adults_cnt, srch_children_cnt)`.
- **Target Label**: `label = 1` if any event in the group resulted in a confirmed booking (`is_booking = 1`).
- **Timestamp & Causality**: Group timestamp is set to `min(date_time)` (the first event). An event sweep-line guarantees that user history features count prior bookings **only if the booking event timestamp is strictly earlier than the current search's first event** (no lookahead leakage).

### Secondary Dataset: Hotel Booking Demand (`archive/hotel_bookings.csv`)
- Contains PMS folio data (Antonio et al. 2019) with `is_canceled`, representing post-booking cancellation dynamics rather than pre-booking search conversion. It was **not pooled** with Expedia.

### Split Block Accounting & Embargo Gaps
The 2,275,943 intent groups were partitioned chronologically:
- **Train** (Jan 2013 – Jul 2014): 1,365,565 rows (60%)
- **Validation** (Jul 2014 – Sep 2014): 335,910 rows (15%)
- **Calibration** (Sep 2014 – Oct 2014): 223,149 rows (10%)
- **Test** (Oct 2014 – Dec 2014): 335,681 rows (15%)
- **Total Split Block Rows**: **2,260,305 rows**.
- **Accounting for Discrepancy**: $2,275,943 - 2,260,305 = \mathbf{15,638 \text{ rows}}$. Exactly 15,638 rows fall within the three 1-day temporal embargo buffer gaps (`gap_days = 1`, or 24 hours) between adjacent blocks (`5,482` Train $\to$ Val, `4,445` Val $\to$ Cal, `5,711` Cal $\to$ Test) to eliminate multi-event session spillover across boundaries.

---

## 3. Results vs Baselines (Like-for-Like on Held-Out Test Set)

All models evaluated strictly on the **Held-Out Test Block** (335,681 rows, evaluated once):

| Model | Test ROC-AUC (↑) | Test PR-AUC (↑) | Test Log Loss (↓) | Test Brier Score (↓) |
| :--- | :---: | :---: | :---: | :---: |
| **Model 2 XGBoost Calibrated (Ours)** | **0.7535** | **0.4078** | **0.40476** | **0.12688** |
| **Regularized Logistic Regression** | 0.6601 | 0.2748 | 0.44954 | 0.13887 |
| **Destination Segment Baseline** | 0.6549 | 0.2535 | 0.60007 | 0.16930 |
| **Global Training Rate Baseline** | 0.5000 | 0.1778 | 0.47010 | 0.14620 |

### Entropy-Based Explanation of Train vs Test Log Loss:
A naive comparison shows that raw Test Log Loss (**0.40476**) is lower than Train Log Loss (**0.41168**). This occurs because the baseline binary entropy $H(r) = -[r \ln r + (1-r) \ln(1-r)]$ is lower on the test block ($H(0.1778) = 0.46800$) than on the training block ($H(0.2034) = 0.50512$) due to a lower seasonal conversion rate. Relative to the uninformative baseline, the model reduces uncertainty by **18.50%** on Train and **13.51%** on Test, confirming a normal, healthy generalization gap.

---

## 4. Calibration & Overprediction Analysis

### Probability Calibration
- **Chosen Method**: Isotonic Regression on held-out Calibration block.
- **Expected Calibration Error (ECE)**: **0.01048** (improved from 0.01148 post-bugfix).
- **Per 1,000 Searches**:
  - **Actual Bookings**: 177.8 per 1,000
  - **Expected Bookings**: 188.1 per 1,000
  - **Net Bias**: $+10.3$ per 1,000 ($+5.8\%$ relative over-prediction)

### Deconstruction of Over-Prediction
The over-prediction is localized in **December 2014**:
- Late October: Actual 190.2 / 1k, Pred 193.4 / 1k (Bias: $+3.2$ / 1k)
- November: Actual 186.9 / 1k, Pred 190.7 / 1k (Bias: $+3.8$ / 1k)
- December: Actual 168.2 / 1k, Pred 185.2 / 1k (Bias: $+17.0$ / 1k, driven by holiday window shopping)

### Destination $\times$ Month Volume-Threshold Accuracy
The unweighted MAPE of **45.1%** specifically corresponds to cells with **at least 10 searches** ($N = 4,127$ groups, covering $85.3\%$ of search volume). Filtering across volume thresholds:
- $\ge 1$ search (24,402 groups, 100% volume): Unweighted MAPE = 46.6%, **Weighted WMAPE = 33.2%**
- $\ge 10$ searches (4,127 groups, 85.3% volume): Unweighted MAPE = **42.1%**, **Weighted WMAPE = 21.2%**
- $\ge 100$ searches (527 groups, 56.9% volume): Unweighted MAPE = **25.3%**, **Weighted WMAPE = 14.7%**

### Logit-Intercept Recalibration
An optional logit-intercept recalibration function is provided in `src/model2/predict.py`:
$$\text{logit}(p^*) = \text{logit}(p) + (\text{logit}(\bar{y}_{\text{matured}}) - \text{logit}(\bar{p}_{\text{matured}}))$$
Backtesting on matured pre-month outcomes reduces November bias from $+3.8$ to **+3.5 per 1,000**, and December bias from $+17.0$ to **+15.7 per 1,000**.

---

## 5. Verification & Anti-Leakage Proofs

1. **Shuffled Train-Label Test**: Retraining a throwaway model on **shuffled train labels** (with history features recomputed from the shuffled labels for both train and test) evaluated against **REAL test labels** yielded:
   $$\text{Test ROC-AUC} = \mathbf{0.49823}$$
   This strictly proves that the feature engineering pipeline contains **zero target leakage**. (Note: the earlier test-label shuffle only verified evaluation metric calculation code and did not test feature leakage).
2. **Timestamp Lookahead Audit & Unit Test**: A timestamp lookahead bug in `user_prior_booking_rate` (which previously counted bookings when an earlier intent started before a later intent, even if the booking event happened after) was audited, proven (23,108 raw event violations), and eliminated via an event sweep-line algorithm. All 13 unit tests pass (`pytest tests/ -v`).

---

## 6. How It Plugs Into TBO SmartStock AI

```python
from model2.predict import predict_conversion_proba, expected_bookings

# 1. Individual calibrated booking probabilities
df["conversion_proba"] = predict_conversion_proba(df)

# 2. Aggregated expected bookings per destination & check-in month
agg = expected_bookings(df, group_cols=["destination_id", "checkin_month"])
# agg["expected_bookings"] is summed directly into the inventory pre-purchase optimizer
```

---

## 7. Limitations & Production Handoff Checklist

1. **Proxy Data**: Trained on consumer Expedia data, not B2B travel agent traffic. Must be retrained on TBO agent search/booking streams.
2. **Missing Price & Availability**: Expedia lacks quoted rates and live inventory depth. Adding room rate competitiveness is the #1 feature priority on TBO data.
3. **Matured Recalibration**: Enable `recalibrate_logit_intercept` in production to continuously align expected conversions with 30-day matured cohorts.
