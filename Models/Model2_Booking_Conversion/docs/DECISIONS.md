# Design Decisions Log

> **Data is public consumer-travel proxy data, NOT TBO B2B data.**


## Phase 2: Unit of Analysis

**Date**: 2026-11-18T18:14:04.601806

**Decision**: Unit of analysis = `search_intent_group`

**Label**: `max(is_booking) per search intent group`

**Group columns**: `['user_id', 'srch_destination_id', 'srch_ci', 'srch_co', 'srch_rm_cnt', 'srch_adults_cnt', 'srch_children_cnt']`

**Stats**:
- Groups: 2,275,943
- Booking groups: 441,967
- Base rate: 0.1942
- Single-row group %: 49.2%

**Rationale**: Search-intent grouping is preferred because it matches the B2B prediction task (a search/availability request → booking probability). Event-level labels double-count repeated clicks on the same intent.

## Phase 2: Unit of Analysis

**Date**: 2026-11-18T21:24:13.920649

**Decision**: Unit of analysis = `search_intent_group`

**Label**: `max(is_booking) per search intent group`

**Group columns**: `['user_id', 'srch_destination_id', 'srch_ci', 'srch_co', 'srch_rm_cnt', 'srch_adults_cnt', 'srch_children_cnt']`

**Stats**:
- Groups: 2,275,943
- Booking groups: 441,967
- Base rate: 0.1942
- Single-row group %: 49.2%

**Rationale**: Search-intent grouping is preferred because it matches the B2B prediction task (a search/availability request → booking probability). Event-level labels double-count repeated clicks on the same intent.


## Phase 11: Frontend Integration & Inference Pipeline Finalisation

**Date**: 2026-11-18T22:30:00

**Decision 1**: Precomputed Lookup Tables for Inference
- Precomputed `dest_pca_lookup.parquet` (62,106 destinations x 12 PCA components, 4.5 MB) and `user_history_lookup.parquet` (138,019 users from training split, 1.1 MB).
- **Rationale**: Eliminates dependencies on 500 MB raw `destinations.csv` and multi-GB training Parquet files at inference time, achieving sub-5ms lookup latency.

**Decision 2**: Resilient Dual-Mode Input Transformation
- Added `transform_raw_searches_to_features()` in `predict.py` and updated `Model2Predictor._validate_and_transform()`.
- **Rationale**: Automatically detects whether input is raw frontend searches or pre-engineered feature DataFrames. Maps user-friendly aliases (`destination_id`, `checkin_date`, `checkout_date`, `num_adults`, `num_rooms`), safely handles missing optional fields, and handles cold-start users (0 prior intents, 0.0 rate), while maintaining 100% backward compatibility with existing tests.

**Decision 3**: Native XGBoost Tree SHAP for Explainability
- Switched explanation driver in `explain_prediction()` to native XGBoost `predict(dmat, pred_contribs=True)`.
- **Rationale**: Yields identical Tree SHAP attribution values in <1ms without C-extension interpreter teardown issues on Windows Python 3.14.

**Decision 4**: Direct Probability Summation for Downstream Inventory Optimization
- Endpoint `/api/model2/expected-bookings` explicitly calculates `sum(calibrated_probabilities)` per group.
- **Rationale**: Threshold-based binary predictions throw away variance and misstate low-probability high-volume demand; summing calibrated probabilities matches the mathematical definition of expected value: $\mathbb{E}[B] = \sum p_i$.

**Decision 5**: Permissive CORS for Hackathon Frontend
- Added `CORSMiddleware` with `allow_origins=["*"]`.
- **Rationale**: Enables seamless cross-origin fetch requests from any local frontend dev server (Vite, React, Next.js on ports 3000, 5173, etc.).
