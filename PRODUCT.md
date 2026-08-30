# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
delegated: React 18 + Vite 5 + FastAPI + PennyLane Lightning + Qiskit (current: frontend/package.json, backend/main.py). Choice delegated from user via SIH scaffold — preserves existing stack, no framework switch.

## Users
Primary: SIH judges (Hybrid QML Platform demo) — evaluate in 5-10 min: need instant clarity on quantum vs classical advantage, dual Heart (UCI 303×13) + Diabetes (Pima 768×8) proof, honest benchmark (time/depth/F1), explainability (SHAP), and deployed predict flow.

Secondary: Clinicians doing early screening and patients self-checking — need fast 13-field / 8-field input, LOW/HIGH risk with probability, and trustworthy explanation.

## Product Purpose
Hybrid Quantum ML platform for early disease detection (SIH26139, Egreen Quanta, MedTech). Runs VQC (8 qubits, StronglyEntanglingLayers, PennyLane Lightning) + classical baselines (LR/SVM/RF) on same test set, reports accuracy/F1/AUC + training time + circuit depth. Proves quantum assist on real tabular clinical data. Success = judges see VQC 90.2% heart (+3% vs classical) honestly reported, diabetes 70% classical win, with instant predict demo.

## Positioning
Mechanism competitors cannot copy: same-split hybrid benchmark (classical + VQC 8q + QSVM fallback) with CPU-only sim (fits 12GB, no CUDA), PCA 8 → 8 qubits, SMOTE, and SHAP explanations — demoed as dual-disease app (heart + diabetes) with FastAPI backend serving both models and React frontend switching datasets in one UI.

## Operating Context
Workflow: fetch Heart + Diabetes CSVs → preprocess (impute/median, scaler, PCA 8, fit on train only) → split + SMOTE → train 3 classical + VQC 20-100 iter → benchmark_report.md + benchmark.json → FastAPI /health /benchmark /predict → React App.jsx (dataset switch, dynamic fields, result card, benchmark panel) → docs + deployed URL. Evaluation in browser, live predict POST.

## Capabilities and Constraints
Confirmed: dual datasets, 8 qubits max (680M iGPU), CPU PennyLane Lightning, Qiskit 1.0 fallback, FastAPI CORS, Vite preview on :4173, backend on :8000.
Constraints: 12GB RAM, Python 3.12 venv, no CUDA/ROCm, qiskit_sampler API mismatch (QSVM fallback to RBF placeholder), free-tier LLM (GLM 5.2, Minimax M3).
Undecided: final 100-iter VQC vs 20-iter demo, SHAP deep integration, deployment host (Render/Vercel placeholder).
Terminology: VQC = Variational Quantum Classifier, QSVM = Quantum SVM, PCA 8 = 8-qubit mapping.

## Brand Commitments
Name: SIH26139 Hybrid QML Platform (SIH26139). Visual commitments: none pinned — redesign to reimagine flows (user chose Reimagine: new onboarding, empty states, SHAP visuals while preserving 13+8 fields and Predict/Benchmark function).

## Evidence on Hand
Real: data/raw/heart.csv (303), diabetes.csv (768); models/preprocessing/*, models/classical/*.pkl, models/quantum/vqc_*/params.npy; results/metrics/* (VQC heart 0.902 F1 0.897, classical 0.869); docs/benchmark_report.md, frontend/src/data/benchmark.json; frontend/dist/ built; backend/main.py FastAPI with 3 endpoints. Absences: no real SHAP plots, no deployed URL, no official PPT — must not fabricate benchmarks or patients.

## Product Principles
1. Honest benchmark — report wins and losses (Heart VQC +3%, Diabetes classical +2.6%) without forcing quantum victory.
2. Judges' 30-second clarity — first viewport proves mechanism (quantum vs classical table + live predict).
3. CPU-realistic quantum — 8 qubits, depth 32, 50-90s training, runs on laptop without GPU.
4. Explainable risk — every prediction carries probability + top features, not black-box label.
5. One UI, two diseases — single switch demonstrates scalability to cancer/neuro per PS.

## Accessibility & Inclusion
Web standard: keyboard-navigable forms (13 heart + 8 diabetes fields), screen-reader labels, color-blind-safe risk indicators (not color alone), mobile viewport (Hyprland + Brave test).
