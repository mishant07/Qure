# SIH26139 — Hybrid Quantum ML Platform — Professional Handoff
> **One-file handoff for a pro software/web team to take over. Covers idea, goal, progress, stack, results, ops, and next steps. Generated 2026-08-29 from full conversation.**

> **⚠️ UPDATE 2026-09-06 — Serving scope changed.** The platform now serves **only the
> three Musa2609/SIH- modules** (`musa_heart`, `musa_hcv`, `musa_diabetes`; HistGradientBoosting /
> XGBoost / Random Forest + 4-qubit PennyLane VQCs from `backend/models/musa/`). The legacy
> 5-dataset stack described throughout this document (8-qubit VQC, PCA-8, RBF-SVC, Pima diabetes)
> is **gated, not deleted** — artifacts retained under `models/`, `data/`, `results/`, `src/`,
> legacy registry retained in `backend/services/datasets.py`, but no endpoint or UI serves it.
> Sections 1–12 below describe the pre-gating state and are kept for history; see
> `docs/api.md` and `backend/routes/prediction.py` for the current contract.


---

## 0. Quick Facts

| Field | Value |
|-------|-------|
| **PS** | **SIH26139** — *Hybrid Quantum Machine Learning Platform for Early Disease Detection* — Egreen Quanta, MedTech, Software |
| **Goal** | Dual-disease demo proving hybrid classical+quantum works on real clinical tabular data, with honest benchmark (time/depth/F1) and explainability, deployed |
| **Dual Demo Default** | **UCI Heart Disease Cleveland (303×13)** + **Pima Indians Diabetes (768×8)** → scales to cancer/neuro per PS |
| **Team** | Shaurya (lead, solo-heavy), Musa, Ashutosh, Anmol (heavy compute rig), Abdul, Mishti |
| **Deadline** | Internal hackathon **20 Sept 2026** (real elimination, ~70%) → SIH org submission after |
| **Repo (canonical)** | `/home/ace/Projects/hybrid-qml-disease-detection` — git `main`, 50+ files, clean `py_compile` |
| **Legacy scaffold** | `~/Projects/SIH26139/` (preserved reference, same logic) |
| **System** | ArchEclipse 7.1.9, Hyprland, Ryzen 7 7735HS 16T, Radeon 680M (no CUDA), 12GB RAM (~6.5 free), Zen + Brave + Kitty |
| **Python** | System 3.14, project **pinned to 3.12.13** via `uv python pin 3.12` + `.venv` (qiskit/pennylane ≤3.12) |
| **Servers (live)** | FastAPI `http://localhost:8000` (uvicorn, nohup) + Vite preview `http://localhost:4173` (npm run preview, nohup) + Kanban `http://127.0.0.1:3484` + 2 Kitty titles `Cline-GLM5.2-xhigh` + `Kilo-MinimaxM3-xhigh` |
| **LLMs** | Cline **GLM 5.2 xhigh** (`z-ai/glm-5.2`, fallback 5.2:free, reasoning xhigh) via `~/.cline/data/settings/providers.json` — Kilo **Minimax M3 xhigh** (`kilo/minimax/minimax-m3:free` --variant xhigh) — both free-tier only |
| **GitHub** | `aceshaurya` (0 repos), MCP `✓ github connected` at `https://api.githubcopilot.com/mcp/` via `~/.config/opencode/opencode.jsonc` with `GITHUB_PERSONAL_ACCESS_TOKEN` in `~/.bashrc:5` + `~/.zshrc:116` (before early return, `source ~/.bashrc` required for non-interactive) — token `github_pat_11BXA...` valid, scope fine-grained, cannot create repo (needs Admin write, 403), user must create empty `hybrid-qml-disease-detection` at github.com/new then push |

---

## 1. Idea & Why This Wins

**PS demand:** Hybrid quantum+classical ML, same test set, explainability, efficiency benchmark, deployed URL + official PPT. Many teams do VQC-only, no SHAP, accuracy-only, local-only, no PPT, single-disease — Merged checklist fixes all 6.

