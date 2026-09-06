"""Report generation service — backend/services/report.py

Builds a structured, user-readable screening summary. Returns a JSON
structure (the frontend renders it). Per the SIH 26139 guide:

  "Downloadable screening summary with inputs, outputs, explanation,
   model/version information and disclaimer."
"""
import datetime
from typing import Dict, List, Any


def build_report(
    disease: str,
    inputs: Dict[str, Any],
    result: Dict[str, Any],
    explanation: Dict[str, Any],
) -> Dict[str, Any]:
    """Build a screening report structure.

    Args:
      disease: dataset key (e.g. 'heart', 'diabetes')
      inputs: the validated features used
      result: the /predict response (ml_*, qml_*, risk, etc.)
      explanation: output from explainability.explain_disease_result

    Returns a dict the frontend can render.
    """
    ml_pred = result.get("ml_prediction")
    qml_pred = result.get("qml_prediction")
    ml_prob = result.get("ml_probability")
    qml_prob = result.get("qml_probability")
    risk = result.get("risk", "")
    ml_model = result.get("ml_model", "best classical")
    qml_model = result.get("qml_model", "vqc_4qubit")
    contributors = result.get("explain", {}).get("top_features", [])

    agreement = ml_pred == qml_pred
    disease_pred = (ml_pred not in (0, None, "0")) if ml_pred is not None else False
    disease_pred_q = (qml_pred not in (0, None, "0")) if qml_pred is not None else False

    return {
        "title": "Screening Summary",
        "disease": disease,
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "screening_outcome": _outcome_text(risk),
        "model_scores": {
            "classical_ml": {
                "prediction": (
                    "higher-risk pattern" if disease_pred else "no high-risk pattern"
                ),
                "score": round(float(ml_prob), 4) if ml_prob is not None else None,
                "model_name": ml_model,
            },
            "quantum_ml": {
                "prediction": (
                    "higher-risk pattern" if disease_pred_q else "no high-risk pattern"
                ),
                "score": round(float(qml_prob), 4) if qml_prob is not None else None,
                "model_name": qml_model,
            },
        },
        "agreement": {
            "models_agree": agreement,
            "explanation": (
                "The two models produced the same screening verdict."
                if agreement
                else "The two models disagree — review the explanation and consult a clinician."
            ),
        },
        "key_contributors": [
            {"feature": c, "description": explanation.get("contributor_text", [])[i] if i < len(explanation.get("contributor_text", [])) else c}
            for i, c in enumerate(contributors)
        ],
        "explanation": explanation,
        "inputs_used": inputs,
        "disclaimer": (
            "This is a screening aid produced by an experimental research prototype, "
            "not a medical diagnosis. It is not a substitute for professional medical "
            "advice, diagnosis, or treatment. The classical ML and quantum ML models "
            "are trained on public UCI datasets and have not been clinically validated. "
            "Always seek the advice of a qualified healthcare provider with any questions "
            "you may have regarding a medical condition."
        ),
    }


def _outcome_text(risk: str) -> str:
    r = (risk or "").lower()
    if r == "high":
        return "Higher-risk pattern detected"
    if r == "moderate":
        return "Moderate-risk pattern detected"
    return "Lower-risk pattern — no high-risk signal"