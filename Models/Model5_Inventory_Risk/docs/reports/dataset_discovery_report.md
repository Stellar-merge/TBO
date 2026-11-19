# Model 5: Dataset Discovery & Audit Report

> **System**: TBO SmartStock AI — Inventory Procurement Risk
> **Module**: Model 5 — Inventory Risk Prediction (Random Forest Classifier)
> **Generated**: November 2026

## 1. Executive Summary

In accordance with Phase A and B requirements, an exhaustive audit was performed across all project directories (`Datasets_Model5`, `Datasets_Model2`, and root workspaces). We identified existing travel data files, examined their domain semantics, evaluated missing attributes, and established a defensible, leakage-safe data integration strategy.

## 2. Discovered Datasets Audit Table

| Dataset | File Name & Location | File Size | Rows & Cols | Date Coverage | Domain Content | Limitations & Suitability |
|---|---|---|---|---|---|---|
| **Hotel Booking Demand (hotels.csv)** | `D:\Competition\Voyage_Hack\Datasets\Datasets_Model5\raw\historical_bookings\hotels.csv` | 16.07 MB | 119,390 rows, 32 cols | 2015-07-01 to 2017-08-31 | Bookings: True, Cancels: True, Searches: False | Only covers 2 hotel properties in Portugal (Algarve Resort, Lisbon City Hotel). Does not contain wholesale procurement quantities, supplier contracts, or stockout records. |
| **Expedia Latent Destination Features (destinations.csv)** | `D:\Competition\Voyage_Hack\Datasets\Datasets_Model2\expedia-hotel-recommendations\destinations.csv` | 131.76 MB | 62,106 rows, 150 cols | N/A (static lookup) to N/A (static lookup) | Bookings: False, Cancels: False, Searches: False | Abstract numerical PCA-like vectors; no plain-text city names or supplier identifiers. |
| **Expedia Search & Booking Events (train.csv)** | `D:\Competition\Voyage_Hack\Datasets\Datasets_Model2\expedia-hotel-recommendations\train.csv` | 3881.88 MB | 37,670,293 rows, 24 cols | 2013-01-01 to 2014-12-31 | Bookings: True, Cancels: False, Searches: True | Consumer clickstream data (Expedia), not TBO B2B wholesaler data. Contains zero information about room procurement allotments, supplier capacity limits, or stockouts. |

## 3. Deep-Dive on Available Data Sources

### A. Hotel Booking Demand (`hotels.csv`)
- **Publisher & Reference**: Nuno Antonio, Ana de Almeida, Luis Nunes (2019), *Hotel booking demand datasets*, Data in Brief, Elsevier.
- **Properties Covered**: Two real Portuguese hotel properties — `H1` (Resort hotel in Algarve, 40,060 bookings) and `H2` (City hotel in Lisbon, 79,330 bookings).
- **Date Range**: July 1, 2015 to August 31, 2017 (26 months, 792 consecutive calendar days).
- **Valuable Signals**: Actual customer booking pace, cancellations, ADR (Average Daily Rate), lead times, distribution channels, customer types, waiting list queues.
- **Missing Elements**: Does NOT contain wholesale B2B room procurement allotments, supplier capacities, or stockout counts.

### B. Expedia Hotel Recommendations (`train.csv` & `destinations.csv`)
- **Publisher**: Expedia / Kaggle (2016).
- **Coverage**: 37,670,293 consumer search/click events across 62,106 destination IDs (2013–2014).
- **Valuable Signals**: Destination-level search volumes, seasonal travel search velocities, and 149 latent text-mined destination semantic features (`destinations.csv`).
- **Semantic Separation**: Expedia covers consumer clickstream searches from 2013-2014, whereas Hotel Booking Demand covers confirmed hotel reservations from 2015-2017. As required by Section 3 & 5, these were **NOT blindly concatenated**, as joining mismatched calendar years would cause temporal invalidity.

## 4. Phase B: Analysis of Missing Wholesale Procurement Data

Public travel datasets reflect either consumer front-end search logs or hotel PMS reservation logs. None contain B2B wholesale procurement contracts:
1. **Procured Room Quantities**: Wholesale inventory pre-purchased by the bedbank.
2. **Supplier Capacity Allotments**: Bedbank / direct-contract maximum capacity.
3. **Stockout & Unmet Demand Counts**: Demand lost because hotel inventory was capped.
4. **Wholesale Procurement Margins**: Spread between wholesale negotiated cost and retail ADR.
5. **Supplier Release Terms**: Free cancellation / return cutoff deadlines (e.g. 7, 14, 21 days before checkin).

## 5. Phase C: Real vs. Synthetic Decision

**Decision**: In strict accordance with Phase C guidelines, we built a **Hybrid Synthetic-Over-Real Architecture**.
- The **demand stream, cancellation velocity, ADR, and booking pace** are grounded in **real empirical observations** from `hotels.csv` (1,586 property-day timeline observations).
- The **procurement decisions, supplier constraints, pricing spreads, and release terms** are modeled as realistic simulated procurement scenarios around those empirical demands.
- Every record carries a provenance flag (`data_provenance = 'SYNTHETIC_SCENARIO_OVER_REAL_DEMAND'`), preserving complete transparency.