**Our mechanism (uniquely defensible):**
- Same-split hybrid: **3 classical** (LogReg/SVM/RF) vs **VQC 8Q** (PennyLane Lightning StronglyEntanglingLayers, angle embedding) + **QSVM** (Qiskit ZZFeatureMap + FidelityQuantumKernel, currently fallback to RBF due to Qiskit `Sampler`→`SamplerV2` API shift) — all on same `train/test` split (train-fit scaler/PCA/SMOTE, test untouched).
- **Honest benchmark:** Reports F1/AUC + **train time + circuit depth + generalization gap** (PS objective). Heart VQC +3% win is valid assist, Diabetes classical +2.6% is honestly reported — not forced.
- **CPU-only 8 qubits** = 8 PCA components (4KB state, fits 680M), 512 shots, 100 iter target — fits 12GB laptop; >10 qubits offloaded to Anmol's rig.
- **Dual-disease one UI** — single dataset switch proves scalability to cancer/neuro.
- **SHAP** + quantum-gradient importance (PS mandates explainability).
- **Deployed** Render/Vercel URL + **official SIH2026 IDEA PPT** structure — 10-15% marks.

**Research backing:** Studied SIH 2024/2025 winners via `sih.gov.in` tables, PIB, GitHub (`Goddex-123/MaternitySafe`, `Aadiii00/SIH-Winners-PPt`, `sumit-bhagat-2004/SIH-2024-Smart-Yoga-Mat`, `AksharaaSharmaa/Ganga...`, `vedantchalke36/sih-2026-problem-statements`), Reddit r/developersIndia, Kaggle — distilled winner patterns: deployed URL + PPT template = 20% free marks.

---

## 2. Visual Identity (Impeccable Redesign — 2026-08-29)

**Process:** `PRODUCT.md` created (web platform, judges primary), `concept-seed.mjs --scope direction --mode persuade` rolled **key facff5b7, assigned index 3** → **Collider Event Display** (particle tracks curving through onion detector rings into calorimeter wedges).

**World:**
- Palette: vacuum near-black `#06090F`, steel rings `#0F1E2F→#2A4A6B`, signal yellow `#FFCC00`, muon cyan `#00D4FF`, calorimeter red `#FF3B30`, ink `#E8EAF0`.
- Type: **Sora** (display) + **JetBrains Mono** tabular + **Inter** UI — avoids banned Fraunces/Playfair/Syne etc.
- Topology: concentric detector (beamline center), routes outward through layers, along tracks, one event at a time.
- Controls: track isolation dimming, hypothesis ghost tracks, line weight = confidence, calorimeter wedge height = F1.
- **Contract (5 blocks, 150w max)** in `frontend/src/App.jsx:1` comment — THESIS/OWN-WORLD/STORY/FIRST VIEWPORT/FORM/FINISH — hero is detector SVG + “Fire the vector. Watch both interpretations diverge.” Primary action at track terminus.
- **First viewport thesis:** Same vector, two reconstructions diverge — immediate mechanism proof, not hero card.
- **Mobile fix (batched):** hero grid stacks (`@media max-width 900px` → 1fr), beamline label wraps, detector full-width.

**Quality floor:** Contrast ≥4.5:1, depth offset+blur, spacing rhythm, type 65–75ch, motion one authored, states hover/disabled/loading/error/empty, browser surfaces themed, copy action-named, coverage judges see benchmark + predict in seconds.

---

## 3. Repo Map (Current)

