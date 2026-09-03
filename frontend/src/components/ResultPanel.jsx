// Verdict panel — mapped 1:1 to the real FastAPI /predict response:
// { ml_prediction, ml_probability, ml_model, qml_prediction, qml_probability,
//   qml_model, risk: "HIGH|MODERATE|LOW", explain: {top_features, note}, dataset }
// Provenance labels stay honest: the "quantum" number is a demo offset unless
// qml_model === "vqc_8qubit", and we say so on screen.
import { Info, Sigma } from 'lucide-react'
import { cn } from '../lib/utils'

const RISK_CHIP = {
  HIGH: 'bg-[#c62828]/10 text-[#c62828]',
  MODERATE: 'bg-ink/10 text-ink',
  LOW: 'bg-primary/10 text-primary',
}

function ProbabilityBar({ label, sublabel, value, dark, leads }) {
  const pct = Math.round((value ?? 0) * 1000) / 10
  return (
    <div className={cn('rounded-lg p-5', dark ? 'bg-tile-1 text-white' : 'bg-parchment text-ink')}>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-caption-strong">{label}</p>
          <p className={cn('text-fine-print mt-0.5', dark ? 'text-body-muted' : 'text-ink-muted-48')}>{sublabel}</p>
        </div>
        {leads && (
          <span className={cn('rounded-pill px-2 py-0.5 text-fine-print', dark ? 'bg-white/15 text-white' : 'bg-ink/5 text-ink-muted-80')}>
            leads
          </span>
        )}
      </div>
      <p className="text-display-lg mt-3 font-semibold tabular-nums">{pct.toFixed(1)}%</p>
      <div className={cn('mt-3 h-1.5 w-full overflow-hidden rounded-pill', dark ? 'bg-white/15' : 'bg-black/10')}>
        <div
          className={cn('h-full rounded-pill transition-[width] duration-700', dark ? 'bg-primary-on-dark' : 'bg-primary')}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

export default function ResultPanel({ result, datasetLabel }) {
  const q = result.qml_probability
  const c = result.ml_probability
  const isRealVqc = result.qml_model === 'vqc_8qubit'
  const quantumLeads = (q ?? 0) >= (c ?? 0)
  const risk = (result.risk ?? '').toUpperCase()

  return (
    <div aria-live="polite">
      <p className="text-fine-print uppercase tracking-[0.12em] text-ink-muted-48">
        Verdict — {datasetLabel ?? result.dataset}
      </p>
      <h2 className="text-display-lg mt-2">
        <span className={cn('mr-3 inline-block rounded-pill px-3 py-1 align-middle text-caption-strong', RISK_CHIP[risk] ?? 'bg-black/5 text-ink')}>
          {risk.toLowerCase()} risk
        </span>
        indicated
      </h2>

      {/* side-by-side probabilities with honest provenance labels */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <ProbabilityBar
          label="Quantum track"
          sublabel={isRealVqc ? 'vqc_8qubit · simulated · 512 shots' : 'demo offset on classical output — VQC artifact not loaded'}
          value={q}
          dark
          leads={quantumLeads}
        />
        <ProbabilityBar
          label="Classical track"
          sublabel={`${result.ml_model ?? 'best classical'} · predict_proba max`}
          value={c}
          leads={!quantumLeads}
        />
      </div>

      {/* explain — top features from backend (heuristic, not SHAP) */}
      {result.explain?.top_features?.length > 0 && (
        <section className="mt-8" aria-label="Most influential features">
          <h3 className="text-body-strong flex items-center gap-1.5">
            <Sigma className="size-4 text-ink-muted-48" aria-hidden="true" /> Top signals considered
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.explain.top_features.map((name, i) => (
              <span key={name} className="rounded-pill bg-parchment px-3 py-1.5 text-caption text-ink ring-1 ring-divider-soft">
                <span className="mr-1.5 text-fine-print text-ink-muted-48">#{i + 1}</span>
                {name}
              </span>
            ))}
          </div>
          <p className="text-fine-print mt-4 flex items-start gap-1.5 text-ink-muted-48">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Feature ranking is heuristic in this build — SHAP integration is pending (see backend note).
          </p>
        </section>
      )}

      <p className="text-micro-legal mt-6 border-t border-hairline pt-4 text-ink-muted-48">
        Research demonstration on public UCI datasets — not a medical device and not a substitute
        for professional diagnosis.
      </p>
    </div>
  )
}