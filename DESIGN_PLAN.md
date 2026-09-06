# DESIGN PLAN — Hybrid Quantum Disease Detection (IMPLEMENTED)

## Subject & Audience
**What**: Research demonstration — classical ML vs 8-qubit VQC on 5 UCI clinical datasets
**Who**: SIH 2026 judges, med-tech researchers, quantum-curious developers
**Primary job**: Show the dual-pipeline honestly; let users run a vector and see two verdicts

---

## 1. COLOR — "Interference Palette" ✅ IMPLEMENTED

Core principle: The palette IS the quantum/classical duality. Not decoration — encoding.

| Token | Hex | Role | Status |
|-------|-----|------|--------|
| `--void` | #030307 | Base canvas | ✅ |
| `--ink` | #F5F5F7 | Primary text | ✅ |
| `--muted` | #8E8E9A | Secondary text | ✅ |
| `--classical` | #1D1D1F | Classical track | ✅ |
| `--quantum` | #00D4AA | Quantum track | ✅ |
| `--quantum-dim` | #00A388 | Quantum hover/active | ✅ |
| `--warn` | #FF6B35 | HIGH risk | ✅ |
| `--caution` | #FFB800 | MODERATE risk | ✅ |
| `--safe` | #1ED760 | LOW risk | ✅ |
| `--glass` | rgba(255,255,255,0.04) | Glass panels | ✅ |
| `--glass-strong` | rgba(255,255,255,0.07) | Elevated glass | ✅ |
| `--hairline` | rgba(255,255,255,0.06) | Dividers | ✅ |
| `--ring` | rgba(0,212,170,0.35) | Focus ring | ✅ |

**NO defaults used**: warm cream, terracotta, acid green, broadsheet hairlines, SaaS grey cards, ALL-CAPS eyebrows, middle-dot meta, spaced em-dashes, monospace data labels, gradient washes.

---

## 2. TYPE — "Computational Clarity" ✅ IMPLEMENTED

| Role | Font | Weight/Style | Scale | Status |
|------|------|--------------|-------|--------|
| Display/Headline | Geist Pixel Circle | 400 | `clamp(2.5rem, 7vw, 5.5rem)` / 1.02 / -0.03em | ✅ |
| UI Label/Tab/Button | Geist Pixel Circle | 400 | 0.75rem / 1.0 / +0.05em tracking | ✅ |
| Body/Long-form | Inter | 300/400/500 | 1rem / 1.6 / -0.01em | ✅ |
| Caption/Fine print | Inter | 400/500 | 0.75rem / 1.4 / -0.005em | ✅ |
| Numbers/Metrics | Inter | 500/600 | tabular-nums | ✅ |

**Why Geist Pixel Circle**: Computational bitmap face = quantum circuit vernacular. Not "tech aesthetic" — it's *the* aesthetic of the domain.

---

## 3. LAYOUT — "Two Tracks" ✅ IMPLEMENTED

```
┌─────────────────────────────────────────────────────────────┐
│  HERO: "Hybrid Quantum" (classical) | "Disease Detection" (quantum)  │
│         [split by color, interference entrance]             │
├─────────────────────────────────────────────────────────────┤
│  DETECT PAGE                                                │
│  ┌────────────────────┬──────────────────────────────────┐  │
│  │ CLASSICAL TRACK    │ QUANTUM TRACK                    │  │
│  │ (form input)       │ (result + explanation)           │  │
│  │                    │                                  │  │
│  │ Segmented dataset  │ Risk chip (top right)            │  │
│  │ Field grid/accordion│ Two probability bars           │  │
│  │                    │ Top features (classical chips)   │  │
│  │ [Run a vector]     │ How quantum works (4 steps)      │  │
│  └────────────────────┴──────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  BENCHMARK: Honest Scoreboard                              │
│  [3 stat cards] [F1 chart: charcoal/teal] [ROC-AUC chart]  │
│  [Honesty table: winner badge = paradigm color]            │
└─────────────────────────────────────────────────────────────┘
```

