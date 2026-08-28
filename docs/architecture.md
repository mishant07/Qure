# SIH26139 — Merged Execution Checklist — Heart + Diabetes Dual Demo
## Hybrid Quantum ML Platform for Early Disease Detection (Egreen Quanta)
**Team:** you (lead, solo-heavy), Musa, Ashutosh, Anmol (heavy compute), Abdul, Mishti | **Deadline:** 20 Sept 2026 | **Source Plan:** `/home/ace/Downloads/SIH26139_Hybrid_QML_Disease_Detection_Project_Plan.md:1-1285` + PS `SIH26139.md:1-34`
**Workstation:** Anmol’s PC for training / heavy QML; your AMD 680M for dev/frontend. CPU-only sim (4-8 qubits).

---

## 0. Critical Fixes Applied (Why Merged > Team Plan Alone)

| Fix | Team Plan Gap | Merged Solution |
|-----|---------------|-----------------|
| **QSVM + VQC** | VQC-only `md:632-662` | Add QSVM (Qiskit) — QSVM beats VQC on imbalanced tabular per Tudisco 2025; shows breadth |
| **Explainability** | None | SHAP + quantum-gradient importance — PS mandates it |
| **Benchmark efficiency** | Accuracy only `md:682` | + Training time, circuit depth, generalization gap — PS objective |
| **Deployed URL** | Local on Anmol’s PC `md:944` | Docker → Render/Vercel URL — 10-15% completeness marks |
| **SIH PPT** | No template | Official `SIH2026-IDEA-Presentation-Format.pptx` structure — mandatory −10 if missed |
| **Solo-proof workflow** | 24 linear phases, Shaurya ghost | Time-box Abdul/Mishti to 48h, you have fallback datasets, early integration |

---

## 1. Locked Scope — Heart + Diabetes (Dual Demo)

**Why these two:** Both public/open, tabular (CPU-friendly, no GPU), high-dim vs imbalanced → perfect quantum advantage story. Matches PS examples (cardiovascular + metabolic).
- **Primary:** **Heart Disease — UCI Cleveland** (303 rows, 13 features, target 0-4 → binarized 0/1, 54% imbalance) — https://archive.ics.uci.edu/dataset/45/heart+disease
- **Secondary:** **Pima Indians Diabetes** (768 rows, 8 features, target 0/1, 65% imbalance) — https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database
- **Stretch (only if ahead):** APTOS 2019 DR images (3662) via ResNet50→VQC hybrid (PMC12765111: 80.96% bal acc with 8-qubit VQC). Not required for MVP.

**Fallback rule:** If Abdul not done in 48h, you use these two — no waiting.

**Data Dictionary (shared for frontend):**
```
Heart: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal → target
Diabetes: Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigree, Age → target
```

---

## 2. Repo Scaffold (Do Day 1)

**Location:** `~/Projects/SIH26139/` (or `~/SIH26139/` if you prefer) — scaffolded below.

```
SIH26139/
├── data/
│   ├── raw/                 # downloaded csv
│   ├── processed/           # cleaned
│   ├── heart_processed.npz
│   ├── diabetes_processed.npz
│   └── data_dict.md         # Abdul+Mishti deliverable
├── ml/                      # classical
│   ├── train_classical.py
│   └── eval_classical.py
├── qml/                     # quantum
│   ├── train_qsvm.py        # QSVM (Qiskit)
│   ├── train_vqc.py         # VQC (PennyLane)
│   ├── encoding.py          # angle encoding
│   └── hybrid_benchmark.py  # compare
├── backend/
│   ├── app.py               # FastAPI
│   ├── preprocessing.py     # loaded scaler+pca (same pipeline)
│   └── models/              # saved .pkl
│       ├── scaler_heart.pkl
│       ├── pca_heart.pkl
│       ├── svm_heart.pkl
│       ├── qsvm_heart.pkl
│       └── vqc_heart/
├── frontend/                # React + Vite
│   ├── src/pages/Home, Input, Results, Benchmark
│   └── src/components/ConfusionMatrix, ROC, SHAP
├── notebooks/
│   ├── 01_eda.ipynb
│   ├── 02_classical.ipynb
│   └── 03_qml.ipynb
├── models/                  # legacy symlink to backend/models
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── README.md
└── docs/
    ├── SIH26139_PPT_draft.md  # maps to official template
    └── benchmark_report.md
```

---

## 3. Phase Checklist — Solo-Proof Timeline (23 Days)

### PHASE 0: Repo & Env (Day 1 — You + Anmol, 4h)
- [ ] `git init`, push to GitHub `SIH26139`, branch `main`, `dev`
- [ ] `requirements.txt` (see §7) — `pip install` on both rigs
- [ ] Verify Qiskit Aer + PennyLane lightning.qubit import on Anmol’s PC
- [ ] Create empty scaffold dirs above
- **Owner:** You | **Heavy:** Anmol env verification | **Done when:** `import qiskit; import pennylane` succeeds on both

