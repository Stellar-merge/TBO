# Model 5: Data Quality & Validation Report

## 1. Data Cleaning & Integrity Audits

- **Raw Records Inspected**: 119,390 rows from `hotels.csv`.
- **Missing Date Parsing**: 0 missing dates. All dates successfully parsed into `checkin_date`.
- **Invalid Price Removal**: Filtered 2 invalid records with negative ADR (`adr < 0`). Filtered extreme outlier records (`adr > 1000`). Cleaned row count: **119,388**.
- **Missing Values in Master Dataset**: **0 missing values** across all 42 predictive features and outcome fields.

## 2. Statistical Range & Outlier Validation

| Feature Name | Min | Median | Mean | Max | Logical Sanity Check |
|---|---|---|---|---|---|
| `procured_quantity` | 5.00 | 48.00 | 51.56 | 160.00 | Strictly Positive & Physically Realistic |
| `supplier_capacity` | 14.00 | 71.00 | 77.32 | 185.00 | Strictly Positive & Physically Realistic |
| `procurement_cost_per_room` | 23.03 | 71.97 | 76.97 | 206.07 | Strictly Positive & Physically Realistic |
| `expected_selling_price` | 29.16 | 89.88 | 96.20 | 249.01 | Strictly Positive & Physically Realistic |
| `expected_gross_margin_pct` | 0.14 | 0.20 | 0.20 | 0.26 | Strictly Positive & Physically Realistic |
| `historical_daily_demand_30d_avg` | 10.50 | 41.00 | 46.74 | 80.47 | Strictly Positive & Physically Realistic |

## 3. Categorical Consistency

- `property_id`: 2 distinct values (`HOTEL_RESORT_01`, `HOTEL_CITY_02`). 0% nulls.
- `destination_id`: 2 distinct values (`DEST_ALGARVE_PRT`, `DEST_LISBON_PRT`). 0% nulls.
- `supplier_id`: 4 distinct suppliers (`SUP_HOTELBEDS`, `SUP_WEB_BEDS`, `SUP_TBO_DIRECT`, `SUP_AGODA_WHOLESALE`).
- `contract_flexibility`: 3 levels (`FLEXIBLE`, `SEMI_FLEXIBLE`, `NON_REFUNDABLE`).
