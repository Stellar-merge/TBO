# Feature Contract

> **Data is public consumer-travel proxy data, NOT TBO B2B data.**

Every feature must be known at the time of the first search event (prediction time).

## Feature Definitions

| TBO Name | Source | Dataset | Justification | Available at Search Time? |
|----------|--------|---------|--------------|---------------------------|
| lead_time_days | srch_ci - date_time | Expedia | Known when search is made | ✅ |
| length_of_stay_nights | srch_co - srch_ci | Expedia | Entered by user | ✅ |
| num_adults | srch_adults_cnt | Expedia | Entered by user | ✅ |
| num_children | srch_children_cnt | Expedia | Entered by user | ✅ |
| num_rooms | srch_rm_cnt | Expedia | Entered by user | ✅ |
| has_children | derived | Expedia | Party composition flag | ✅ |
| adults_per_room | derived | Expedia | Density metric | ✅ |
| total_guests | derived | Expedia | Party size | ✅ |
| is_mobile | is_mobile | Expedia | Device type at search time | ✅ |
| is_package | is_package | Expedia | Package flag at search time | ✅ |
| channel | channel | Expedia | Booking channel known at search | ✅ |
| site_name | site_name | Expedia | Site/portal identifier | ✅ |
| posa_continent | posa_continent | Expedia | Point-of-sale continent | ✅ |
| search_month | date_time.month | Expedia | Seasonality | ✅ |
| search_dow | date_time.dayofweek | Expedia | Day-of-week pattern | ✅ |
| search_hour | date_time.hour | Expedia | Time-of-day pattern | ✅ |
| checkin_month | srch_ci.month | Expedia | Seasonality of stay | ✅ |
| checkin_dow | srch_ci.dayofweek | Expedia | Weekend/weekday start | ✅ |
| has_saturday_night | derived | Expedia | Weekend stay flag | ✅ |
| orig_destination_distance | log1p(dist) | Expedia | Physical distance (may be missing) | ✅ |
| dist_missing | distance is null | Expedia | Distance missingness indicator | ✅ |
| destination_type | srch_destination_type_id | Expedia | Type of destination | ✅ |
| user_prior_intents | time-respecting count | Expedia | Past engagement (time-safe) | ✅ |
| user_prior_booking_rate | time-respecting rate | Expedia | Past conversion (time-safe) | ✅ |

## Frequency-Encoded High-Cardinality Features

| TBO Name | Column | Note |
|----------|--------|------|
| destination_id | srch_destination_id_freq | Freq of destination in training | 
| hotel_market | hotel_market_freq | Freq of hotel market | 
| user_country | user_location_country_freq | Freq of user country | 
| user_region | user_location_region_freq | Freq of user region | 

## Destination PCA Features

| TBO Name | Note |
|----------|------|
| dest_pca_0..N | PCA of destinations.csv latent features, fit on train only |

## Excluded Features (Leakage or Post-Event)

| Column | Reason |
|--------|--------|
| hotel_cluster | Determined by clicked/booked hotel — post-event |
| cnt | Count of events in group — only known after the fact |
| user_id | Raw ID — high cardinality, not predictive raw |
| is_booking | The label itself |

## Optional TBO-Only Features (for retraining on real data)

| Feature | Description |
|---------|-------------|
| quoted_rate_usd | Actual quoted price — not available in Expedia data |
| rate_vs_market_pct | Competitiveness vs market rate |
| rooms_available | Live availability count |
| cancellation_flexibility_flag | Whether booking is flexible |
| b2b_agent_id | B2B travel agent identifier |
| agency_prior_booking_rate | Agency's historical conversion rate |

## Note on Price

Expedia Hotel Recommendations dataset has NO price or availability columns. The model cannot learn price effects. This is a known limitation. When retrained on TBO data, price features should be added first.
