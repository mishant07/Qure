# Frontend implementation status — 2026-09-04

Built per `/home/ace/AI/hybrid-qml-disease-detection/frontend-plan.md` + `DESIGN.md`. All phases done and verified.

## Run it
```bash
# backend (repo root, venv):
.venv/bin/uvicorn backend.main:app --port 8000
# frontend:
cd frontend && npm run dev     # http://localhost:5173  (proxy: /predict|/benchmark|/health → :8000)
# visual check (writes /tmp/shots, requires backend up for results):
node scripts/verify.mjs
```

## What exists
- **Design system**: `src/styles/theme.css` — DESIGN.md tokens 1:1 in Tailwind v4 `@theme`; Inter variable self-hosted (`public/fonts/`); reduced-motion kills all animation; 24px WCAG targets.
- **Primitives** (`src/components/ui/`): Button (pill), Tabs, Accordion, Label, Input, Skeleton — shadcn-style on Radix.
- **Landing** (`routes/Landing.jsx`): typography hero → 16-frame sticky scroll story (`ScrollStory.jsx` + `data/story-frames.js`, rAF crossfade, static grid fallback under reduced-motion) → two-track how-it-works → recharts benchmark with **computed honest scoreboard** (3/5 quantum wins from `data/benchmark.json`) → trust strip → Apple-dense footer. Nav: black global 44px + frosted parchment sub-nav 52px.
- **Detect** (`routes/Detect.jsx` + `PredictForm.jsx` + `ResultPanel.jsx`): 5 dataset pills, presets ("Fill typical values" = `ex` values), 30-field WDBC in accordions (mean/se/worst), sticky submit, "N values still needed" counter. Result panel maps the REAL backend payload (`risk`, `ml_*`, `qml_*`, `explain.top_features`) with honest provenance labels (demo-offset disclosure). Skeletons, sonner errors, empty state, a11y live-region.
- **Story frames**: `public/story/final/frame-01..16.jpg` generated via Pollinations flux fallback (runcomfy out of credits, HTTP 400 "Insufficient Funds"). Prompts/seeds reproducible in `scripts/gen_frames.py` (current version targets Pollinations; runcomfy variant in git history).

## Verified
- `npm run build` clean (chunked: index 126 KB, ui 211 KB, charts 372 KB gzip ≈ 43/66/103).
- Playwright E2E (`scripts/verify.mjs`): zero console errors; real /predict round-trips on breast + heart (risk chip, dual prob bars, top signals all render); desktop + 390px mobile screenshots reviewed.

## Known gaps / next
- VQC artifacts aren't loaded by backend yet → quantum number is the documented demo offset (UI discloses this; flips automatically when `vqc_8qubit` inference is real).
- `explain.top_features` is heuristic (first-3); SHAP pending on backend.
- GitHub link in nav is a placeholder — point at the real repo.
- runcomfy frames optional upgrade, see pointer in `/home/ace/AI/hybrid-qml-disease-detection/context.md`.
