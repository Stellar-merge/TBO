# SHAP Feature Effects: Business Sense Check

> **Data is public consumer-travel proxy data, NOT TBO B2B data.**

Generated: 2026-11-18T21:45:42.632634

## Top Drivers

### `user_prior_booking_rate`

**Interpretation**: User's historical behavior. Prior bookers are more likely to book again. ✅ Makes business sense.

### `length_of_stay_nights`

**Interpretation**: Longer stays may indicate more committed intent. ✅ Makes business sense.

### `user_prior_intents`

**Interpretation**: User's historical behavior. Prior bookers are more likely to book again. ✅ Makes business sense.

### `is_package`

**Interpretation**: Package bookings (hotel + flight) show higher commitment. ✅ Makes business sense.

### `lead_time_days`

**Interpretation**: Booking lead time (days between search and check-in). Short lead times may indicate urgent bookings (higher probability), while very long lead times may indicate exploratory browsing (lower probability). ✅ Makes business sense.

## Overall Assessment

The top features align with known booking behavior drivers: intent signals (lead time, LOS, is_package), user history (prior intents and booking rate), and destination characteristics (PCA latent features). No obviously implausible dominant features detected.

**Limitation**: Without price data, the model cannot learn price elasticity, which is a primary driver in real B2B inventory optimization.
