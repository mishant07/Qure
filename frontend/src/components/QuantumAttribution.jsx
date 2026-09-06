// QuantumAttribution — XQAI panel: per-patient ablation map of the frozen VQC.
// Shows which raw features moved the quantum verdict most (weights sum to 100),
// whether each supported or opposed it, and the per-wire <Z> readout.
// Fetches POST /api/quantum-attribution; silent on failure (panel just omits).
import { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { quantumAttribution } from '../services/api'

const DIR_ICON = { supports: TrendingUp, opposes: TrendingDown, neutral: Minus }

const VERDICT_TEXT = { musa_diabetes: ['Non-Diabetic', 'Pre-Diabetic', 'Diabetic'] }

function verdictLabel(disease, pred) {
  const names = VERDICT_TEXT[disease]
  if (names && names[pred] !== undefined) return names[pred]
  return pred === 0 ? 'Lower-risk pattern' : 'Higher-risk pattern'
}

export default function QuantumAttribution({ dataset, features }) {
  const [map, setMap] = useState(null)

  useEffect(() => {
    if (!dataset || !features || Object.keys(features).length === 0) return
    let mounted = true
    quantumAttribution(dataset, features)
      .then((d) => { if (mounted) setMap(d) })
      .catch(() => {})
    return () => { mounted = false }
  }, [dataset, features])

  if (!map || !map.attributions?.length) return null
  const top = map.attributions.slice(0, 6)

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2">
        <span className="size-4 rounded-full bg-quantum" aria-hidden="true" />
        <h3 className="text-body-strong adaptive-text">Why quantum voted this way</h3>
        <span className="rounded-pill bg-quantum/15 border border-quantum/30 px-2.5 py-0.5 text-fine-print text-quantum ml-auto">
          Ablation map
        </span>
      </div>
      <p className="text-caption adaptive-muted mt-2">
        Quantum verdict: <span className="adaptive-text font-medium">{verdictLabel(dataset, map.qml_prediction)}</span>
        {' '}at <span className="adaptive-text tabular-display">{(map.qml_confidence * 100).toFixed(1)}%</span> confidence
      </p>

      <ul className="mt-4 space-y-3">
        {top.map((a) => {
          const Icon = DIR_ICON[a.direction] ?? Minus
          return (
            <li key={a.feature}>
              <div className="flex items-baseline gap-2 text-caption">
                <span className="adaptive-text font-medium">{a.label}</span>
                <span className="adaptive-muted text-fine-print tabular ml-auto">
                  {a.weight_pct.toFixed(1)}%
                </span>
                <Icon
                  className={`size-3.5 shrink-0 self-center ${a.direction === 'supports' ? 'text-quantum' : 'text-muted'}`}
                  aria-label={a.direction}
                />
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-quantum"
                  style={{ width: `${Math.max(a.weight_pct, 2)}%` }}
                />
              </div>
              <p className="sr-only">{a.label} weight {a.weight_pct} percent, {a.direction} the verdict</p>
            </li>
          )
        })}
      </ul>

      {map.qubit_readout?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {map.qubit_readout.map((z, i) => (
            <span key={i} className="rounded-pill border border-hairline px-2.5 py-1 text-fine-print adaptive-muted tabular">
              Q{i} ⟨Z⟩ {z > 0 ? '+' : ''}{z.toFixed(3)}
            </span>
          ))}
        </div>
      )}

      <p className="text-micro-legal mt-4 border-t border-hairline pt-3 adaptive-muted">
        {map.note}
      </p>
    </div>
  )
}
