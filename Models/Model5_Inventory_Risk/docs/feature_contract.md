# Feature Contract & Leakage Safeguards — Model 5

**System**: TBO SmartStock AI  
**Module**: Model 5 — Inventory Risk Prediction  
**Contract Version**: `1.0.0`  
**Enforcement Mechanism**: `src/model5/features.py::validate_features_dataframe` & `src/model5/preprocessing.py`  

---

## 1. Feature Whitelist (Allowed Input Features)

All features must reflect operational reality strictly at or before $T_{decision} = \text{checkin\_date} - \text{procurement\_lead\_time\_days}$.

### A. Categorical Features (5 Columns)

| Feature Name | Dtype | Allowed / Seen Values | Default Fallback | Business Definition |
|---|---|---|---|---|
| `property_id` | string | `HOTEL_CITY_02`, `HOTEL_RESORT_01` | `"UNKNOWN"` | Unique property identifier |
| `destination_id` | string | `DEST_LISBON_PRT`, `DEST_ALGARVE_PRT` | `"UNKNOWN"` | Destination market code |
| `destination_type` | string | `City`, `Resort` | `"City"` | Property market type |
| `supplier_id` | string | `SUP_AGODA_WHOLESALE`, `SUP_TBO_DIRECT`, `SUP_WEB_BEDS`, `SUP_HOTELBEDS` | `"UNKNOWN"` | Wholesaler or Bedbank code |
| `contract_flexibility` | string | `NON_REFUNDABLE`, `FLEXIBLE`, `SEMI_FLEXIBLE` | `"SEMI_FLEXIBLE"` | Inventory return terms |

---

### B. Numerical Predictive Features (33 Columns)

#### 1. Demand & Pace Signals
| Feature Name | Dtype | Unit / Range | Training Median | Business Description |
|---|---|---|---|---|
| `historical_daily_demand_30d_avg` | float | $\ge 0$ rooms | 51.27 | Average realized daily net bookings over preceding 30 days |
| `historical_daily_demand_90d_avg` | float | $\ge 0$ rooms | 49.82 | Average realized daily net bookings over preceding 90 days |
| `historical_same_month_prior_year_demand` | float | $\ge 0$ rooms | 52.41 | Historical demand for the same calendar month in prior year |
| `current_pace_on_the_books` | int | $\ge 0$ rooms | 14.0 | Confirmed bookings already on books at decision timestamp |
| `pace_vs_historical_ratio` | float | $\ge 0$ | 0.82 | Current booking pace divided by expected pace at lead time |
| `search_inquiry_index` | float | $\ge 0$ | 275.5 | Estimated search volume index ($D_{base} / \text{conversion}$) |
| `market_segment_ta_to_pct` | float | $[0.0, 1.0]$ | 0.58 | Travel Agent / Tour Operator share of historical bookings |
| `market_segment_direct_pct` | float | $[0.0, 1.0]$ | 0.12 | Direct customer share of historical bookings |

#### 2. Inventory & Supplier Constraints
| Feature Name | Dtype | Unit / Range | Training Median | Business Description |
|---|---|---|---|---|
| `procured_quantity` | float | $\ge 1$ rooms | 55.0 | Committed room count pre-purchased or allotted |
| `supplier_capacity` | float | $\ge 1$ rooms | 98.0 | Maximum allotment ceiling from supplier |
| `procurement_to_capacity_ratio` | float | $[0.0, 1.0]$ | 0.56 | Procured rooms as fraction of supplier allotment ceiling |
| `supplier_reliability_score` | float | $[0.0, 1.0]$ | 0.94 | Historical contract fulfillment reliability score |
| `supplier_release_days` | float | $\ge 0$ days | 14.0 | Free return cutoff deadline before checkin date |
| `procurement_lead_time_days` | float | $[14, 90]$ days | 45.0 | Advance days between decision timestamp and arrival |
| `stay_nights` | float | $\ge 1$ nights | 2.0 | Average length of stay per reservation |

