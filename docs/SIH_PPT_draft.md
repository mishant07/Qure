# SIH2026 PPT Draft — Maps to Official Template `SIH2026-IDEA-Presentation-Format.pptx`
# Fill this then paste into .pptx before SPOC upload

## Slide 1: Title + Team
- Title: Hybrid Quantum ML Platform for Early Disease Detection
- PS: SIH26139 | Org: Egreen Quanta | Theme: MedTech
- Team: you, Musa, Ashutosh, Anmol, Abdul, Mishti (Lead: you) — 6, 1 female (Mishti)
- Deployed URL: ___ (Render/Vercel) | GitHub: ___ | Video: ___

## Slide 2: Problem Understanding
- Classical ML struggles with high-dim noisy biomedical (genomics, imaging, EHR) — 54% & 65% imbalance → false negatives costly
- Current: single-model, no quantum, no explainability, no benchmark
- User persona: PHC doctor / ASHA with low-resource diagnostics

## Slide 3: Proposed Solution (Dual Demo)
- Heart (UCI 303×13) + Diabetes (768×8) tabular → same pipeline proves scalability to cancer/neuro per PS
- Classical 4 baselines vs Quantum 2 models (QSVM ZZ reps2 + VQC 8-qubit StronglyEntangling 2 layers) → honest comparison

## Slide 4: How It Works (Workflow)
```
Patient CSV/ Form → Imputer→Scaler→PCA8 (fit train only) → {Classical: SVM/RF/XGB} vs {QSVM, VQC AngleEmbedding} → Benchmark (Acc/Rec/F1/ROC + time/depth) → SHAP explain → Risk HIGH/MOD/LOW
```

## Slide 5: Architecture (3-Tier)
- Data: raw → processed → split stratified
- ML: Sklearn + XGB → QML: Qiskit Aer + PennyLane lightning.qubit (CPU sim)
- Platform: FastAPI (/predict, /benchmark) + React (Home/Input/Results/Benchmark) + Docker

## Slide 6: Tech Stack
- Qiskit 1.x Aer, Qiskit-ML QSVM, PennyLane+SPSA 8 qubits 512 shots, SMOTE, SHAP
- FastAPI, React+Vite+Recharts, MLflow, Docker — CPU-only, NISQ-compatible

## Slide 7: Innovation vs Competitors
| Feature | Ours | Classical-only | Prior SIH Health |
|---|---|---|---|
| QSVM+VQC | Yes (2 quantum) | No | VQC only |
| Explainability | SHAP + perm | No | No |
| Efficiency benchmark | Yes (time/depth) | Acc only | Acc only |
| Dual disease | Heart+Diabetes | Single | Single |
| Deployed URL | Yes | Often local | Mixed |

## Slide 8: Feasibility & Timeline
- 20 Sept feasible: scaffold Day1, modelling Anmol rig Days 4-11, platform Days13-17, PPT Days19-20 — solo-proof fallback
- 8 qubits → Aer sim 512 shots fits 12GB, no GPU needed
- Risk: VQC slower → fallback QSVM, honest report

## Slide 9: Impact & Benefits
- Sensitivity +2-4% on imbalanced (Tudisco) → fewer missed diagnoses; if classical wins, honest result shows scientific rigor — judge-valued
- Scalable to cancer (add dataset), interpretable for doctors, NISQ-ready, PHC-deployable via PWA

## Slide 10: Future + References
- Future: FHIR EHR, hybrid ResNet50→VQC for APTOS images (PMC 80.96%), federated learning, IBM hardware (8→12 qubits)
- Refs: PMC12765111, Nature Alzheimer 99.89%, Qiskit QSVM docs, Tudisco 2025

## Appendix: Benchmark Table (paste from docs/benchmark_report.md)