### PHASE 1: Dataset Lock (Days 1-2 — Abdul + Mishti, time-boxed 48h)
- [ ] Abdul: Fill comparison table (samples, features, target, missing, imbalance, license) for Heart + Diabetes + 1 alt (e.g., Prostate) — `md:123-136`
- [ ] Mishti: Inspect raw CSV head, dtypes, missing counts
- [ ] Deliverable: `data/data_dict.md` + `data/raw/heart.csv, diabetes.csv`
- [ ] **Fallback:** If not done by EOD Day2, you download UCI Heart + Kaggle Diabetes directly and proceed (no block)
- **Owner:** Abdul/Mishti | **Reviewer:** You | **Done:** `data_dict.md` committed

### PHASE 2: Cleaning & Understanding (Days 2-3 — Mishti, 6h)
- [ ] Remove irrelevant cols (none in these datasets, but document)
- [ ] Handle missing: Heart `ca, thal` have `?` → `SimpleImputer(median)`; Diabetes zeros in Glucose/BP/BMI/Insulin → treat as NaN → median
- [ ] Categoricals: Heart `sex, cp, fbs, restecg, exang, slope, ca, thal` → OneHot/ordinal as per dict
- [ ] Duplicates/infeasible: check negative age, etc. `md:268-276`
- [ ] Output: `data/processed/clean_heart.csv, clean_diabetes.csv` + cleaning log in notebook
- **Owner:** Mishti | **Helper:** You review PR

### PHASE 3: Split BEFORE Preprocess (Day 3 — Mishti + You, 1h)
- [ ] `train_test_split(test_size=0.2, stratify=y, random_state=42)` for each dataset `md:296-304`
- [ ] Also create `StratifiedKFold(n_splits=5)` for CV — team plan missed this
- [ ] Save indices to `data/processed/split_*.npz` — ensures same test set for ml/qml `md:306-313`
- **Critical:** No fitting before split — prevents leakage `md:1225-1229`

### PHASE 4: Preprocessing + PCA (Days 3-4 — Mishti + QML team, 4h)
- [ ] Fit on train only: `SimpleImputer → StandardScaler (for VQC) / MinMax (for QSVM branch) → PCA(n_components=8)`
- [ ] Why 8: 8 qubits = simulator-friendly, retains ~95% variance (test with `explained_variance_ratio_`), matches PMC 8-qubit hybrid
- [ ] Save `scaler.pkl, pca.pkl` to `backend/models/` — for inference reuse `md:732-751`
- [ ] Transform train/test → `X_train_pca8, X_test_pca8` — document in `notebooks/02_classical.ipynb`
- **Owner:** Mishti + Musa | **Verify:** `pca.explained_variance_ratio_.sum() >0.90`

### PHASE 5: Classical Baselines (Days 4-6 — Musa + Ashutosh, 8h)
- [ ] Train on `X_train_pca8`: LogisticRegression, SVM(RBF), RandomForest, XGBoost `md:460-503`
- [ ] 5-fold CV + test set eval: Accuracy, Precision, Recall/Sensitivity, F1, ROC-AUC, confusion matrix `md:520-528`
- [ ] **Add SMOTE** on train fold (your team missed — crucial for 65% diabetic imbalance)
- [ ] Log to MLflow: `ml/train_classical.py --dataset heart --smote`
- [ ] Select best per F1+Recall (not accuracy) `md:539-561` — medial: recall > accuracy
- [ ] Save best `svm_heart.pkl, rf_diabetes.pkl` etc.
- **Owner:** Musa + Ashutosh | **Done:** `ml/best_classical.json` with metrics table

### PHASE 6: QML — VQC + QSVM (Days 6-11 — Musa + Ashutosh on Anmol’s rig, 16h)
- [ ] **Encoding:** Angle encoding `x → RY(x)` (simple, 1 feature per qubit) — document why not amplitude (needs norm1)
- [ ] **VQC (PennyLane):** `8 qubits, AngleEmbedding + StronglyEntanglingLayers (2 layers, ring entanglement) + measurement` — optimizer `SPSA` (fast) or COBYLA, shots 512, max iter 100 (CPU-friendly)
- [ ] **QSVM (Qiskit):** `ZZFeatureMap(feature_dimension=8, reps=2) + QuantumKernel + SVC` — reps=2 is default winner
- [ ] Train both on **same `X_train_pca8`**, eval on **same `X_test_pca8`** `md:668-688` — critical for honest comparison
- [ ] Record: accuracy, recall, F1, **training time (s), circuit depth, generalization gap (train-test diff)**
- [ ] Save to `backend/models/vqc_heart/ , qsvm_heart.pkl`
- [ ] **Do not force win:** `md:1070-1086` — if classical wins, report honestly with “dataset too small for quantum advantage”
- **Owner:** Musa/Ashutosh | **Heavy:** Anmol’s PC | **Deliverable:** `qml/results_table.csv` :
  ```
  Model, Accuracy, Precision, Recall, F1, ROC-AUC, TrainTime(s), Depth
  SVM,, , , , , ,
  VQC,, , , , , ,
  QSVM,, , , , , ,
  ```

