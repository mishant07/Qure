// Processing — Timeline/stepper showing the inference pipeline
// Per SIH 26139 guide:
//   "DATA VALIDATION → PREPROCESSING → CLASSICAL ML → QUANTUM ML →
//    CROSS-MODEL COMPARISON → GENERATING SCREENING SUMMARY…"
import { Check, Loader2 } from 'lucide-react'

const STEPS = [
  { id: 'validate', label: 'Data validation' },
  { id: 'preprocess', label: 'Preprocessing' },
  { id: 'classical', label: 'Classical ML' },
  { id: 'quantum', label: 'Quantum ML' },
  { id: 'compare', label: 'Cross-model comparison' },
  { id: 'summary', label: 'Generating summary' },
]

export default function Processing({ currentStep = 'validate', completed = new Set() }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className="glass-panel p-6">
      <p className="text-caption-strong text-quantum tracking-[0.05em] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        Processing pipeline
      </p>
      <ol className="space-y-3">
        {STEPS.map((s, i) => {
          const isDone = completed.has(s.id) || i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <li key={s.id} className="flex items-center gap-3">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-caption-strong tabular shrink-0 ${
                  isDone
                    ? 'bg-quantum text-void'
                    : isCurrent
                    ? 'bg-classical text-quantum'
                    : 'bg-glass border border-hairline text-muted'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
                aria-hidden="true"
              >
                {isDone ? <Check className="size-4" /> : isCurrent ? <Loader2 className="size-4 animate-spin" /> : i + 1}
              </span>
              <span
                className={`text-caption ${
                  isDone ? 'text-ink' : isCurrent ? 'text-ink' : 'text-muted'
                }`}
              >
                {s.label}
              </span>
              {isCurrent && (
                <span className="text-fine-print text-quantum ml-auto">running…</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}