```
hybrid-qml-disease-detection/
├── .venv/ (3.12.13, uv)
├── .impeccable/review/ (desktop.png 412K, mobile.png 197→179K, hero-repro pending)
├── PRODUCT.md (schema 1, web, judges primary)
├── HANDOFF.md (this file)
├── README.md + requirements.txt (incl. torch --index-url cpu, split for uv pip)
├── .python-version (3.12)
├── docs/
│   ├── architecture.md (merged 13-phase checklist)
│   ├── benchmark_report.md (Heart VQC win +3%, Diabetes honest loss)
│   ├── api.md (/health /benchmark /predict), ml_pipeline.md, qml_pipeline.md
│   └── MERGED_CHECKLIST.md
├── data/
│   ├── raw/heart.csv (303×14 incl target), diabetes.csv (768×9)
│   └── processed/split_heart.npz, split_diabetes.npz (X_train_p/X_test_p/y_*)
├── src/
│   ├── data/dataset.py (fetch_data fallback), preprocessing.py (imputer/median+scaler+PCA8 fit train-only, SMOTE ready, copies to backend/models)
│   ├── ml/logistic_regression.py, svm.py, random_forest.py, evaluate.py
│   ├── qml/train_vqc.py (fixed pnp.log ArrayBox bug), train_qsvm.py (fixed DATA_PROCESSED path, fallback RBF), hybrid_benchmark.py (fixed ROOT to project), circuit.py, vqc.py, encoding.py
│   └── utils/config.py (DATA_RAW/PROCESSED/MODELS_* /RESULTS_*)
├── models/
│   ├── preprocessing/imputer_* + scaler_* + pca_* (6 pkl)
│   ├── classical/LR+SVM+RF×2 (6 pkl)
│   └── quantum/vqc_heart+diabetes/params.npy + metrics.json
├── backend/
│   ├── main.py (FastAPI /health /benchmark /predict, CORS)
│   ├── services/model_loader.py (supports both layouts, defaults svm if no best_classical_*.json) + predictor.py
│   ├── schemas/patient.py (PredictRequest)
│   └── models/ (copied via cp, 12 pkl + 2 vqc dirs = 14 artifacts, .gitkeep)
├── frontend/
│   ├── package.json (react 18.3, axios, recharts 2.12, vite 5.4, @vitejs/plugin-react)
│   ├── vite.config.js, index.html, src/main.jsx, src/App.jsx (collider redesign), src/data/benchmark.json, src/{components,pages,services}
│   └── dist/ (index.html 0.29K, assets/index-*.js ~233K gzip 75K, built 730-827ms, 87 modules)
├── results/
│   ├── metrics/*.json (8: 6 classical + 2 VQC)
│   ├── comparison/ (empty), confusion_matrices/ (empty)
│   └── (comparison benchmark.json to be generated)
└── notebooks/01-05.ipynb (EDA→VQC stubs)
```

---

## 4. Progress — What’s Done (Chronological)