### PHASE 7: Benchmark + Explainability (Days 11-13 — You + Musa, 6h)
- [ ] Auto-generate `docs/benchmark_report.md` + `frontend/src/data/benchmark.json` via `qml/hybrid_benchmark.py`
- [ ] SHAP for best classical: `shap.TreeExplainer` → bar plot
- [ ] Quantum importance: permute each PCA feature → Δaccuracy (simple, judge-understandable)
- [ ] Statistical test: paired t-test on CV folds — add p-value to table
- **Owner:** You | **Done:** Report committed, frontend can fetch it

### PHASE 8: Backend (Days 13-16 — Anmol, 10h)
- [ ] FastAPI `backend/app.py`:
  - `POST /predict` { dataset: "heart"|"diabetes", age, sex, cp, ... OR glucose, bmi ... } → validates `md:789-805`, applies **same saved scaler/pca** `md:811-830`, runs **ml + qml**, returns `md:839-845`:
    ```json
    { "ml_prediction": 1, "ml_prob": 0.81, "qml_prediction": 1, "qml_prob": 0.78, "risk": "HIGH", "benchmark": {...}, "explain": {"top_features": ["oldpeak","thal"]} }
    ```
  - `GET /benchmark`, `GET /health`, `POST /train` (optional, for demo retrain)
  - Input validation: negative age, missing field → 422 `md:996-1011`
  - Load models on startup, not per request
- [ ] `backend/preprocessing.py` wraps `scaler.transform` → `pca.transform`
- [ ] Test with `curl` + `pytest` for `md:996-1021` cases
- **Owner:** Anmol | **Reviewer:** You | **Done:** `uvicorn backend.app:app --reload` responds

### PHASE 9: Frontend (Days 13-17 — Ashutosh or You if solo, 10h)
- [ ] Vite + React + Tailwind — keep `md:856-906` 3 pages:
  - **Home:** Hero + Start Analysis (choose Heart/Diabetes)
  - **Input:** Form auto-generated from `data_dict.md` (not hardcoded) — `md:866-876`
  - **Results:** `ml 81% | qml 78% | Risk HIGH` + confusion matrix + ROC + SHAP bar + benchmark comparison table
- [ ] Env: `VITE_API_URL=http://localhost:8000` (prod → Render URL)
- [ ] Components: `AccuracyChart, ConfusionMatrix, FeatureInfo`
- **Owner:** Ashutosh (if unavailable, you do minimal UI — use shadcn template)
- **Done:** `npm run dev` shows flow

### PHASE 10: Integration (Days 17-18 — You + Anmol, 4h)
- [ ] `md:910-936` Frontend → JSON → Backend → ml+qml → Results loop
- [ ] Early integration — not last day `md:944-965`
- [ ] Anmol pulls `main`, runs `docker-compose up` → full stack locally
- [ ] Fix CORS, env vars

### PHASE 11: Testing (Days 18-19 — Everyone, 4h)
- [ ] Test matrix `md:993-1021`: Normal, Missing field, Invalid (negative age), Multiple patients rapid, Server restart (models load)
- [ ] Record screen capture for PPT video
- **Owner:** You lead, all run checks

### PHASE 12: PPT + Docs + Deploy (Days 19-20 — You, 8h)
- [ ] **Official PPT:** `SIH2026-IDEA-Presentation-Format.pptx` 10 slides:
    1 Title+Team 2 PS Understanding 3 Proposed Solution (dual Heart/Diabetes) 4 How Works (diagram `md:45-63`) 5 Architecture (3-tier) 6 Tech Stack (§7) 7 Innovation vs 3 competitors (classical only = competitor) 8 Implementation+Feasibility (timeline, Anmol’s rig, 8 qubits) 9 Impact (sensitivity ↑, honesty) 10 Future (PHC deployment, FHIR) + References
- [ ] Export to PDF, record 2-min demo video (upload → predict → benchmark)
- [ ] **Deploy:** `Dockerfile` backend → Render, frontend → Vercel, add URLs to PPT + README
- [ ] Docs: `README.md` with setup, `docs/data_dict.md`, `benchmark_report.md`
- **Owner:** You | **Done:** PPT + URLs ready for SPOC upload before 20 Sept 23:59

