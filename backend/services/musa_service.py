"""Musa2609/SIH- module service — backend/services/musa_service.py

Runs the three Musa modules with THEIR staged artifacts (backend/models/musa/):
  HEART    : raw 13 features -> imputer -> scaler -> HistGradientBoosting
             QML: scaler -> PCA(4) -> 4-qubit VQC (.pt)
  HCV      : Sex m/f -> encoder dict -> imputer -> scaler -> XGBoost
             QML: scaler -> PCA(4) -> 4-qubit VQC (.pt)
  DIABETES : 11 z-scored features -> scaler -> Random Forest (3-class)
             QML: scaler -> PCA(4) -> 4-qubit VQC (.pt), 3 classes

Preprocessing order mirrors the team's own inference scripts exactly.
"""
import json
import pathlib

import joblib
import numpy as np
import pandas as pd

from backend.services import datasets as DS
from backend.services.musa_vqc import MusaVQCRuntime

ROOT = pathlib.Path(__file__).resolve().parents[2]
MUSA_DIR = ROOT / "backend" / "models" / "musa"

HCV_FEATURES = ["Age", "Sex", "ALB", "ALP", "ALT", "AST", "BIL", "CHE", "CHOL", "CREA", "GGT", "PROT"]

_MODULES = {
    "musa_heart": dict(
        dir="HEART", imputer="heart_imputer.joblib", scaler="heart_scaler.joblib",
        pca="heart_pca_4.joblib", ml="best_heart_ml_model.joblib",
        qml="heart_qml_model_weights.pt", metrics="heart_metrics.json",
    ),
    "musa_hcv": dict(
        dir="HCV", imputer="hcv_imputer.joblib", scaler="hcv_scaler.joblib",
        pca="hcv_pca_4.joblib", ml="best_hcv_ml_model.joblib",
        qml="hcv_qml_model_weights.pt", metrics="hcv_metrics.json",
    ),
    "musa_diabetes": dict(
        dir="DIABETES", imputer=None, scaler="scaler.joblib",
        pca="pca_4.joblib", ml="best_ml_model.joblib",
        qml="qml_model_weights.pt", metrics="metrics.json",
    ),
}

_cache: dict = {}


def _load(key: str) -> dict:
    if key in _cache:
        return _cache[key]
    cfg = _MODULES[key]
    base = MUSA_DIR / cfg["dir"]

    imputer = joblib.load(base / cfg["imputer"]) if cfg["imputer"] else None
    scaler = joblib.load(base / cfg["scaler"])
    pca = joblib.load(base / cfg["pca"])
    ml = joblib.load(base / cfg["ml"])
    vqc = MusaVQCRuntime(base / cfg["qml"])

    mpath = base / cfg["metrics"]
    metrics = json.loads(mpath.read_text()) if mpath.exists() else {}
    ml_name = metrics.get("best_classical_ml") or cfg["ml"].replace(".joblib", "")

    sex_encoder = None
    if key == "musa_hcv":
        sex_encoder = joblib.load(base / "hcv_sex_encoder.joblib")

    _cache[key] = dict(cfg=cfg, imputer=imputer, scaler=scaler, pca=pca,
                       ml=ml, vqc=vqc, ml_name=ml_name, sex_encoder=sex_encoder)
    return _cache[key]


def _prepare_frame(key: str, features: dict) -> pd.DataFrame:
    """Validate + coerce the raw request payload into a 1-row feature frame."""
    order = DS.feature_order(key)
    missing = [k for k in order if k not in features]
    if missing:
        raise ValueError(f"missing features: {missing}")
    if key == "musa_heart":
        for k, (lo, hi) in DS.MUSA_HEART_RANGES.items():
            v = float(features[k])
            if not (lo <= v <= hi):
                raise ValueError(f"'{k}'={v} outside audited range [{lo}, {hi}]")

    row = {}
    for k in order:
        v = features[k]
        row[k] = v  # keep native; Sex may be 'm'/'f'
    df = pd.DataFrame([row], columns=order)

    if key == "musa_hcv":  # encode Sex exactly like predict_hcv.py
        enc = _cache[key]["sex_encoder"] if key in _cache else None
        sex = df["Sex"].iloc[0]
        if isinstance(sex, str):
            enc = enc or joblib.load(MUSA_DIR / "HCV" / "hcv_sex_encoder.joblib")
            mapped = enc.get(str(sex).lower(), enc.get(sex))
            if mapped is None:
                raise ValueError("'Sex' must be 'm' or 'f'")
            df["Sex"] = float(mapped)
        else:
            df["Sex"] = float(sex)
    else:
        df = df.astype(float)
    return df


def _risk_string(pred: int, conf: float) -> str:
    # binary: 1 = disease; musa_diabetes 3-class: 1 (Pre) / 2 (Diabetic) = disease
    disease = int(pred) != 0
    if disease and conf > 0.7:
        return "HIGH"
    return "MODERATE" if disease else "LOW"


def _top_features(pca, order: list, n: int = 3) -> list:
    comps = np.abs(pca.components_[:3]).sum(axis=0)
    idx = np.argsort(comps)[::-1][:n]
    names = getattr(pca, "feature_names_in_", None)
    names = [str(x) for x in names] if names is not None else list(order)
    return [names[i] if i < len(names) else str(i) for i in idx]


def predict_musa(dataset_key: str, features: dict) -> dict:
    """Full ML+QML inference for one Musa-module patient record."""
    art = _load(dataset_key)
    cfg, order = art["cfg"], DS.feature_order(dataset_key)
    df = _prepare_frame(dataset_key, features)

    X_imp = art["imputer"].transform(df[order]) if art["imputer"] else df[order].to_numpy(dtype=float)
    X_scaled = art["scaler"].transform(X_imp)

    # ---- classical ML track (best joblib model, raw decision surface)
    ml = art["ml"]
    ml_pred = int(ml.predict(X_scaled)[0])
    ml_prob = float(np.max(ml.predict_proba(X_scaled)[0])) if hasattr(ml, "predict_proba") else 0.5

    # ---- quantum track (their PCA(4) -> 4-qubit VQC, real .pt weights)
    X_pca = art["pca"].transform(X_scaled)
    probs = art["vqc"].predict_proba(X_pca)[0]
    qml_pred = int(np.argmax(probs))
    qml_prob = float(np.max(probs))

    return {
        "dataset": dataset_key,
        "family": "musa",
        "module": cfg["dir"],
        "ml_prediction": ml_pred,
        "ml_probability": round(ml_prob, 4),
        "ml_model": art["ml_name"],
        "qml_prediction": qml_pred,
        "qml_probability": round(qml_prob, 4),
        "qml_model": "vqc_4qubit",  # 4 qubits, AngleEmbedding + 2x StronglyEntanglingLayers, <Z> readout
        "risk": _risk_string(ml_pred, ml_prob),
        "explain": {
            "top_features": _top_features(art["pca"], order),
            "note": "Top PCA loadings mapped back to raw features — heuristic, not SHAP.",
        },
    }