Alignment: Left for forms/tables, centered for hero/stats. 8px base unit.

---

## 4. PRINCIPLES — "Honest by Design" ✅ IMPLEMENTED

1. **Duality is structural** — Two-track layout IS the architecture
2. **Color encodes paradigm** — Classical=charcoal, Quantum=teal
3. **Numbers are the hero** — Large, tabular, prominent
4. **Honesty visible** — Computed winner badges, demo offset labeled
5. **Glass is substrate** — Panels separate tracks over video void
6. **One interference motion** — Page-load wave; no hover transitions
7. **Clinical precision in copy** — "Run a vector", "13–30 features"

---

## 5. COMPONENT IMPLEMENTATION STATUS

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| `tokens.css` | Generic dark | Interference palette + animations | ✅ |
| `theme.css` | Generic Tailwind | Paradigm tokens, type scale | ✅ |
| `Landing.jsx` | VideoHero + stats grid | Split headline, inline stats, single CTA | ✅ |
| `Detect.jsx` | Form + side rail | Two-track: Classical form \| Quantum result | ✅ |
| `ResultPanel.jsx` | Stacked bars | Two-column paradigm bars | ✅ |
| `PredictForm.jsx` | Pill tabs + sticky bar | Segmented control (classical) + quantum primary | ✅ |
| `Benchmark.jsx` | Generic charts + table | Paradigm colors, honesty badges | ✅ |
| `Footer.jsx` | 4-col links | Minimal, teal disclaimer | ✅ |
| `ErrorState.jsx` | Generic | Paradigm-aware (warn bg, quantum action) | ✅ |
| `ui/button.jsx` | Multiple variants | Quantum primary, classical secondary, outline | ✅ |
| `ui/input.jsx` | White/10 bg | Void bg, quantum focus ring | ✅ |
| `ui/label.jsx` | Standard | Clean | ✅ |
| `ui/accordion.jsx` | Border-b | Border, rounded, quantum chevron | ✅ |
| `ui/skeleton.jsx` | Black/0.06 | White/10 pulse | ✅ |

---

## 6. MOTION — "One Interference" ✅ IMPLEMENTED

- Page-load: split headline enters from opposite sides with wave skew (0.9s cubic-bezier)
- Result reveal: fade + slide up (0.4s ease-out)
- Accordion: Radix defaults (200ms)
- Focus: quantum teal ring
- Respects `prefers-reduced-motion`

---

## 7. VERIFICATION RESULTS

| Test | Result |
|------|--------|
| Browser e2e (Playwright + Brave) | **7/7 pass, 0 console errors** |
| API integration (8 datasets) | **8/8 OK** |
| Frontend build | Success |
| Backend stderr | Only 7 one-time InconsistentVersionWarning |

---

## 8. SELF-CRITIQUE — Defaults Avoided

| Default Pattern | Avoided? | Replacement |
|----------------|----------|-------------|
| Warm cream + terracotta | ✅ | Void + interference palette |
| Acid green on black | ✅ | Teal on void — domain-specific |
| Broadsheet hairlines | ✅ | Glass panels with purpose |
| SaaS card grid | ✅ | Two-track structural layout |
| ALL-CAPS eyebrows | ✅ | None — sentence case |
| Middle-dot meta strings | ✅ | None |
| Spaced em-dash labels | ✅ | None |
| Monospace data labels | ✅ | Geist Pixel Circle for UI labels |
| Gradient washes | ✅ | Solid paradigm colors |
| Hover transitions on cards | ✅ | None — only focus/interaction |

---

## 9. RUN INSTRUCTIONS

```bash
cd /home/ace/Projects/hybrid-qml-disease-detection
./scripts/dev.sh --rebuild     # first time, or after code changes
# open http://localhost:4173  (UI) and http://localhost:8000/docs (API)
./scripts/stop.sh             # tear down
```