### PHASE 13: SPOC Submission (Day 20 — You)
- [ ] Team lead (you) register via SPOC, submit idea with PPT + GitHub link + video + deployed URL
- [ ] Submit 2 ideas max (Heart and Diabetes as separate entry if allowed, else combined)
- **Done:** Submission confirmation screenshot

---

## 4. File-Level Tasks (for Anmol’s heavy run)

```bash
# On Anmol’s PC
pip install -r requirements.txt
python ml/train_classical.py --dataset heart --pca 8 --smote --cv 5
python ml/train_classical.py --dataset diabetes --pca 8 --smote --cv 5
python qml/train_vqc.py --dataset heart --qubits 8 --shots 512 --iter 100
python qml/train_qsvm.py --dataset heart --qubits 8 --reps 2
python qml/hybrid_benchmark.py --out docs/benchmark_report.md
uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

---

## 5. Team RACI (Fixed Solo-Heavy)

| Task | R | A | C | I | Note |
|------|---|---|---|---|------|
| Dataset research | Abdul | You | Mishti | — | 48h box, fallback to Heart/Diabetes |
| Cleaning | Mishti | You | Abdul | — | You review PR |
| Preprocess/PCA | Mishti+Musa | You | — | — | Fit only on train |
| Classical | Musa+Ashutosh | You | — | Anmol | On Anmol if needed |
| QML | Musa+Ashutosh | You | — | Anmol | Must use Anmol’s CPU |
| Backend | Anmol | You | Musa | — | You define API schema `md:789-845` |
| Frontend | Ashutosh | You | Anmol | Mishti | You fallback if Ashutosh busy |
| Integration/Deploy/PPT | You | You | All | — | Solo critical path |
| Testing | All | You | — | — | `md:969-1021` |

**Shaurya = Ashutosh** (fixed) — update `md:171` row: Ashutosh `frontend/` + `qml/`

---

## 6. What Counts as Done (Checklist for Demo)

```
✓ Selected Heart + Diabetes + justified (imbalance + license) md:1245
✓ data_dict.md + cleaned CSVs
✓ Reproducible pipeline (scaler/pca fitted on train only) md:1225-1229
✓ Train/test split stratified md:296-304 + same test for all md:668
✓ Classical models (LR,SVM,RF,XGB) + VQC + QSVM + Saved md:732-751
✓ Metrics: Acc/Prec/Rec/F1/ROC + time/depth + confusion md:520-528,682
✓ Comparison table honesty md:1070 (even if classical wins)
✓ Backend /predict validates + uses saved pipeline md:789-830
✓ Frontend 3 pages (Home/Input/Results) md:854-906 + benchmark chart
✓ Integration on Anmol + deployed URL (Render/Vercel)
✓ Tests: normal/missing/invalid/multiple/restart md:993-1021
✓ GitHub + README + PPT (official template) + video
```

---

## 7. Tech Stack (CPU-Friendly)

```
# Data
Python 3.11, Pandas, NumPy, scikit-learn, imbalanced-learn, joblib
# Classical
scikit-learn (LR/SVM/RF), xgboost
# QML (simulators only, no quantum hardware)
qiskit==1.*, qiskit-aer, qiskit-machine-learning, pennylane, pennylane-lightning
# Explainability
shap, lime
# Backend
fastapi, uvicorn, pydantic, mlflow
# Frontend
React + Vite + Tailwind + Recharts, axios
# Infra
Docker, docker-compose, python-dotenv
```

**Qiskit vs PennyLane:** Use both (Qiskit for QSVM kernel, PennyLane for VQC). Both CPU.

---

## 8. Risks & Solo Mitigations

- **Abdul/Mishti delay →** You have Heart/Diabetes URLs ready Day1; don’t wait.
- **QML slow on 680M →** 512 shots, 8 qubits, SPSA, 100 iter. Anmol’s rig does heavy loops.
- **VQC underperforms →** Keep QSVM as backup quantum story; report honestly.
- **Ashutosh frontend blocked →** Use minimal template you can finish solo (single Input page suffices).
- **Integration last-minute →** Start API contract Day13, not Day17.

---

## 9. Next Commands (After Approval)

```bash
mkdir -p ~/Projects/SIH26139
# scaffold will be created by build task
```

---

**Core Pitch Retained:** `md:1274-1285` — *We take public medical data, preprocess+PCA, train classical+quantum, evaluate on same test, integrate into dashboard with comparative prediction* — dual Heart+Diabetes proves platform scalability, not single-dataset hack.

Ready to scaffold repo to `~/Projects/SIH26139/`?

