"""API routes — backend/routes/prediction.py

  GET  /health                 liveness + dataset ids
  GET  /models                 dataset registry (fields, ranges, options, examples)
  GET  /benchmark              per-dataset classical/VQC metrics
  GET  /triage/questions       5 triage questions + triggers
  POST /api/triage             answers -> recommended pathways
  POST /api/predict/heart      heart features -> ML + QML
  POST /api/predict/diabetes   diabetes features -> ML + QML
  POST /api/predict/hcv        HCV features -> ML + QML
  POST /api/predict/all        multiple disease inputs -> all results
  POST /api/upload-report      PDF -> OCR/extraction
  POST /api/validate-report    confirmed values -> validated inputs
  POST /api/predict            generic /predict (active musa modules only)
  POST /api/explain            result -> evidence + next-step guidance
  POST /api/report             result -> screening summary
"""
import json
import pathlib

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from backend.schemas.patient import (
    PredictRequest, TriageRequest, OCRReviewConfirmRequest, ReportRequest,
)
from backend.services import datasets as DS
from backend.services import predictor
from backend.services import triage as triage_svc
from backend.services import ocr as ocr_svc
from backend.services import explainability as explain_svc
from backend.services import report as report_svc
from backend.services.musa_service import predict_musa
from backend.services import qattrib as qattrib_svc

router = APIRouter()

ROOT = pathlib.Path(__file__).resolve().parents[2]
# Active serving scope: ONLY the three Musa2609/SIH- modules. The legacy 5-dataset
# artifacts remain on disk (and in LEGACY_REGISTRY for provenance/retraining) but are
# no longer served by the API nor selectable in the UI (Sept 2026 decision).
LEGACY_IDS = list(DS.LEGACY_REGISTRY.keys())
MUSA_IDS = list(DS.MUSA_REGISTRY.keys())
ALL_IDS = MUSA_IDS  # API-facing dataset ids (active scope only)

# Map display-name routes → dataset id. heart/diabetes/hcv all resolve to the
# Musa2609/SIH- modules (HistGradientBoosting / Random Forest / XGBoost + 4-qubit VQCs).
DISEASE_ROUTES = {
    "heart": "musa_heart",
    "diabetes": "musa_diabetes",
    "hcv": "musa_hcv",
}


# -------------------------------------------------------------- existing
@router.get("/health")
def health():
    return {
        "status": "ok",
        "datasets": MUSA_IDS,
        "musa_datasets": MUSA_IDS,
        "qml_model": "vqc_4qubit",
        "version": "2.1",
    }


@router.get("/models")
def models():
    return {"datasets": DS.all_datasets()}


MUSA_META = {
    "musa_heart": ("HEART", "heart_metrics.json"),
    "musa_hcv": ("HCV", "hcv_metrics.json"),
    "musa_diabetes": ("DIABETES", "metrics.json"),
}

# VQC size whose result we headline per module — the best published run in each
# module's metrics JSON (diabetes peaks at 8 qubits, heart/HCV at 4).
QML_QUBITS = {"musa_diabetes": 8, "musa_heart": 4, "musa_hcv": 4}


@router.get("/benchmark")
def benchmark():
    """Honest scoreboard for the three active (Musa2609/SIH-) modules.

    Every number comes straight from the team's own published metrics JSONs
    (backend/models/musa/<MODULE>/) — no re-measurement, no spin: where the
    classical model beats the VQC, that is what we report.
    """
    out = {}
    for key, (module, fname) in MUSA_META.items():
        p = ROOT / "backend" / "models" / "musa" / module / fname
        if not p.exists():
            continue
        j = json.loads(p.read_text())
        perf = j.get("models_performance", {})
        best_ml = j.get("best_classical_ml")
        ml_entry = perf.get(best_ml, {})
        qubits = QML_QUBITS.get(key, 4)
        q_entry = perf.get(f"QML ({qubits} Qubits)", perf.get("QML (4 Qubits)", {}))
        # Headline metric is Macro F1 (class-balanced average, matches the team's
        # published comparison table); fall back to F1-Score where only the
        # positive-class value was published.
        f1 = ml_entry.get("Macro F1", ml_entry.get("F1-Score"))
        q_f1 = q_entry.get("Macro F1", q_entry.get("F1-Score"))
        out[key] = {
            "family": "musa",
            "module": module,
            "classical_best": {
                "model": best_ml,
                "accuracy": ml_entry.get("Accuracy"),
                "f1": f1,
                "roc_auc": ml_entry.get("ROC-AUC"),
            },
            "vqc": {
                "accuracy": q_entry.get("Accuracy"),
                "f1": q_f1,
                "roc_auc": q_entry.get("ROC-AUC"),
                "qubits": qubits,
            },
        }
    if not out:
        raise HTTPException(503, "No benchmark metrics found — run the training pipeline first")
    return out


@router.post("/predict")
def predict(req: PredictRequest):
    ds = req.dataset
    if ds not in ALL_IDS:
        raise HTTPException(400, f"dataset must be one of {ALL_IDS}")
    features = req.features or {}
    return _run_predict(ds, features)


# -------------------------------------------------------------- new
@router.get("/triage/questions")
def triage_questions():
    return {"questions": triage_svc.get_questions()}


