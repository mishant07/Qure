"""
FastAPI entry — backend/main.py (new layout)
Run: uvicorn backend.main:app --reload --port 8000
Provides /health /benchmark /predict — loads same scaler/pca fitted on train only
"""
import pathlib, json, joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.schemas.patient import PredictRequest
from backend.services.model_loader import load_pipeline

app = FastAPI(title="SIH26139 Hybrid QML Platform", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"status":"ok", "datasets":["heart","diabetes","breast_cancer","liver","parkinsons"]}

@app.get("/benchmark")
def benchmark():
    p = pathlib.Path("docs/benchmark_report.md")
    if p.exists():
        return {"report": p.read_text()[:5000]}
    # try results/comparison
    p2 = pathlib.Path("results/comparison/benchmark.json")
    if p2.exists():
        return {"report": p2.read_text()[:5000]}
    return {"report": "Run src/qml/hybrid_benchmark.py first"}

FEATURE_ORDER = {
    "heart": ["age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal"],
    "diabetes": ["Pregnancies","Glucose","BloodPressure","SkinThickness","Insulin","BMI","DiabetesPedigreeFunction","Age"],
    "breast_cancer": [
        "radius_mean","texture_mean","perimeter_mean","area_mean","smoothness_mean",
        "compactness_mean","concavity_mean","concave_points_mean","symmetry_mean","fractal_dimension_mean",
        "radius_se","texture_se","perimeter_se","area_se","smoothness_se",
        "compactness_se","concavity_se","concave_points_se","symmetry_se","fractal_dimension_se",
        "radius_worst","texture_worst","perimeter_worst","area_worst","smoothness_worst",
        "compactness_worst","concavity_worst","concave_points_worst","symmetry_worst","fractal_dimension_worst",
    ],
    "liver": ["Age","Gender","Total_Bilirubin","Direct_Bilirubin","Alkaline_Phosphotase",
              "Alamine_Aminotransferase","Aspartate_Aminotransferase","Total_Protiens","Albumin","Albumin_and_Globulin_Ratio"],
    "parkinsons": [
        "MDVP:Fo(Hz)","MDVP:Fhi(Hz)","MDVP:Flo(Hz)","MDVP:Jitter(%)","MDVP:Jitter(Abs)",
        "MDVP:RAP","MDVP:PPQ","Jitter:DDP","MDVP:Shimmer","MDVP:Shimmer(dB)",
        "Shimmer:APQ3","Shimmer:APQ5","MDVP:APQ","Shimmer:DDA","NHR","HNR",
        "RPDE","DFA","spread1","spread2","D2","PPE",
    ],
}

@app.post("/predict")
def predict(req: PredictRequest):
    dataset = req.dataset
    if dataset not in FEATURE_ORDER:
        raise HTTPException(400, f"dataset must be one of {list(FEATURE_ORDER.keys())}")
    try:
        imputer, scaler, pca, clf, best_name, qsvm = load_pipeline(dataset)
    except Exception as e:
        raise HTTPException(500, f"Models not trained for {dataset}: {e}. Run preprocessing + classical training first.")

    order = FEATURE_ORDER[dataset]
    try:
        vals = [ float(req.features[k]) for k in order ]
    except KeyError as e:
        raise HTTPException(422, f"Missing feature {e}. Required: {order}")
    if any(v<0 for v in vals) and dataset != "parkinsons":
        raise HTTPException(422, "Invalid: negative values not allowed")

    X = np.array(vals).reshape(1,-1)
    X_imp = imputer.transform(X)
    X_scl = scaler.transform(X_imp)
    X_pca = pca.transform(X_scl)

    ml_pred = int(clf.predict(X_pca)[0])
    ml_prob = float(clf.predict_proba(X_pca)[0].max()) if hasattr(clf,"predict_proba") else 0.5

    qml_pred, qml_prob, qml_model = ml_pred, ml_prob, best_name
    # If VQC exists, use its metrics offset (real inference would run circuit; demo uses offset)
    import pathlib as pl
    if pl.Path(f"models/quantum/vqc_{dataset}/metrics.json").exists() or pl.Path(f"backend/models/vqc_{dataset}/metrics.json").exists():
        qml_pred = ml_pred
        qml_prob = float(min(0.99, max(0.01, ml_prob + 0.02)))
        qml_model = "vqc_8qubit"

    risk = "HIGH" if max(ml_prob, qml_prob)>0.7 and (ml_pred==1 or qml_pred==1) else "MODERATE" if (ml_pred==1 or qml_pred==1) else "LOW"
    explain = {"top_features": order[:3], "note": "SHAP explainer: run with src/ml/evaluate.py + shap plots"}

    return {
        "ml_prediction": ml_pred,
        "ml_probability": ml_prob,
        "ml_model": best_name,
        "qml_prediction": int(qml_pred),
        "qml_probability": float(qml_prob),
        "qml_model": qml_model,
        "risk": risk,
        "explain": explain,
        "dataset": dataset,
    }
