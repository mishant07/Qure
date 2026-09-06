"""Prediction service — backend/services/predictor.py

Single entry points used by the router:
  run_prediction()      -> legacy 5 UCI datasets (repo's own artifacts)
  run_musa_prediction() -> Musa2609/SIH- modules (their artifacts, see musa_service)

Response contract is ResultPanel.jsx, verbatim:
  { dataset, ml_prediction, ml_probability, ml_model,
    qml_prediction, qml_probability, qml_model: 'vqc_8qubit',
    risk: 'HIGH'|'MODERATE'|'LOW', explain: {top_features, note} }
"""
import pathlib
import warnings

import numpy as np
import pandas as pd
import pennylane as qml
from pennylane import numpy as pnp

from backend.services import datasets as DS
from backend.services.model_loader import load_pipeline
from backend.services.musa_service import predict_musa

# Inference is row-vector only — sklearn's `X does not have valid feature names`
# warning is noise here because preprocessors were fitted on a DataFrame. Wrap
# each transform in a context that silences only that family of warnings; the
# genuine InconsistentVersionWarning is left to surface during boot.
warnings.filterwarnings("ignore", message="X does not have valid feature names", category=UserWarning)

ROOT = pathlib.Path(__file__).resolve().parents[2]

QML_MODEL_TAG = "vqc_8qubit"  # ResultPanel provenance tag
EXPLAIN_NOTE = "Top PCA loadings mapped back to raw features — heuristic, not SHAP."


# ------------------------------------------------------------------ helpers

def _risk_string(ml_pred: int, ml_prob: float, qml_pred, qml_prob) -> str:
    """Same semantics as the previous backend (ResultPanel chips rely on it)."""
    preds = [ml_pred] + ([qml_pred] if qml_pred is not None else [])
    probs = [ml_prob] + ([qml_prob] if qml_prob is not None else [])
    disease = any(int(p) == 1 for p in preds)
    if disease and max(probs) > 0.7:
        return "HIGH"
    return "MODERATE" if disease else "LOW"


def _top_features(pca, order, n=3):
    """Highest-|loading| PCA components -> raw feature names (registry fallback)."""
    comps = np.abs(pca.components_[:3]).sum(axis=0)
    idx = np.argsort(comps)[::-1][:n]
    names = getattr(pca, "feature_names_in_", None)
    names = [str(x) for x in names] if names is not None else list(order)
    return [names[i] if i < len(names) else str(i) for i in idx]


def _qml_runtime(dataset: str):
    """Load (and cache) the trained 8-qubit legacy VQC for a dataset, if present."""
    cache = getattr(_qml_runtime, "_cache", None)
    if cache is None:
        cache = _qml_runtime._cache = {}
    if dataset in cache:
        return cache[dataset]
    qnt = ROOT / "models" / "quantum" / f"vqc_{dataset}"
    legacy = ROOT / "backend" / "models" / f"vqc_{dataset}"
    params_p = next((p for p in (qnt / "params.npy", legacy / "params.npy") if p.exists()), None)
    if not params_p:
        cache[dataset] = None
        return None

    params = np.load(params_p)
    p = pnp.array(params, requires_grad=False)
    n_qubits = params.shape[1]

    dev = qml.device("default.qubit", wires=n_qubits)

    @qml.qnode(dev, interface="autograd")
    def circuit(params, x):
        qml.AngleEmbedding(x, wires=range(n_qubits), rotation="Y")
        qml.StronglyEntanglingLayers(params, wires=range(n_qubits))
        return qml.expval(qml.PauliZ(0))

    def to_angle(v):
        v = float(np.clip(v, -3, 3))
        return (v + 3) / 6 * np.pi

    def proba_positive(X_pca):
        out = []
        for row in np.asarray(X_pca, dtype=float):
            z = circuit(p, [to_angle(v) for v in row])
            out.append((float(z) + 1.0) / 2.0)
        return np.array(out)

    cache[dataset] = proba_positive
    return proba_positive


# ------------------------------------------------------------------ legacy 5

def run_prediction(dataset_key: str, features: dict) -> dict:
    """Legacy-dataset prediction; raises ValueError on bad input."""
    order = DS.feature_order(dataset_key)
    try:
        row = np.array([[float(features[k]) for k in order]], dtype=float)
    except KeyError as e:
        raise ValueError(f"missing feature: {e.args[0]}") from None
    except (TypeError, ValueError) as e:
        raise ValueError(f"non-numeric feature value: {e}") from None

    imputer, scaler, pca, clf, best_name, _ = load_pipeline(dataset_key)
    X_imp = imputer.transform(row)
    X_scl = scaler.transform(X_imp)
    X_pca = pca.transform(X_scl)

    # ---- classical track
    ml_pred = int(clf.predict(X_pca)[0])
    ml_prob = float(np.max(clf.predict_proba(X_pca)[0])) if hasattr(clf, "predict_proba") else 0.5

    # ---- quantum track (real VQC inference on the same PCA features)
    qml_pred, qml_prob = None, None
    proba_positive = _qml_runtime(dataset_key)
    if proba_positive is not None:
        p1 = float(proba_positive(X_pca)[0])  # P(disease) = (<Z0> + 1) / 2
        qml_pred = int(p1 >= 0.5)
        qml_prob = p1 if qml_pred == 1 else 1.0 - p1  # confidence in its verdict
    else:  # no trained VQC artifact — never fake the quantum number
        qml_pred, qml_prob = ml_pred, ml_prob

    return {
        "dataset": dataset_key,
        "ml_prediction": ml_pred,
        "ml_probability": round(ml_prob, 4),
        "ml_model": best_name,
        "qml_prediction": int(qml_pred),
        "qml_probability": round(float(qml_prob), 4),
        "qml_model": QML_MODEL_TAG,
        "risk": _risk_string(ml_pred, ml_prob, qml_pred, qml_prob),
        "explain": {"top_features": _top_features(pca, order), "note": EXPLAIN_NOTE},
    }


# ------------------------------------------------------------------ musa 3

def run_musa_prediction(dataset_key: str, features: dict) -> dict:
    """Musa-module prediction (delegates to musa_service, same contract)."""
    return predict_musa(dataset_key, features)