1. **SIH Research** — Scraped 2024/2025 winners/tables/PTs, GitHub winners, Reddit, Kaggle; chose PS SIH26139, Egreen Quanta, decided Heart+Diabetes public tabular (CPU-friendly).
2. **Merged Checklist** — Compared team plan `/home/ace/Downloads/SIH26139..._Plan.md` vs own, fixed 6 gaps, wrote `docs/architecture.md` + `docs/MERGED_CHECKLIST.md` (13 phases, solo-proof timeline, 48h Abdul/Mishti box).
3. **Scaffold** — Created canonical `hybrid-qml-disease-detection` (50 files, git main, py_compile clean, commit 8222601), preserved legacy `~/Projects/SIH26139/`.
4. **Hardware Probe** — Verified 8q VQC 100iter 200 samples 25–60s, QSVM kernel 8–15s, classical <1s on 7735HS/12GB; set qubit cap 8, 512 shots, 100 iter.
5. **GitHub MCP** — PAT `github_pat_11BXAOGZA...` → `~/.bashrc:5` + `~/.zshrc:116` before `[[ $- != *i* ]]`, `opencode.jsonc` remote `https://api.githubcopilot.com/mcp/` oauth false, verified `aceshaurya` 5000 limit, `✓ github connected` when sourced, `✗ 400` when not — push blocked pending manual empty repo creation (fine-grained lacks Admin write).
6. **Cline + Kilo Setup** — Installed `cline 3.0.60` + `kanban 0.1.70` + `kilo 7.5.6`. Kanban live at `http://127.0.0.1:3484` (nohup, pid ~10540). Cline provider `cline` OAuth `shauryas504@gmail.com` model `z-ai/glm-5.2:free` xhigh (`providers.json`), user switched to `glm-5.3:free` then back to `5.2 xhigh` per request, free-only. Kilo models `kilo/minimax/minimax-m3:free` + `z-ai/glm-5.3` etc. HIT: Cline 429 `Decart upstream_provider_shared_pool` on `:free` suffix — fallback to `z-ai/glm-5.2` (via Cline gateway) works; Kilo Minimax M3 free always works.
7. **Execution Rule** — User wants Cline Kanban GLM5.2 xhigh to do main work (prompts guided), Kilo Minimax M3 xhigh to do small tasks side-by-side, fallback to Cline CLI if Kanban not working; short responses, one step at a time (ADHD); guide both via prompts, wait patiently (no timeout), open terminals so user can watch (`kitty --title Cline-GLM5.2-xhigh` pid 16999 + `Kilo-MinimaxM3-xhigh` pid 17000, two Kitties, hyprctl visible).
8. **Data + Preprocess** — `uv venv .venv --python 3.12`, `uv pip install pandas numpy sklearn imbalanced-learn`, `PYTHONPATH=... python src/data/dataset.py` → Heart 303×14, Diabetes 768×9 → `preprocessing.py --dataset heart/diabetes --pca 8` → train 242/614, test 61/154, PCA8 81.9% / 100% var, split_*.npz + 6 preprocessing pkls, legacy copy to `backend/models` (mkdir+cp fixed).
9. **Classical** — LogReg/SVM/RF ×2 (SMOTE): Heart LR 0.869 F1 0.867 AUC 0.937, SVM same, RF 0.836/0.828; Diabetes LR 0.708/0.609, RF/SVM 0.727/0.638.
10. **QML VQC** — `qiskit 2.5.2 + aer 0.17.2 + m-l 0.9.1 + pennylane 0.45.1 + lightning 0.45.0` installed. Fixed `train_vqc.py:51` `np.log` → `pnp.log` (ArrayBox). Ran 20 iter: Heart 0.902/0.897/0.946 51.9s win +3%, Diabetes 0.701/0.558/0.731 86.5s loss -5% (honest). Models at `models/quantum/vqc_*/params.npy+metrics.json` + `backend/models/vqc_*/`.
11. **QSVM** — Fixed `train_qsvm.py` `ROOT/f"data/..."` → `DATA_PROCESSED`, hit `cannot import Sampler from qiskit.primitives` (needs SamplerV2) → fallback RBF SVM placeholder 0.852 acc, saved to `backend/models/qsvm_*.pkl/json` (flag `qiskit_failed_fallback`).
12. **Benchmark** — Fixed `hybrid_benchmark.py` `ROOT = parent.parent` → `parent.parent.parent`, ran → `docs/benchmark_report.md` + `frontend/src/data/benchmark.json` honest table.
13. **Frontend Build** — `frontend/package.json` → `npm install` (127 pkgs, 2 vulns) → `npm run build` 85→87 modules 730-827ms 233K → `frontend/dist/` + `dist/assets`. Copied to `backend/models` (mkdir fix), tested `load_pipeline('heart')` from project root → `svm` ok.
14. **Backend Test** — Installed `fastapi 0.141.1 + uvicorn + pydantic + httpx + python-multipart + dotenv` via `uv pip install`. `TestClient` `GET /health` → `{"status":"ok",...}` ok, `POST /predict` heart sample → `{"ml_prediction":0,"qml_prediction":0,"risk":"LOW",...}` 200, `top_features` etc. Fixed: Cline hit token limit xhigh thinking, diagnosed missing fastapi, installed, then health ok.
15. **Impeccable Redesign** — `node context.mjs --target frontend/src/App.jsx` → NO_PRODUCT_MD → init interview (3 Q) → answers: judges primary, web, Reimagine → wrote `PRODUCT.md` (schema 1, 5 principles) → `concept-seed.mjs --scope direction --mode persuade` → key facff5b7 assigned index 3 collider event display (steel/verdigris challengers) → inspected `frontend/src/App.jsx` (57-line baseline) + `craft-floor.md` → built new `App.jsx` collider world (header detector wedges, first viewport 1.05fr/0.95fr detector SVG + “Fire the vector. Watch both interpretations diverge.”, control room 12-col grid 13/8 fields, event display dual reconstructions with line weight = confidence, calorimeter wedge stack F1, SHAP displacement bars, details/summary report) → `npm run build` 87→233K → `pkill + nohup` preview → screenshots desktop 412K + mobile 197K (headless brave) → bounded inspection: mobile truncated → batched fix `hero-grid` media query max-width 900px + beamline flex-wrap → rebuild 233.78K → recapture mobile 179K (detector full-width, no truncation) + desktop 420K → Brave `--new-window http://localhost:4173` opened (class brave-browser, title SIH26139).
16. **Ops Fix for User View** — Original preview died after 120s timeout (parent shell exit killed bg). Fixed with `nohup bash -c 'cd ... && exec ...' > /tmp/... &` + `disown`, both ports LISTEN (4173 node, 8000 uvicorn), curl 200, Brave headless screenshot to `.impeccable/review/`.
---

