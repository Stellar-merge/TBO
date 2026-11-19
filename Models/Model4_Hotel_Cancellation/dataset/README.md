# dataset/

Place your hotel bookings CSV here:

```
dataset/hotel_bookings.csv
```

**Source**: [Hotel Booking Demand — Kaggle](https://www.kaggle.com/datasets/jessemostipak/hotel-booking-demand)

**Expected columns (32 total):**

| Column | Type | Description |
|---|---|---|
| `hotel` | str | Hotel type: `City Hotel` or `Resort Hotel` |
| `is_canceled` | int | Target: 1 = cancelled, 0 = not cancelled |
| `lead_time` | int | Days between booking and arrival |
| `arrival_date_year` | int | Year of arrival |
| `arrival_date_month` | str | Month name (e.g. `"August"`) |
| `arrival_date_week_number` | int | ISO week number |
| `arrival_date_day_of_month` | int | Day of month |
| `stays_in_weekend_nights` | int | Weekend nights |
| `stays_in_week_nights` | int | Weekday nights |
| `adults` | int | Number of adults |
| `children` | int | Number of children |
| `babies` | int | Number of babies |
| `meal` | str | Meal plan |
| `country` | str | Country of origin (ISO code) |
| `market_segment` | str | Market segment |
| `distribution_channel` | str | Booking channel |
| `is_repeated_guest` | int | 1 if repeat guest |
| `previous_cancellations` | int | Prior cancellations |
| `previous_bookings_not_canceled` | int | Prior kept bookings |
| `reserved_room_type` | str | Room type at booking |
| `assigned_room_type` | str | Actual assigned room |
| `booking_changes` | int | Number of changes |
| `deposit_type` | str | Deposit type |
| `agent` | float | Agent ID |
| `company` | float | Company ID |
| `days_in_waiting_list` | int | Days on waiting list |
| `customer_type` | str | Customer type |
| `adr` | float | Average daily rate |
| `required_car_parking_spaces` | int | Parking spaces |
| `total_of_special_requests` | int | Special requests |
| `reservation_status` | str | ⚠️ Leakage — do not use as feature |
| `reservation_status_date` | str | ⚠️ Leakage — do not use as feature |

> **Note**: The dataset file is not committed to git (too large). The models work without it; you only need it to run predictions on real data.
