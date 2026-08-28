# API — backend/main.py

Base: `http://localhost:8000` (Render in prod via VITE_API_URL)

## GET /health
→ `{status:"ok", datasets:["heart","diabetes"]}`

## GET /benchmark
→ `{report: "..."}` — from docs/benchmark_report.md or results/comparison/benchmark.json

## POST /predict
```json
{
  "dataset": "heart",
  "features": {
    "age": 52, "sex": 1, "cp": 0, "trestbps": 120, "chol": 168, "fbs": 0,
    "restecg": 1, "thalach": 150, "exang": 0, "oldpeak": 1.0, "slope": 1, "ca": 0, "thal": 2
  }
}
```
Response:
```json
{
  "ml_prediction": 1, "ml_probability": 0.81, "ml_model": "svm",
  "qml_prediction": 1, "qml_probability": 0.78, "qml_model": "vqc_8qubit",
  "risk": "HIGH", "explain": {"top_features": ["age","chol","oldpeak"]}, "dataset":"heart"
}
```

Errors: 422 missing feature / negative value, 500 model not trained (run preprocessing + training).

Frontend consumes via `frontend/src/services/api.js`.
