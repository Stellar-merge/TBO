# Model 5: Target Label Construction Report

## 1. Target Definition & Business Logic

Model 5 predicts a three-class inventory risk outcome: `risk_class` $\in \{0, 1, 2\}$ and `risk_label`:

- **`0 = BALANCED`**: Procured inventory is reasonably aligned with realized net demand. High inventory utilization ($85\% - 100\%$) with negligible stockouts.
- **`1 = UNSOLD`**: Procured inventory substantially exceeds sellable demand. Unsold rooms expire unbooked, generating inventory holding exposure and financial waste.
- **`2 = SHORTAGE`**: Procured inventory is substantially below true demand. Stockouts occur, resulting in unmet demand and lost wholesale profit.

## 2. Mathematical Tolerance Formulation

Let $Q$ be the procured room inventory and $D$ be the realized net demand for that check-in date. A 15% tolerance window (with a minimum of 3 rooms for low-volume boutique dates) is defined:

$$T = \max(3, \text{round}(0.15 \times D))$$

The mutually exclusive boundary rules are:

$$\text{risk\_class} = \begin{cases} 0 \text{ (BALANCED)}, & \text{if } |Q - D| \le T \\ 1 \text{ (UNSOLD)}, & \text{if } Q > D + T \\ 2 \text{ (SHORTAGE)}, & \text{if } Q < D - T \end{cases}$$

### Mathematical Proof of Mutual Exclusivity
The three conditions partition the real number line into three non-overlapping, exhaustive intervals: $(-\infty, D - T)$, $[D - T, D + T]$, and $(D + T, \infty)$. Every opportunity falls into exactly one category.

## 3. Class Distribution in Final Master Dataset

| Target Class | Numeric Value | Record Count | Percentage | Class Balance Assessment |
|---|---|---|---|---|
| **UNSOLD** | `1` | 10,847 | 46.01% | Healthy representation of over-procurement exposure |
| **SHORTAGE** | `2` | 8,311 | 35.25% | Healthy representation of under-procurement stockouts |
| **BALANCED** | `0` | 4,418 | 18.74% | Balanced inventory alignment target |
| **Total** | — | **23,576** | **100.00%** | Zero severe class imbalance |
