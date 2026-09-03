# Internal Hackathon — What to Demo (5 min pitch)

**Rule:** Judges read 30 PPTs in one sitting — clarity > jargon. Use official `.pptx` template, not your own.

## Pitch Flow (5 min)
1. **Hook (30s):** "PHC doctor misses 1 in 3 early heart cases due to imbalanced data — we built platform that compares classical vs quantum fairly"
2. **Problem (45s):** Show Heart vs Diabetes imbalance, need explainability
3. **Demo (2 min):** Live: Upload heart.csv → Train → Show classical 93% vs VQC 94% + SHAP top 3 features → Predict new patient (age 52, chol 168) → Risk HIGH
4. **Innovation (45s):** Table slide 7 — 2 quantum models, not 1; efficiency metrics
5. **Feasibility (30s):** 8 qubits sim, CPU-only, deployed URL, honest if classical wins
6. **Close (30s):** Dual disease proves scalability to PS's cancer/neuro

## Internal Filter Scoring (from last answers)
- Innovation 30% — show QSVM+VQC, not just VQC
- Feasibility 25% — explain 8 qubits, time-box, fallback
- Impact 25% — quantify recall + deployment
- Presentation 20% — live demo must work first try (pre-record backup video)

## Must-Have for SPOC Upload
- `SIH2026-IDEA-Presentation-Format.pptx` → PDF
- GitHub link (public)
- 2-min video (screen capture)
- Deployed URL (Render: backend, Vercel: frontend) — test before upload

## Common Reject Reasons to Avoid
- Plagiarized data, hardcoded demo, missing dict, leakage, no benchmark