## 5. How to Run (Pro Team)

```bash
cd ~/Projects/hybrid-qml-disease-detection
uv python pin 3.12 && uv venv .venv --python 3.12  # or use existing .venv
uv pip install pandas numpy scikit-learn imbalanced-learn joblib --python .venv/bin/python
uv pip install qiskit qiskit-aer qiskit-machine-learning pennylane pennylane-lightning --python .venv/bin/python
uv pip install fastapi uvicorn pydantic httpx python-multipart python-dotenv --python .venv/bin/python
# Or: uv pip install -r requirements.txt --python .venv/bin/python  (fix torch line: remove --index-url or install torch separately)

# Data (fallback if Abdul not done)
PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/python src/data/dataset.py
PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/python src/data/preprocessing.py --dataset heart --pca 8
PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/python src/data/preprocessing.py --dataset diabetes --pca 8

# Classical
PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/python src/ml/logistic_regression.py --dataset heart
PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/python src/ml/svm.py --dataset heart
PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/python src/ml/random_forest.py --dataset heart
# repeat --dataset diabetes

# QML (Anmol heavy: full 768, 300 iter, image hybrid)
PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/python src/qml/train_vqc.py --dataset heart --qubits 8 --shots 512 --iter 20   # demo 51.9s
PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/python src/qml/train_vqc.py --dataset heart --qubits 8 --shots 512 --iter 100  # full ~260s
PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/python src/qml/train_qsvm.py --dataset heart --qubits 8 --reps 2  # currently fallback, fix SamplerV2 for real kernel

# Benchmark + docs
PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/python src/qml/hybrid_benchmark.py
cat docs/benchmark_report.md
cat frontend/src/data/benchmark.json

# Backend + Frontend (live)
nohup bash -c 'cd ~/Projects/hybrid-qml-disease-detection && PYTHONPATH=/home/ace/Projects/hybrid-qml-disease-detection .venv/bin/uvicorn backend.main:app --port 8000 --host 0.0.0.0' > /tmp/backend.log 2>&1 &
nohup bash -c 'cd ~/Projects/hybrid-qml-disease-detection/frontend && exec npm run preview -- --port 4173 --host 0.0.0.0' > /tmp/frontend.log 2>&1 &
# Dev alternative: cd frontend && npm run dev -- --port 5173 --host 0.0.0.0
# Open: brave --new-window http://localhost:4173 http://localhost:8000/health
# Or: http://127.0.0.1:3484 (Kanban)
# Test: curl -s http://localhost:8000/health
# Predict: curl -X POST http://localhost:8000/predict -H 'Content-Type: application/json' -d '{"dataset":"heart","features":{"age":52,...}}'

# Models sync (if you retrain)
mkdir -p backend/models
cp -v models/preprocessing/* backend/models/
cp -v models/classical/* backend/models/
cp -rv models/quantum backend/models/

# Frontend checks
cd frontend && npm run build && ls dist/ && npm run preview -- --port 4173
```

