# Flight Cancellation Prediction – XGBoost Model Report

- **Validation Accuracy**: **97.54%**
- **ROC-AUC Score**: **87.58%**
- **Total Features Used**: 34
- **Training Samples**: 200,203
- **Validation Samples**: 50,051
- **Training Time**: 6.5s
- **Model Artifact**: `flight_xgboost_model.joblib`

## Classification Report

```
              precision    recall  f1-score   support

           0       0.98      1.00      0.99     48723
           1       0.65      0.15      0.25      1328

    accuracy                           0.98     50051
   macro avg       0.82      0.57      0.62     50051
weighted avg       0.97      0.98      0.97     50051
```

## Confusion Matrix

- True Negatives (Correct Non-Cancelled): 48,616
- True Positives (Correct Cancelled): 202
- False Positives: 107
- False Negatives: 1,126

## Top 15 Feature Importances

| Feature | Importance |
|---------|------------|
| route_cancel_rate | 0.1642 |
| year | 0.1077 |
| month | 0.0977 |
| day_of_month | 0.0416 |
| DOT_CODE | 0.0345 |
| airline_cancel_rate | 0.0298 |
| AIRLINE | 0.0264 |
| AIRLINE_CODE | 0.0253 |
| origin_cancel_rate | 0.0249 |
| day_of_week | 0.0242 |
| airline_frequency | 0.0239 |
| arr_hour | 0.0236 |
| dest_cancel_rate | 0.0221 |
| CRS_ARR_TIME | 0.0218 |
| is_weekend | 0.0217 |
