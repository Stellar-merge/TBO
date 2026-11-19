# Model 5: Chronological Dataset Split Report

## 1. Splitting Strategy

In accordance with Section 11, chronological splitting was applied to reflect real-world procurement operations. Random K-Fold splitting was strictly rejected because shuffling future dates into training causes massive temporal leakage.

## 2. Split Partition Summary

| Split | Date Window | Total Records | Share (%) | UNSOLD % | SHORTAGE % | BALANCED % |
|---|---|---|---|---|---|---|
| **Train** | 2015-07-31 to 2016-07-31 | 10,904 | 46.3% | 44.7% | 38.0% | 17.3% |
| **Validation** | 2016-08-01 to 2016-12-31 | 4,896 | 20.8% | 45.5% | 34.3% | 20.1% |
| **Test** | 2017-01-01 to 2017-08-31 | 7,776 | 33.0% | 48.2% | 32.0% | 19.8% |

## 3. Leakage Guard Across Splits

- **Zero Opportunity Overlap**: Every `opportunity_id` exists in exactly one split.
- **Chronological Non-Overlap**: $\max(\text{Train}) < \min(\text{Validation}) < \max(\text{Validation}) < \min(\text{Test})$.
- **Scenario Clustering**: All 4 scenarios derived from the same stay date reside inside the exact same split, preventing cross-split scenario leakage.