**Cline + Kilo guided work:**
```bash
# Cline (GLM 5.2 xhigh, via Cline gateway to avoid Decart 429 — use without :free suffix)
cd ~/Projects/hybrid-qml-disease-detection && cline --thinking xhigh -m z-ai/glm-5.2 "your prompt"
# Kilo (Minimax M3 xhigh, free, needs --auto for unattended)
cd ~/Projects/hybrid-qml-disease-detection && kilo run -m kilo/minimax/minimax-m3:free --variant xhigh --auto "your prompt"
# Tail: /tmp/cline.log /tmp/kilo.log /tmp/backend.log /tmp/frontend.log /tmp/kanban.log
```

**Git push (after user creates empty repo):**
```bash
cd ~/Projects/hybrid-qml-disease-detection
git remote add origin https://github.com/aceshaurya/hybrid-qml-disease-detection.git
git add -A && git commit -m "SIH26139: hybrid QML scaffold + 20iter VQC + collider UI"
git push -u origin main
```

---

## 6. Current Model Scores (Honest 20-iter Demo, 8Q depth 32, 512 shots)

| Model | Heart (UCI) Acc | Prec | Recall | F1 | AUC | Time | Diabetes (Pima) Acc | F1 |
|-------|----------------|------|--------|----|-----|------|---------------------|----|
| LogReg | 0.869 | 0.812 | 0.929 | 0.867 | 0.937 | — | 0.708 | 0.609 |
| SVM | 0.869 | 0.812 | 0.929 | 0.867 | 0.942 | — | 0.727 | 0.638 |
| RF | 0.836 | 0.800 | 0.857 | 0.828 | 0.938 | — | 0.727 | 0.638 |
| **VQC** | **0.902** | 0.867 | 0.929 | **0.897** | **0.946** | 51.9s | 0.701 | 0.558 |

**Interpretation for judges:** Heart VQC +0.030 F1 win = valid quantum assist on this split; Diabetes classical holds +0.051 = honest, not forced. Use 100-iter for final PPT (heart ~4-5 min, diabetes ~7 min). QSVM currently fallback RBF 0.852 heart pending SamplerV2 fix.

---

## 7. Decisions & Why

- **Heart+Diabetes public** not cancer: public/kaggle, tabular, CPU sim fits 680M, proves scalability.
- **PCA 8 → 8 qubits**: cap 8 for 12GB, 1 qubit per feature, depth 32, state 4KB.
- **SMOTE on train only**: handle imbalance (heart pos 0.46, diabetes 0.35) without leakage.
- **VQC 20 iter demo**: keeps iteration fast for dev; 100 iter for final requires Anmol rig if >4 min.
- **QSVM fallback**: Qiskit primitives Sampler → SamplerV2 migration needed for real kernel; fallback logs as `qiskit_failed_fallback` honestly.
- **Hybrid benchmark**: time/depth reported alongside F1; judges see not just accuracy.
- **Impeccable collider world**: vacuum dark + steel + signal yellow/cyan maps to quantum vs classical tracks + calorimeter F1 wedges — persuasive for physics judges, not cream-serif default.

---

## 8. Gaps / Risks for Pro Team

- **QSVM real kernel**: Fix `src/qml/train_qsvm.py` to use `SamplerV2` + `ComputeUncompute` correctly (see qiskit 1.0 migration). Currently RBF placeholder.
- **SHAP**: Backend `explain` returns `top_features` stub from `src/ml/evaluate.py` + note “run with src/ml/evaluate.py + shap plots” — need real SHAP values and plots in `results/`.
- **100-iter VQC + full diabetes**: 20-iter done; 100-iter heart + 50/100 diabetes pending heavy run (schedule on Anmol).
- **Comparison artifacts**: `results/comparison/` + `confusion_matrices/` empty — `hybrid_benchmark.py` writes markdown/json but not matrices.
- **Deployment**: No Render/Vercel URL yet, no Docker — needed for 10-15% marks.
- **PPT**: No `SIH2026-IDEA-Presentation-Format.pptx` yet — mandatory.
- **Git remote**: Repo not on GitHub (PAT lacks Admin write) — create manually, push, add branch protection + PR template + issues for 13 phases.
- **Detector hook**: `scripts/detect.mjs` bundled detector not found — skip or `npm install` detector.
- **Cline 429**: `glm-5.2:free` Decart shared pool rate-limited every 5s — use `z-ai/glm-5.2` (Cline gateway) or add own OpenRouter key at openrouter.ai/settings/integrations.
- **Test coverage**: No pytest yet, backend/frontend smoke done but no unit/integration/e2e suite.
- **Frontend CSS**: Single bundle `index-*.js` 233K, no separate CSS — okay but check purge.
- **Security**: No secret scanning, no auth on /predict — add for prod.

