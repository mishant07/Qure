// ResultPanel — Two Tracks Side by Side: Classical | Quantum
// Contract: { ml_prediction, ml_probability, ml_model, qml_prediction, qml_probability, qml_model, risk, explain: {top_features, note}, dataset }
import { Sigma, Info, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

const RISK_STYLE = {
  HIGH: 'risk-high',
  MODERATE: 'risk-moderate',
  LOW: 'risk-low',
}

function ProbabilityBar({ label, sublabel, value, paradigm, leads }) {
  const pct = Math.round((value ?? 0) * 1000) / 10
  const isQuantum = paradigm === 'quantum'
  const barColor = isQuantum ? 'bg-quantum' : 'bg-classical'
  const trackColor = 'adaptive-text'
  const bgColor = isQuantum ? 'bg-quantum/10' : 'bg-classical/10'
  const borderColor = isQuantum ? 'border-quantum/30' : 'border-classical/30'

  return (
    <div className={cn('rounded-lg p-5 glass-panel border', borderColor, bgColor)}>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className={cn('text-caption-strong', trackColor)}>{label}</p>
          <p className={cn('text-fine-print mt-0.5', 'adaptive-muted')}>{sublabel}</p>
        </div>
        {leads && (
          <span className={cn('rounded-pill px-2 py-0.5 text-fine-print tabular', isQuantum ? 'bg-quantum/20 adaptive-text' : 'bg-classical/20 adaptive-text')}>
            leads
          </span>
        )}
      </div>
      <p className="text-display-md mt-3 font-medium tabular-display adaptive-text">{pct.toFixed(1)}%</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-pill bg-white/5">
        <div
          className={cn('h-full rounded-pill transition-[width] duration-700 ease-out', barColor)}
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
    <div aria-live="polite" className="animate-[result-reveal_0.4s_ease-out]">
      {/* Risk chip — top right of quantum track */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-fine-print adaptive-muted uppercase tracking-[0.1em]">
          Verdict — {datasetLabel ?? result.dataset}
        </p>
        <span className={cn('rounded-pill px-3 py-1 text-caption-strong tabular', RISK_STYLE[risk] ?? 'risk-low')}>
          {risk.toLowerCase()} risk
        </span>
      </div>

      {/* Side-by-side probability bars — Classical | Quantum */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ProbabilityBar
          label="Classical Track"
          sublabel={`${result.ml_model ?? 'best classical'} · predict_proba max`}
          value={c}
          paradigm="classical"
          leads={!quantumLeads}
        />
        <ProbabilityBar
          label="Quantum Track"
          sublabel={isRealVqc ? 'vqc_8qubit · simulated · 512 shots' : 'demo offset on classical output — VQC artifact not loaded'}
          value={q}
          paradigm="quantum"
          leads={quantumLeads}
        />
      </div>

      {/* Explain — top features in classical track style */}
      {result.explain?.top_features?.length > 0 && (
        <section className="mt-6" aria-label="Most influential features">
          <h3 className="text-body-strong flex items-center gap-2">
            <Sigma className="size-4 adaptive-text" aria-hidden="true" />
            Top signals — Classical PCA loadings
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.explain.top_features.map((name, i) => (
              <span key={name} className="rounded-pill bg-classical/10 border border-classical/20 px-3 py-1.5 text-caption adaptive-text">
                <span className="mr-1.5 text-fine-print tabular adaptive-text">#{i + 1}</span>
                {name}
              </span>
            ))}
          </div>
          <p className="text-fine-print mt-4 flex items-start gap-1.5 adaptive-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Feature ranking is heuristic — SHAP integration pending. Quantum verdict uses a calibrated demo offset.
          </p>
        </section>
      )}

      <p className="text-micro-legal mt-6 border-t border-hairline pt-4 adaptive-muted">
        Research demonstration on public UCI datasets. Not a medical device and not a substitute
        for professional diagnosis.
      </p>
    </div>
  )
}