@router.post("/api/triage")
def api_triage(req: TriageRequest):
    answers = {a.question_id: a.answer for a in req.answers}
    return triage_svc.compute_pathways(answers)


def _run_predict(ds: str, features: dict):
    try:
        if ds in DS.MUSA_REGISTRY:
            return predict_musa(ds, features)
        return predictor.run_prediction(ds, features)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except FileNotFoundError as e:
        raise HTTPException(500, f"Model artifacts missing: {e}")
    except KeyError as e:
        raise HTTPException(400, f"unknown dataset '{ds}'")
    except Exception as e:
        raise HTTPException(500, f"Prediction failed: {type(e).__name__}: {e}")


class AllPredictRequest(BaseModel):
    heart: dict | None = None
    diabetes: dict | None = None
    hcv: dict | None = None


class AttributionRequest(BaseModel):
    """POST /api/quantum-attribution body — same shape as /predict."""

    dataset: str
    features: dict


@router.post("/api/quantum-attribution")
def api_quantum_attribution(req: AttributionRequest):
    """XQAI map for one screening record. Read-only replay of the frozen VQC —
    never alters the prediction. Musa modules only."""
    if req.dataset not in ALL_IDS:
        raise HTTPException(400, f"dataset must be one of {ALL_IDS}")
    try:
        return qattrib_svc.attribute(req.dataset, req.features or {})
    except ValueError as e:
        raise HTTPException(422, str(e))
    except FileNotFoundError as e:
        raise HTTPException(500, f"Model artifacts missing: {e}")
    except Exception as e:
        raise HTTPException(500, f"Attribution failed: {type(e).__name__}: {e}")


@router.post("/api/predict/all")
def api_predict_all(req: AllPredictRequest):
    """Multi-disease endpoint: runs whichever diseases have inputs supplied.

    NOTE: registered BEFORE /api/predict/{disease} so FastAPI doesn't capture
    "all" as a disease route parameter.
    """
    out = {}
    for key, features in [("heart", req.heart), ("diabetes", req.diabetes), ("hcv", req.hcv)]:
        if features:
            ds = DISEASE_ROUTES[key]
            try:
                out[key] = _run_predict(ds, features)
            except HTTPException as e:
                out[key] = {"error": e.detail, "status": e.status_code}
    return out


@router.post("/api/predict/{disease}")
def api_predict_disease(disease: str, body: dict):
    """Disease-specific endpoint. `body` = {features: {...}} or just {...}."""
    if disease not in DISEASE_ROUTES:
        raise HTTPException(404, f"unknown disease route '{disease}'. Valid: {list(DISEASE_ROUTES)}")
    ds = DISEASE_ROUTES[disease]
    features = body.get("features") if isinstance(body, dict) and "features" in body else (body or {})
    return _run_predict(ds, features)


@router.post("/api/upload-report")
async def api_upload_report(disease: str, file: UploadFile = File(...)):
    """Accept a PDF (or plain-text) lab report, extract candidate clinical values,
    return a review table. The user MUST confirm/edit before inference.
    """
    if disease not in DS.all_datasets():
        raise HTTPException(400, f"unknown disease '{disease}'")
    contents = await file.read()
    if not contents:
        raise HTTPException(400, "empty file")

    text = ocr_svc.extract_text_from_pdf(contents)
    if not text.strip():
        raise HTTPException(422, "could not extract any text from the uploaded file")

    field_keys = DS.feature_order(disease)
    candidates = ocr_svc.extract_candidates(text, field_keys)
    review = ocr_svc.build_review_table(candidates, field_keys)
    return {
        "disease": disease,
        "filename": file.filename,
        "extracted_chars": len(text),
        **review,
    }


@router.post("/api/validate-report")
def api_validate_report(req: OCRReviewConfirmRequest):
    """Validate the user-confirmed/edited values. Returns validated inputs ready
    for /api/predict/{disease}."""
    if req.disease not in DS.all_datasets():
        raise HTTPException(400, f"unknown disease '{req.disease}'")
    # Trigger validation by running through the dataset's feature order
    order = DS.feature_order(req.disease)
    validated = {}
    for k in order:
        if k not in req.features:
            raise HTTPException(422, f"missing field: {k}")
        v = req.features[k]
        try:
            validated[k] = float(v)
        except (TypeError, ValueError):
            validated[k] = v
    return {
        "disease": req.disease,
        "validated": validated,
        "ready_for_predict": True,
    }


@router.post("/api/explain")
def api_explain(body: dict):
    """Build a plain-language explanation + trusted evidence for a result.

    Body: {disease, risk, top_features, model_version?}
    """
    disease = body.get("disease", "")
    risk = body.get("risk", "")
    top = body.get("top_features", [])
    mv = body.get("model_version", "vqc_4qubit")
    return explain_svc.explain_disease_result(disease, risk, top, mv)


@router.post("/api/report")
def api_report(req: ReportRequest):
    """Build a structured screening report. The frontend renders/downloads this."""
    explanation = explain_svc.explain_disease_result(
        req.disease,
        req.result.get("risk", ""),
        req.result.get("explain", {}).get("top_features", []),
        req.result.get("qml_model", "vqc_4qubit"),
    )
    return report_svc.build_report(req.disease, req.inputs, req.result, explanation)