---

## 9. Team Handoff — Who Does What

- **You (lead)** — Solo-proof fallback until deadline; owner of push + PPT + deployed URL.
- **Musa** — Frontend collider polish, responsive QA, shimmer/displacement if image gen available.
- **Ashutosh** — Backend FastAPI + predictor + model_loader + /benchmark fidelity.
- **Anmol (heavy)** — Full 768 rows, 300 iter, image hybrid, QSVM real kernel on his PC.
- **Abdul** — Data raw/processed, data_dict.md, 48h box then fallback to `src/data/dataset.py`.
- **Mishti** — Notebooks 01-05 EDA → VQC, SHAP plots, docs.

---

## 10. Conversation Log (Condensed)

- Asked “what did we do so far?” → summarized SIH research + scaffold + checklist + MCCP fix: ✓ github connected when sourced.
- “opencode says github mcp failed” → showed ✓ via `source ~/.bashrc && opencode mcp list`, diagnosed 400 without source, told to reopen terminal or source.
- User shared `https://github.com/cline/cline` → asked to use Cline Kanban + glm 5.3 xhigh. Inspected `~/.cline/kanban/config.json` (claude), providers.json (glm-5.2:free xhigh), kanban 0.1.70 tasks.db agenda_tasks, found model `z-ai/glm-5.3:free` candidate, offered plan.
- User: fallback glm 5.3 xhigh free only + kilocode minimax m3 free → set `providers.json` to `z-ai/glm-5.3:free` xhigh, confirmed `kilo/minimax/minimax-m3:free` exists (7.5.6), then user said stay 5.2 xhigh + minimax m3 xhigh → reverted to 5.2:free xhigh, confirmed kilo ready `kilo run -m kilo/minimax/minimax-m3:free --variant xhigh`.
- “start” → tried Kanban tasks but “No git repository at /home/ace” → “Project not added to Kanban” → no `kanban project add`, inspected DB vs index.js, started `kanban --port 3484 --no-open` (pid 10540 live), Cline still 429 later.
- “i there anyway i can also see what going ??” → showed Kanban at 3484, scaffold `hybrid-qml-disease-detection/README.md`, dataset.py Heart 303×14 + Diabetes 768×9 fetched via `.venv` 3.12 uv pip, preprocess PCA8 81.9%/100% → classical 87%/70% → QML pnp.log fix → VQC heart 90.2% 51.9s + diabetes 70.1% 86.5s → QSVM path fix + fallback → benchmark_report.md honest + benchmark.json.
- “do you remember i want you to use cline kanban glm5.2 xhigh … if not working use cline cli only, also kilo minimax …” → set fallback, verified glm5.2 429 Decart (retry 5s), Kilo verified `pnp.log` + metrics + frontend dist, showed heart win.
- “remember to use cline and kilo” → launched Kilo prompt 3 steps ok, Cline 429 loop, then succeeded via `z-ai/glm-5.2` (no :free) summarizing benchmark.
- “you need to understand cline and kilo are also ai agents and their response takes time” → ack, plan no-timeout guided prompts.
- “no timeout; also guide them both through every step just write prompts” → wrote `/tmp/cline_prompt.txt` + `/tmp/kilo_prompt.txt`, Kilo 3 steps ok, Cline 429 again, retries.
- “do everything you can do right now … then show results” → todo: full VQC 100 heart+diabetes, backend test, frontend SHAP, docs, summary — started but aborted by next.
- “just fix the ui for now” → mobile stack fix hero-grid 1fr, beamline wrap, rebuilt 233K, recaptured mobile 179K (was 197K) detector full-width.
- “where is the location of the project?” → answered canonical + legacy.
- This handoff written to `HANDOFF.md` + sync to `/home/ace/AI/hybrid-qml-disease-detection/context.md` per AGENTS.md rule, plus `~/.config/opencode` sync.

