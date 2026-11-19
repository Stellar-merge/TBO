# Model 5: Feature Leakage & Temporal Safety Audit

## 1. The Core Principle: Decision Timestamp ($T_{decision}$)

In inventory procurement, the model must execute predictions **before** rooms are purchased. Every single predictive feature in Model 5 is computed strictly using information known at or before `decision_timestamp`.

$$\text{decision\_timestamp} = \text{checkin\_date} - \text{procurement\_lead\_time\_days}$$

## 2. Feature-by-Feature Temporal Verification

| Feature Name | Data Source | Timestamp Bound | Leakage Assessment |
|---|---|---|---|
| `historical_daily_demand_30d_avg` | Cleaned PMS Reservations | Computed on $[T_{decision} - 30d, T_{decision}]$ | ✅ 100% Leak-Free (Prior Data Only) |
| `historical_daily_demand_90d_avg` | Cleaned PMS Reservations | Computed on $[T_{decision} - 90d, T_{decision}]$ | ✅ 100% Leak-Free (Prior Data Only) |
| `historical_same_month_prior_year_demand` | Cleaned PMS Reservations | Computed on Year $t-1$ | ✅ 100% Leak-Free (Prior Year Only) |
| `current_pace_on_the_books` | Raw Reservations Pace | Bookings created $\le T_{decision}$ | ✅ 100% Leak-Free (No future bookings included) |
| `historical_cancellation_rate_30d` | Cleaned PMS Reservations | Observed on $[T_{decision} - 30d, T_{decision}]$ | ✅ 100% Leak-Free |
| `procured_quantity` | Inventory Optimization Proposal | Decision-time input parameter | ✅ 100% Leak-Free |
| `supplier_capacity` | Supplier Contract Sheet | Known at contract negotiation | ✅ 100% Leak-Free |
| `procurement_cost_per_room` | Supplier Rate Quote | Quoted at decision time | ✅ 100% Leak-Free |
| `expected_selling_price` | Dynamic Pricing Engine (Model 4) | Estimated at decision time | ✅ 100% Leak-Free |
| `checkin_month`, `is_weekend`, `is_high_season` | Calendar Math | Derived from checkin date | ✅ 100% Leak-Free |

## 3. Isolation of Ground-Truth Outcome Audit Fields

To guarantee that post-stay outcomes never enter the Random Forest feature matrix, all outcome fields are given an explicit `outcome_` prefix:

- `outcome_realized_net_demand`
- `outcome_realized_cancellations`
- `outcome_unconstrained_latent_demand`
- `outcome_actual_rooms_sold`
- `outcome_unsold_rooms`
- `outcome_shortage_rooms`
- `outcome_realized_revenue_usd`
- `outcome_total_procurement_cost_usd`
- `outcome_realized_gross_profit_usd`
- `outcome_realized_utilization_pct`

> **Strict Enforcement Rule**: During Model 5 training and evaluation, `feature_cols = [c for c in df.columns if not c.startswith('outcome_') and c not in id_cols]`. Outcome columns are used strictly for post-prediction financial auditing.
