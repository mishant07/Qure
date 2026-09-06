"""XQAI quantum feature attribution — backend/services/qattrib.py

Per-patient explanation of the FROZEN 4-qubit Musa VQC verdict, by ablation:
for each raw clinical feature, replace it with its neutral baseline (the
staged imputer's training mean, or 0.0 for the pre-standardized diabetes
z-scores), re-run the exact staged pipeline
(imputer -> scaler -> PCA(4) -> VQC), and measure how the VQC's confidence in
its own verdict moves. Normalized absolute moves become the reported weights.

What this is and is not (judges/doctors read this):
  * It does NOT retrain, modify, or re-weight the model. The artifacts and the
    /predict verdict are untouched; this service only replays inference.
  * It is an approximation, not a causal reading of "what the qubits want".
    AngleEmbedding + PCA + entanglement deliberately mix features, so no
    attribution can be exact. Reported as such in the UI footnote.
  * Deterministic: exact state-vector simulation, no shots — same input always
    yields the same map. Cheap: n_features extra CPU forward passes (~ms each).
"""
import numpy as np

from backend.services import datasets as DS
from backend.services import musa_service as _musa
from backend.services.explainability import CONTRIBUTOR_LABELS

_EPS = 1e-12


def attribute(dataset_key: str, features: dict, top_n: int | None = None) -> dict:
    """Attribute one screening record's VQC verdict to its raw features.

    Returns {
      dataset, qml_prediction, qml_confidence, qml_model,
      qubit_readout: [z0..z3]  (per-wire <Z> before the readout head),
      attributions: [{feature, label, weight_pct, direction}],
      method, note,
    }
    Raises ValueError on bad input (mirrors /predict validation).
    """
    if dataset_key not in DS.MUSA_REGISTRY:
        raise ValueError(f"quantum attribution needs one of {list(DS.MUSA_REGISTRY)}")
    art = _musa._load(dataset_key)  # same-package reuse of the staged artifacts
    order = DS.feature_order(dataset_key)
    df = _musa._prepare_frame(dataset_key, features)  # validates + encodes Sex

    X_imp = (
        art["imputer"].transform(df[order])
        if art["imputer"] is not None
        else df[order].to_numpy(dtype=float)
    )
    baselines = (
        np.asarray(art["imputer"].statistics_, dtype=float)
        if art["imputer"] is not None
        else np.zeros(len(order))  # diabetes inputs are cohort z-scores: mean is 0
    )

    def _qml_confidence(X_imp_mat: np.ndarray) -> np.ndarray:
        X_scaled = art["scaler"].transform(X_imp_mat)
        X_pca = art["pca"].transform(X_scaled)
        return art["vqc"].predict_proba(X_pca)[0]

    base_probs = _qml_confidence(X_imp)
    qpred = int(np.argmax(base_probs))
    base_conf = float(base_probs[qpred])

    X_scaled = art["scaler"].transform(X_imp)
    X_pca = art["pca"].transform(X_scaled)
    qubit_readout = [round(float(z), 4) for z in art["vqc"].expectations(X_pca)[0]]

    impacts = []
    for j in range(len(order)):
        ablated = X_imp.copy()
        ablated[:, j] = baselines[j]
        conf = float(_qml_confidence(ablated)[qpred])
        impacts.append(base_conf - conf)  # >0: feature supports the verdict

    denom = float(np.sum(np.abs(impacts)))
    attributions = []
    for key, impact in zip(order, impacts):
        weight = (abs(impact) / denom * 100.0) if denom > _EPS else 0.0
        attributions.append(
            {
                "feature": key,
                "label": CONTRIBUTOR_LABELS.get(key, key),
                "weight_pct": round(weight, 1),
                "direction": "supports"
                if impact > _EPS
                else ("opposes" if impact < -_EPS else "neutral"),
            }
        )
    attributions.sort(key=lambda a: a["weight_pct"], reverse=True)
    if top_n is not None:
        attributions = attributions[: max(1, top_n)]

    return {
        "dataset": dataset_key,
        "qml_prediction": qpred,
        "qml_confidence": round(base_conf, 4),
        "qml_model": "vqc_4qubit",
        "qubit_readout": qubit_readout,
        "attributions": attributions,
        "method": "ablation",
        "note": (
            "Approximation: each weight is the VQC confidence move when that "
            "feature alone is reset to its neutral baseline, replayed through "
            "the frozen pipeline. PCA + entanglement mix features, so weights "
            "are indicative, not causal. Same input always yields the same map."
        ),
    }