---

## 11. Evidence Paths (Don’t Fabricate Beyond These)

- Real CSV: `data/raw/heart.csv`, `data/raw/diabetes.csv` (public).
- Real splits: `data/processed/split_*.npz` (train 242/614, test 61/154).
- Real models: `models/classical/*.pkl` + `models/preprocessing/*.pkl` + `models/quantum/vqc_*/*.npy+metrics.json`.
- Real metrics: `results/metrics/*.json` (8), `frontend/src/data/benchmark.json`, `docs/benchmark_report.md`.
- Real code: `src/qml/train_vqc.py:51` pnp.log, `src/qml/train_qsvm.py:19` DATA_PROCESSED, `src/qml/hybrid_benchmark.py:ROOT` fix, `frontend/src/App.jsx` collider world + contract comment, `frontend/dist/` 233K.
- Real logs: `/tmp/backend.log`, `/tmp/frontend.log`, `/tmp/kanban.log`, `/tmp/ccline.log`, `/tmp/ckilo.log`, `/tmp/brave.log`.
- Absences: no SHAP pngs, no deployed URL, no PPTX, no 100-iter final — list as synthetic/pending, don’t invent.

---

## 12. Next 48h for Pro Team

1. **Anmol heavy run:** 100-iter VQC both datasets, real QSVM kernel (SamplerV2), full 768 diabetes if needed — save to `models/quantum/` + update `results/metrics/`.
2. **SHAP:** `src/ml/evaluate.py` with `shap>=0.44` → top_features + plots → wire into `explain` payload (replace stub).
3. **Tests:** `pytest` unit (preprocess, loader) + `httpx` integration (TestClient) + Playwright e2e (fire 13/8 fields, assert LOW/HIGH).
4. **Deploy:** Dockerfile + `uvicorn` + Vite preview, push to Render (backend) + Vercel (frontend), set `VITE_API_URL`.
5. **PPT:** Fill `SIH2026-IDEA-Presentation-Format.pptx` structure (problem, solution, architecture, tech stack, results, impact, team) + embed benchmark table + detector screenshot + demo link.
6. **GitHub:** User creates empty repo at `https://github.com/new` (no README), then pro team `git remote add origin && push -u origin main`, add 13 issues from `docs/architecture.md`, PR template, branch protection on main, CODEOWNERS.
7. **Finish reviewer + DESIGN.md:** Run `impeccable-finish-reviewer` with `.impeccable/review/desktop.png + mobile.png` + contract, generate `DESIGN.md` + sidecar, `embed-prompt.mjs --scan`.

---

## 13. Contacts & Accounts

- **Cline:** `shauryas504@gmail.com` (`usr-01KS101G9ZEM6TP4FVAWAC8KND`), provider `cline` OAuth, `~/.cline/data/settings/providers.json`, `~/.cline/kanban/config.json` selectedAgentId `claude`.
- **Kilo:** `kilo 7.5.6` at `~/.local/bin/kilo` + `kilocode`, config `~/.config/kilo/kilo.jsonc` (bash allow), free models `kilo-auto/free` etc.
- **GitHub:** `aceshaurya` (public_repos 0), token stored `~/.bashrc:5` + `~/.zshrc:116`, `~/.config/opencode/opencode.jsonc` remote `https://api.githubcopilot.com/mcp/` `oauth false`.
- **Shared memory:** `/home/ace/AI/<project-name>/` per `~/AGENTS.md` + sync copy `~/AI/AGENTS.md`.

---

*End handoff. Keep this file in repo root and sync to `/home/ace/AI/hybrid-qml-disease-detection/context.md`. For repro, tail `/tmp/backend.log` + `/tmp/frontend.log` and open http://localhost:4173 + http://localhost:8000/health in Brave.*
