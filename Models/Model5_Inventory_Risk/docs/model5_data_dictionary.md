# Model 5 Data Dictionary — Inventory Risk Prediction Dataset

> **Dataset Status**: Prepared & Model-Ready for Random Forest Classifier
> **Target Variable**: `risk_class` (0 = BALANCED, 1 = UNSOLD, 2 = SHORTAGE)

## 1. Identifiers & Provenance

| Column | Dtype | Description |
|---|---|---|
| `opportunity_id` | string | Unique procurement opportunity identifier |
| `decision_timestamp` | string | Timestamp when procurement decision occurred ($T_{decision}$) |
| `checkin_date` | string | Arrival date of the stay period ($YYYY-MM-DD$) |
| `property_id` | string | Hotel property code (`HOTEL_RESORT_01`, `HOTEL_CITY_02`) |
| `destination_id` | string | Destination code (`DEST_ALGARVE_PRT`, `DEST_LISBON_PRT`) |
| `destination_type` | string | Destination category (`Resort`, `City`) |
| `supplier_id` | string | Wholesaler/Bedbank identifier |
| `data_provenance` | string | Origin tag (`SYNTHETIC_SCENARIO_OVER_REAL_DEMAND`) |
| `is_synthetic` | int | 1 indicating synthetic procurement scenario over real demand |

## 2. Candidate Predictive Features (Available at Decision Time)

| Feature Name | Dtype | Category | Description |
|---|---|---|---|
| `property_id` | `str` | Context | Predictive feature for Model 5 |
| `destination_id` | `str` | Context | Predictive feature for Model 5 |
| `destination_type` | `str` | Context | Predictive feature for Model 5 |
| `supplier_id` | `str` | Inventory | Predictive feature for Model 5 |
| `historical_daily_demand_30d_avg` | `float64` | Demand | Predictive feature for Model 5 |
| `historical_daily_demand_90d_avg` | `float64` | Demand | Predictive feature for Model 5 |
| `historical_same_month_prior_year_demand` | `float64` | Demand | Predictive feature for Model 5 |
| `current_pace_on_the_books` | `int64` | Demand | Predictive feature for Model 5 |
| `pace_vs_historical_ratio` | `float64` | Demand | Predictive feature for Model 5 |
| `search_inquiry_index` | `float64` | Demand | Predictive feature for Model 5 |
| `market_segment_ta_to_pct` | `float64` | Demand | Predictive feature for Model 5 |
| `market_segment_direct_pct` | `float64` | Demand | Predictive feature for Model 5 |
| `procured_quantity` | `int64` | Inventory | Predictive feature for Model 5 |
| `supplier_capacity` | `int64` | Inventory | Predictive feature for Model 5 |
| `procurement_to_capacity_ratio` | `float64` | Inventory | Predictive feature for Model 5 |
| `supplier_reliability_score` | `float64` | Inventory | Predictive feature for Model 5 |
| `supplier_release_days` | `int64` | Inventory | Predictive feature for Model 5 |
| `contract_flexibility` | `str` | Inventory | Predictive feature for Model 5 |
| `procurement_lead_time_days` | `int64` | Inventory | Predictive feature for Model 5 |
| `stay_nights` | `int64` | Context | Predictive feature for Model 5 |
| `historical_cancellation_rate_30d` | `float64` | Cancellation | Predictive feature for Model 5 |
| `cancellation_adjusted_expected_demand` | `float64` | Demand | Predictive feature for Model 5 |
| `procurement_cost_per_room` | `float64` | Pricing | Predictive feature for Model 5 |
| `expected_selling_price` | `float64` | Pricing | Predictive feature for Model 5 |
| `expected_gross_margin_usd` | `float64` | Pricing | Predictive feature for Model 5 |
| `expected_gross_margin_pct` | `float64` | Pricing | Predictive feature for Model 5 |
| `trailing_30d_adr` | `float64` | Pricing | Predictive feature for Model 5 |
| `price_premium_vs_market` | `float64` | Pricing | Predictive feature for Model 5 |
| `checkin_year` | `int64` | Seasonality | Predictive feature for Model 5 |
| `checkin_month` | `int64` | Seasonality | Predictive feature for Model 5 |
| `checkin_day_of_week` | `int64` | Seasonality | Predictive feature for Model 5 |
| `is_weekend` | `int64` | Seasonality | Predictive feature for Model 5 |
| `is_high_season` | `int64` | Seasonality | Predictive feature for Model 5 |
| `quarter` | `int64` | Seasonality | Predictive feature for Model 5 |
| `model1_demand_forecast` | `int64` | Demand | Predictive feature for Model 5 |
| `model2_conversion_prob_est` | `float64` | Upstream Model | Predictive feature for Model 5 |
| `model3_cancellation_risk_est` | `float64` | Cancellation | Predictive feature for Model 5 |
| `model4_price_momentum_est` | `float64` | Pricing | Predictive feature for Model 5 |

## 3. Ground-Truth Target Variables

| Column | Dtype | Values | Meaning |
|---|---|---|---|
| `risk_class` | int | `0, 1, 2` | Numeric target class: 0=BALANCED, 1=UNSOLD, 2=SHORTAGE |
| `risk_label` | string | `BALANCED, UNSOLD, SHORTAGE` | Human-readable outcome label |

## 4. Ground-Truth Outcome Audit Fields (STRICTLY EXCLUDED FROM MODEL INPUTS)

| Column | Dtype | Description |
|---|---|---|
| `outcome_realized_net_demand` | `int64` | Realized outcome metric (isolated for audit only) |
| `outcome_realized_cancellations` | `int64` | Realized outcome metric (isolated for audit only) |
| `outcome_unconstrained_latent_demand` | `int64` | Realized outcome metric (isolated for audit only) |
| `outcome_actual_rooms_sold` | `int64` | Realized outcome metric (isolated for audit only) |
| `outcome_unsold_rooms` | `int64` | Realized outcome metric (isolated for audit only) |
| `outcome_shortage_rooms` | `int64` | Realized outcome metric (isolated for audit only) |
| `outcome_inventory_coverage_ratio` | `float64` | Realized outcome metric (isolated for audit only) |
| `outcome_realized_revenue_usd` | `float64` | Realized outcome metric (isolated for audit only) |
| `outcome_total_procurement_cost_usd` | `float64` | Realized outcome metric (isolated for audit only) |
| `outcome_realized_gross_profit_usd` | `float64` | Realized outcome metric (isolated for audit only) |
| `outcome_realized_utilization_pct` | `float64` | Realized outcome metric (isolated for audit only) |
