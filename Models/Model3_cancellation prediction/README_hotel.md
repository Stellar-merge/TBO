# Hotel Booking Cancellation Prediction

> **Two XGBoost models** trained on 119,390 real hotel bookings to predict cancellations before they happen.

---

## 📋 Models at a Glance

| Model | File | Features | Validation Accuracy | Use Case |
|---|---|---|---|---|
| **Overall Model** | `best_overall_model.joblib` | 40 | **86.22%** | Full prediction using all booking signals |
| **Booking-Time Model** | `best_booking_time_model.joblib` | 36 | **85.02%** | Prediction at moment of booking only |

Both models are **XGBoost classifiers** trained in Google Colab on the [Hotel Booking Demand dataset](https://www.kaggle.com/datasets/jessemostipak/hotel-booking-demand) (Kaggle).

---

## 📁 Project Structure

```
Model4_Hotel_Cancellation/
├── trained_models/
│   ├── best_overall_model.joblib        # Overall XGBoost (40 features, 86.22% acc)
│   └── best_booking_time_model.joblib   # Booking-Time XGBoost (36 features, 85.02% acc)
├── src/
│   ├── predict_overall.py               # Predict with overall model
│   ├── predict_booking_time.py          # Predict with booking-time model
│   └── batch_predict.py                 # Run both models side-by-side
├── dataset/
│   └── (place hotel_bookings.csv here)
├── reports/
│   └── model_report.md                  # Technical metrics report
├── notebooks/
│   └── (place your Colab .ipynb here)
├── requirements.txt
└── README.md
```

---

## ⚡ Quick Start

### 1 — Install dependencies

```bash
pip install -r requirements.txt
```

### 2 — Run demo prediction (single booking)

```bash
# Overall model demo
python src/predict_overall.py

# Booking-time model demo
python src/predict_booking_time.py
```

### 3 — Predict on your CSV

```bash
# Overall model on full dataset
python src/predict_overall.py --csv dataset/hotel_bookings.csv --output reports/overall_preds.csv

# Booking-time model on full dataset
python src/predict_booking_time.py --csv dataset/hotel_bookings.csv --output reports/booking_time_preds.csv

# Run BOTH models and compare
python src/batch_predict.py --csv dataset/hotel_bookings.csv --output reports/both_preds.csv
```

---

## 🔧 Input Features

### Overall Model (40 features)

Includes all booking fields **plus** post-booking signals like `assigned_room_type` and `room_changed`.

| Category | Features |
|---|---|
| **Booking info** | `hotel`, `lead_time`, `deposit_type`, `customer_type` |
| **Arrival date** | `arrival_date_year`, `arrival_date_week_number`, `arrival_date_day_of_month` |
| **Stay** | `stays_in_weekend_nights`, `stays_in_week_nights` |
| **Guests** | `adults`, `children`, `babies` |
| **Property** | `meal`, `reserved_room_type`, `assigned_room_type` |
| **Channel** | `market_segment`, `distribution_channel` |
| **Guest history** | `is_repeated_guest`, `previous_cancellations`, `previous_bookings_not_canceled` |
| **Admin** | `agent`, `company`, `days_in_waiting_list`, `booking_changes` |
| **Pricing** | `adr`, `required_car_parking_spaces`, `total_of_special_requests` |
| **Engineered** | `month_num`, `total_nights`, `total_guests`, `room_changed`, `has_company`, `has_agent`, `total_cost`, `dow`, `booking_ordinal`, `day_of_year`, `adr_per_guest`, `prev_cancel_ratio` |

### Booking-Time Model (36 features)

Same as above **minus** `assigned_room_type`, `room_changed`, `booking_changes`, `days_in_waiting_list` — features unavailable at the moment of booking.

---

## 🐍 Use as a Python Library

```python
import pandas as pd
from src.predict_overall import predict as predict_overall
from src.predict_booking_time import predict as predict_booking_time

# Load your data
df = pd.read_csv("dataset/hotel_bookings.csv")

# Predict with overall model
result_overall = predict_overall(df)
print(result_overall[["cancelled_prediction", "cancel_probability"]].head())

# Predict with booking-time model
result_bt = predict_booking_time(df)
print(result_bt[["cancelled_prediction", "cancel_probability"]].head())
```

**Output columns:**
- `cancelled_prediction` → `1` = will cancel, `0` = will not cancel
- `cancel_probability` → float 0–1 (probability of cancellation)

---

## 📊 Model Details

### Dataset
- **Source**: [Hotel Booking Demand](https://www.kaggle.com/datasets/jessemostipak/hotel-booking-demand) (Kaggle)
- **Size**: 119,390 bookings
- **Hotels**: City Hotel + Resort Hotel (Portugal, 2015–2017)
- **Target**: `is_canceled` (1 = cancelled, 0 = not cancelled)
- **Class balance**: 37.0% cancellations, 63.0% not cancelled

### Training
- **Algorithm**: XGBoost Classifier
- **Training environment**: Google Colab (GPU)
- **Serialization**: `joblib` dict with keys: `model`, `feature_columns`, `model_name`, `validation_accuracy`

### Key Engineered Features
| Feature | Description |
|---|---|
| `month_num` | Integer month (1–12) from `arrival_date_month` string |
| `total_nights` | `stays_in_weekend_nights` + `stays_in_week_nights` |
| `total_guests` | `adults` + `children` + `babies` |
| `room_changed` | 1 if `assigned_room_type` ≠ `reserved_room_type` |
| `has_agent` / `has_company` | 1 if agent/company ID is not NaN |
| `total_cost` | `adr` × `total_nights` |
| `dow` | Day-of-week of arrival (0=Monday) |
| `adr_per_guest` | `adr` / `total_guests` |
| `prev_cancel_ratio` | `previous_cancellations` / total previous bookings |

---

## ⚠️ Notes

- **Models are saved as `dict`** (not sklearn Pipeline objects). The prediction scripts handle this automatically.
- **XGBoost ≥ 2.0.0** is required to load these models.
- The raw `hotel_bookings.csv` dataset is **not included** in this repo (too large). Place it in `dataset/` to run predictions.
- Do **not** include `reservation_status` or `reservation_status_date` as input features — these leak the target.

---

## 👩‍💻 Author

Tiyasha Paul · [GitHub](https://github.com/Stellar-merge)