#### 3. Cancellation Signals
| Feature Name | Dtype | Unit / Range | Training Median | Business Description |
|---|---|---|---|---|
| `historical_cancellation_rate_30d` | float | $[0.0, 1.0]$ | 0.36 | Cancellation share over preceding 30 days |
| `cancellation_adjusted_expected_demand` | float | $\ge 0$ rooms | 32.5 | Expected demand discount-adjusted for cancellation rate |

#### 4. Pricing & Margins
| Feature Name | Dtype | Unit / Range | Training Median | Business Description |
|---|---|---|---|---|
| `procurement_cost_per_room` | float | $\ge 0$ USD | 78.40 | Negotiated wholesale procurement cost per night |
| `expected_selling_price` | float | $\ge 0$ USD | 98.20 | Target retail Average Daily Rate (ADR) |
| `expected_gross_margin_usd` | float | USD | 19.80 | Target spread per room ($P_{sell} - C_{proc}$) |
| `expected_gross_margin_pct` | float | $[0.0, 1.0]$ | 0.20 | Gross profit margin percentage |
| `trailing_30d_adr` | float | $\ge 0$ USD | 95.40 | Trailing 30-day realized property ADR |
| `price_premium_vs_market` | float | $\ge 0$ | 1.03 | Ratio of expected retail price vs trailing market ADR |

#### 5. Calendar & Seasonality
| Feature Name | Dtype | Range | Training Median | Business Description |
|---|---|---|---|---|
| `checkin_year` | int | $[2015, 2030]$ | 2016 | Arrival year |
| `checkin_month` | int | $[1, 12]$ | 6 | Arrival month (1 to 12) |
| `checkin_day_of_week` | int | $[0, 6]$ | 3 | Arrival day of week (0=Mon, 6=Sun) |
| `is_weekend` | int | $\{0, 1\}$ | 0 | 1 if arrival is Friday, Saturday, or Sunday |
| `is_high_season` | int | $\{0, 1\}$ | 0 | 1 if arrival is June, July, August, or December |
| `quarter` | int | $[1, 4]$ | 2 | Arrival calendar quarter (1 to 4) |

#### 6. Upstream Model Proxies (Optional)
| Feature Name | Dtype | Training Median | Upstream Model | Fallback Policy if Upstream Offline |
|---|---|---|---|---|
| `model1_demand_forecast` | float | 52.0 | Model 1 (Demand Forecast) | Falls back to `0.6 * h_same + 0.4 * h30` |
| `model2_conversion_prob_est` | float | 0.188 | Model 2 (Conversion) | Falls back to global conversion base rate `0.188` |
| `model3_cancellation_risk_est`| float | 0.362 | Model 3 (Cancellation) | Falls back to `historical_cancellation_rate_30d` |
| `model4_price_momentum_est` | float | 1.025 | Model 4 (Dynamic Pricing) | Falls back to `price_premium_vs_market` |

---

## 2. Forbidden Columns Blacklist (Zero-Lookahead Guarantee)

The following 18 columns must **NEVER** enter the feature matrix $X$:

```python
FORBIDDEN_COLUMNS = {
    # Targets
    "risk_class",
    "risk_label",

    # Identifiers & Provenance
    "opportunity_id",
    "decision_timestamp",
    "checkin_date",
    "data_provenance",
    "is_synthetic",

    # Realized Post-Decision Outcomes (STRICT AUDIT FIELDS ONLY)
    "outcome_realized_net_demand",
    "outcome_realized_cancellations",
    "outcome_unconstrained_latent_demand",
    "outcome_actual_rooms_sold",
    "outcome_unsold_rooms",
    "outcome_shortage_rooms",
    "outcome_inventory_coverage_ratio",
    "outcome_realized_revenue_usd",
    "outcome_total_procurement_cost_usd",
    "outcome_realized_gross_profit_usd",
    "outcome_realized_utilization_pct"
}
```

If any DataFrame passed to `Model5Preprocessor` or `validate_features_dataframe` contains any of these columns, a `ValueError` is immediately raised, terminating execution.
