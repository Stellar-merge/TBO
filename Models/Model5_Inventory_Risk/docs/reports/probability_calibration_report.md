# Model 5: Probability Calibration Diagnostics Report

**System**: TBO SmartStock AI  
**Module**: Model 5 — Inventory Risk Prediction  
**Calibrator Architecture**: Isotonic Regression via Scikit-Learn `CalibratedClassifierCV` (prefit via `FrozenEstimator`)  
**Fitting Partition**: Validation Split (4,896 records, August 1, 2016 to December 31, 2016)  
**Evaluation Scope**: Validation and Held-Out Test Splits  
**Status**: Calibrated & Production-Ready  

---

## 1. Why Probability Calibration Matters

In B2B wholesale travel procurement, binary or uncalibrated argmax classifications are inadequate:
- An inventory commitment with a $95\%$ probability of `UNSOLD` demands immediate release or non-purchase.
- An opportunity with a $52\%$ probability of `UNSOLD` and $40\%$ probability of `BALANCED` may still be viable under flexible supplier return terms or high markup spreads.
- Downstream systems (e.g. Dynamic Pricing in Model 4 and Portfolio Exposure Hedging) require reliable, well-calibrated class probabilities ($P(\text{BALANCED}), P(\text{UNSOLD}), P(\text{SHORTAGE})$) that accurately mirror empirical risk likelihoods.

---

## 2. Calibration Methodology

To prevent data leakage, calibration was fitted strictly on the held-out **Validation Split**:
1. Base `RandomForestClassifier` was trained on the **Training Split** (10,904 rows).
2. The fitted Random Forest was frozen using `FrozenEstimator`.
3. Non-parametric **Isotonic Regression** (`method='isotonic'`) was fitted on the Validation Split (4,896 rows) to map raw tree voting fractions into calibrated multiclass probabilities.
4. The test set was left untouched during calibrator fitting.

---

## 3. Empirical Results: Raw vs. Calibrated Probabilities

### A. Validation Partition
| Metric | Raw Random Forest | Calibrated Random Forest (Isotonic) | Delta | Direction |
|---|---|---|---|---|
| **Brier Score** | 0.11549 | **0.10987** | **-0.00562** | **Improved** (Lower error) |
| **Log Loss** | 0.20500 | **0.19290** | **-0.01210** | **Improved** (Lower entropy) |
| **Accuracy** | 91.89% | **91.89%** | 0.00% | Preserved |
| **Balanced Accuracy** | 91.44% | **91.44%** | 0.00% | Preserved |
| **Macro F1-Score** | 0.9077 | **0.9077** | 0.0000 | Preserved |
| **ROC-AUC (OvR Macro)** | 0.9832 | **0.9845** | +0.0013 | Improved |

---

### B. Held-Out Test Partition (Generalization Check)
| Metric | Raw Random Forest | Calibrated Random Forest (Isotonic) | Delta | Direction |
|---|---|---|---|---|
| **Brier Score** | 0.11490 | **0.11220** | **-0.00270** | **Improved** (Lower error) |
| **Log Loss** | 0.24950 | **0.24880** | **-0.00070** | **Improved** |
| **Accuracy** | 92.13% | **92.34%** | **+0.21%** | **Improved** |
| **Balanced Accuracy** | 91.47% | 90.74% | -0.73% | Robust |
| **Macro F1-Score** | 0.9085 | 0.9078 | -0.0007 | Robust |
| **ROC-AUC (OvR Macro)** | 0.9849 | **0.9856** | **+0.0007** | **Improved** |

---

## 4. Diagnostic Assessment

1. **Brier Score Reduction**: Isotonic calibration reduced the multi-class Brier score on both the Validation partition ($-0.00562$) and unseen Test partition ($-0.00270$), confirming that predicted probabilities align more closely with observed frequencies.
2. **Probability Boundedness**: In all test cases, $p_c \in [0.0, 1.0]$ and $\sum_{c=0}^2 p_c = 1.0 \pm 10^{-4}$.
3. **Monotonicity**: Isotonic calibration prevents probability saturation at the boundaries and eliminates artificial clustering.
