# Hybrid Quantum ML Platform for Early Disease Detection — SIH26139
**PS:** SIH26139 Egreen Quanta (MedTech) | **Team:** you (lead), Musa, Ashutosh, Anmol (heavy), Abdul, Mishti | **Deadline:** 20 Sept 2026  

> **Serving scope (Sept 2026):** the platform serves **only the three Musa2609/SIH- modules** —
> `musa_heart` (UCI Cleveland, HistGradientBoosting 91.80% + 4-qubit VQC 77.05%),
> `musa_hcv` (UCI HCV, XGBoost 98.37% + 4-qubit VQC 91.87%) and `musa_diabetes`
> (Baghdad cohort 3-class, Random Forest 98.11% + 4-qubit VQC 73.58%).
> The repo's own legacy 5-dataset stack (heart/diabetes/breast_cancer/liver/parkinsons,
> 8-qubit VQC, PCA-8) is **gated, not deleted**: artifacts stay under `models/`, `data/`,
> `results/` and `src/`, the legacy registry remains in `backend/services/datasets.py`
> for provenance/retraining, but no API endpoint or UI surface serves it.
> Endpoints: `docs/api.md` · Model provenance: `backend/models/musa/`.

> Merged solo-proof plan: `docs/architecture.md` (from `/home/ace/SIH26139_MERGED_CHECKLIST.md`) + team hygiene `Downloads/SIH26139...md:1225-1242`.

## Repo Map (new layout)

```
hybrid-qml-disease-detection/
├── data/raw/, processed/          # Abdul/Mishti — raw CSV, cleaned
├── notebooks/01-05.ipynb          # EDA → VQC
├── src/data/ preprocessing.py, dataset.py
├── src/ml/ logistic_regression.py, svm.py, random_forest.py, evaluate.py
├── src/qml/ circuit.py, vqc.py, train_vqc.py (+ qsvm via src/qml/)
├── src/utils/ config.py
├── models/classical|quantum|preprocessing/*.pkl
├── backend/main.py + routes/prediction.py + services/ + schemas/patient.py
├── frontend/src/{components,pages,services} + App.jsx
├── results/metrics|confusion_matrices|comparison/
└── docs/architecture.md, ml_pipeline.md, qml_pipeline.md, api.md
```

Legacy scaffold preserved at `~/Projects/SIH26139/` (same logic, old paths). This repo is the **new canonical** matching your requested architecture.

## Quick Start

> The steps below reproduce the **legacy (gated) pipeline** — kept for artifact
> provenance. The **served** models are Musa2609/SIH-'s staged artifacts in
> `backend/models/musa/` (training code in their repo; inference via
> `backend/services/musa_service.py` + `musa_vqc.py`). Verify them with
> `.venv/bin/python backend/scripts/validate_models.py`.

```bash
# 1. Env — use python 3.12 (qiskit/pennylane need ≤3.12, your system is 3.14)
uv python pin 3.12 && uv venv .venv --python 3.12
source .venv/bin/activate
pip install -r requirements.txt

# 2. Fetch data (fallback if Abdul 48h not done)
python -c "from src.data.dataset import fetch_data; fetch_data()"

# 3. Preprocess (fit on train only, PCA 8 → 8 qubits)
python src/data/preprocessing.py --dataset heart --pca 8
python src/data/preprocessing.py --dataset diabetes --pca 8

# 4. Classical baselines (CPU, 0.3s)
python src/ml/logistic_regression.py --dataset heart
python src/ml/svm.py --dataset heart
python src/ml/random_forest.py --dataset heart
python src/ml/evaluate.py --dataset heart  # writes results/metrics/

# 5. Quantum (on Anmol's rig, 8 qubits 512 shots)
python src/qml/train_vqc.py --dataset heart --qubits 8 --shots 512 --iter 100

# 6. Compare → docs
python src/qml/train_vqc.py --dataset diabetes --qubits 8
# benchmark auto-generates results/comparison/benchmark.json

# 7. Platform
uvicorn backend.main:app --reload --port 8000 &
cd frontend && npm install && npm run dev  # http://localhost:5173
```

## Hardware Note (your 680M, 12GB)

- Classical instant; VQC 8q 100iter 200 samples = 25-60s on your Ryzen 7 7735HS (16 threads, 6.5GB free). Keep `qubits=8`, `shots=512`.
- 10q+ is 3-5 min — use Anmol's PC for heavy sweeps.

## Deliverables

- `data/data_dict.md`, cleaned CSVs, scaler/pca in `models/preprocessing/` (fit train only)
- Classical + VQC saved in `models/classical|quantum/`, metrics in `results/`
- FastAPI + React with `/predict` + `/benchmark`, deployed URL (Render+Vercel) by Day 17
- Official PPT `SIH2026-IDEA-Presentation-Format.pptx` + 2-min video + GitHub link for SPOC before 20 Sept 23:59

See `docs/architecture.md` for full 13-phase checklist, `docs/api.md` for endpoints.
