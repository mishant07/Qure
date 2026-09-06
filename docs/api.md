# API — backend/main.py (v2.1, Musa-only serving scope)

Base: `http://localhost:8000` (Render in prod via `VITE_API_URL`).
Run: `.venv/bin/python -m uvicorn backend.main:app --port 8000`

**Serving scope (Sept 2026):** ONLY the three Musa2609/SIH- modules.
The legacy 5-dataset artifacts (`heart`, `diabetes`, `breast_cancer`, `liver`,
`parkinsons`) remain on disk for provenance but every dataset-facing endpoint
rejects them.

Active dataset ids:
- `musa_heart` — UCI #45 Cleveland, 303x13, **raw UCI coding** (cp 1-4, slope 1-3, thal 3/6/7)
- `musa_hcv` — UCI #571 hcvdat0, 615x12 (`Sex` as `"m"`/`"f"`)
- `musa_diabetes` — Baghdad Medical City cohort, 264x11, **pre-standardized z-score inputs**

## GET /health
→ `{status:"ok", datasets:["musa_heart","musa_hcv","musa_diabetes"], musa_datasets:[same], qml_model:"vqc_4qubit", version:"2.1"}`

## GET /models
Dataset registry used to render forms without hardcoding a second copy:
`{datasets: {<id>: {name, source, family:"musa", module, ml, qml, classes, fields: [{key,label,unit,min,max,example,step,options?}], note?}}}`
`options` marks integer/string-coded categoricals (`sex`, `cp`, `slope`, `thal`, `Sex`, `fbs`, `restecg`, `exang`).

## GET /benchmark
Per-module metrics straight from the team's published JSONs
(`backend/models/musa/<MODULE>/*_metrics.json`), same keys as
`frontend/src/data/benchmark.json`:
`{<id>: {family:"musa", module, classical_best:{model,accuracy,f1,roc_auc}, vqc:{accuracy,f1,roc_auc,qubits:4}}}`

Numbers are reported as published — where the classical model beats the VQC
(heart, HCV, diabetes), that is what the scoreboard shows.

## POST /predict
`dataset` must be one of the 3 active ids.
```json
{
  "dataset": "musa_heart",
  "features": {
    "age": 52, "sex": 1, "cp": 4, "trestbps": 125, "chol": 212, "fbs": 0,
    "restecg": 2, "thalach": 150, "exang": 0, "oldpeak": 1.0, "slope": 3, "ca": 0, "thal": 6
  }
}
```
Response (consumed by `frontend/src/components/ResultsDashboard.jsx`):
```json
{
  "dataset": "musa_heart",
  "ml_prediction": 1, "ml_probability": 0.81, "ml_model": "HistGradientBoosting",
  "qml_prediction": 1, "qml_probability": 0.78, "qml_model": "vqc_4qubit",
  "risk": "HIGH",
  "explain": {"top_features": ["age", "chol", "oldpeak"], "note": "Heuristic top contributors — not SHAP."},
  "family": "musa",
  "module": "HEART"
}
```
Semantics:
- Classical winners: HistGradientBoosting (heart), XGBoost (HCV), Random Forest (diabetes 3-class)
- `ml_probability` = classical model's confidence in its own verdict (max class probability)
- `qml_probability` = 4-qubit VQC confidence in its own verdict (exact simulation, no shots)
- `risk` = `HIGH` if any track predicts disease with probability > 0.7, `MODERATE`
  if any track predicts disease, else `LOW` (musa_diabetes: classes 1|2 = "disease")
- musa_heart inputs are range-validated against the team's published envelope
  (age 18-100, cp 1-4, trestbps 70-250, chol 100-600, thalach 60-230, oldpeak 0-10,
  slope 1-3, ca 0-3, thal 3-7, etc.)
- musa_hcv `Sex` accepts `"m"`/`"f"` (encoded via the team's staged dict, m→1 / f→0)
- musa_diabetes features are cohort z-scores (the team's published pipeline ships
  standardized features only) — the UI labels every field accordingly

## POST /api/predict/{heart|diabetes|hcv}
Display-name aliases that all resolve to the Musa modules:
`heart → musa_heart`, `diabetes → musa_diabetes`, `hcv → musa_hcv`.
Body: `{features: {...}}` or a bare feature object.

## POST /api/predict/all
`{"heart": {...}, "diabetes": {...}, "hcv": {...}}` → runs each supplied
module; per-key results or `{error, status}` entries.

## GET /triage/questions · POST /api/triage
Five rule-based questions; "yes" answers map to the active pathways
(`musa_heart` / `musa_diabetes` / `musa_hcv`) with rationale + recommended list.

## POST /api/upload-report
`?disease=<active id>` multipart PDF/text → OCR candidate values + review table
(`rows: [{field, value, source_text, missing, uncertain}]`). Extraction patterns
cover the heart (raw UCI), HCV and diabetes field sets; sex-coded fields return
`"m"/"f"` (heart, HCV) or 0/1 (diabetes) to match each model.

## POST /api/validate-report
Confirmed/edited values → per-field `float()` conversion in registry order;
422 on missing fields.

## POST /api/explain · POST /api/report
Evidence-backed plain-language explanation (WHO/CDC/AHA/ADA sources per module)
and the structured screening summary. `model_version` is `vqc_4qubit`.

Errors: 400 unknown dataset / legacy id rejected, 422 missing/non-numeric/out-of-range feature,
500 artifacts missing or inference failure.

Validation: `backend/scripts/validate_models.py` reproduces every model's published
test metrics from the shipped artifacts. Frontend consumes via `frontend/src/services/api.js`.
