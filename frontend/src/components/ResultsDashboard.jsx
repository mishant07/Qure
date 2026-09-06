// ResultsDashboard — SIH-style results card
//   "HEART DISEASE SCREENING — Screening outcome: Higher-risk pattern detected
//    Classical ML: 74% · Quantum ML: 70% · Models agree ✓
//    Key contributors: Age • chest-pain features • exercise-related features
//    Screening aid only — not a diagnosis."
// Per SIH 26139 guide §3.
import { Check, X, Sparkles, FileText, ArrowRight, BookOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, navigate } from '../router'
import { cn } from '../lib/utils'
import { explainResult } from '../services/api'

const RISK_STYLE = {
  HIGH: 'risk-high',
  MODERATE: 'risk-moderate',
  LOW: 'risk-low',
}

const RISK_TEXT = {
  HIGH: 'Higher-risk pattern detected',
  MODERATE: 'Moderate-risk pattern detected',
  LOW: 'Lower-risk pattern — no high-risk signal',
}

const DISEASE_TITLES = {
  musa_heart: 'Heart Disease',
  musa_hcv: 'Hepatitis C',
  musa_diabetes: 'Diabetes (3-class)',
}

export default function ResultsDashboard({ result, disease, datasetLabel }) {
  const [explanation, setExplanation] = useState(null)
  const ml_pred = result.ml_prediction
  const qml_pred = result.qml_prediction
  const agree = ml_pred === qml_pred
  const risk = (result.risk ?? '').toUpperCase()
  const title = DISEASE_TITLES[disease] || disease || 'Disease'

  useEffect(() => {
    if (!disease || !result) return
    let mounted = true
    explainResult(
      disease,
      result.risk,
      result.explain?.top_features ?? [],
      result.qml_model,
    ).then((d) => { if (mounted) setExplanation(d) }).catch(() => {})
    return () => { mounted = false }
  }, [disease, result])

  return (
    <div className="space-y-6">
      {/* Main results card — SIH style */}
      <div className="glass-panel p-6 sm:p-8">
        <p className="text-caption-strong adaptive-muted tracking-[0.12em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
          {title} screening
        </p>
        <h2 className="text-display-lg adaptive-text mt-2">
          <span className={cn('inline-block rounded-pill px-3 py-1 text-caption-strong mr-3 align-middle', RISK_STYLE[risk] ?? 'risk-low')}>
            {risk.toLowerCase()} risk
          </span>
          {RISK_TEXT[risk] || 'Screening result'}
        </h2>

        {/* ML vs QML comparison */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-classical/30 bg-classical/10 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="size-4 adaptive-text" aria-hidden="true" />
              <p className="text-caption-strong adaptive-text">Classical ML</p>
            </div>
            <p className="text-display-md tabular-display adaptive-text">
              {((result.ml_probability ?? 0) * 100).toFixed(1)}%
            </p>
            <p className="text-fine-print adaptive-muted mt-1">
              {result.ml_model ?? 'best classical'} · score
            </p>
          </div>
          <div className="rounded-lg border border-quantum/30 bg-quantum/10 p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="size-4 rounded-full bg-quantum" aria-hidden="true" />
              <p className="text-caption-strong adaptive-text">Quantum ML</p>
            </div>
            <p className="text-display-md tabular-display adaptive-text">
              {((result.qml_probability ?? 0) * 100).toFixed(1)}%
            </p>
            <p className="text-fine-print adaptive-muted mt-1">
              {result.qml_model ?? 'vqc_4qubit'} · score
            </p>
          </div>
        </div>

        {/* Agreement badge */}
        <div className="mt-5 flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-caption-strong',
              agree ? 'bg-safe/15 text-safe border border-safe/30' : 'bg-warn/15 text-warn border border-warn/30',
            )}
          >
            {agree ? <Check className="size-4" /> : <X className="size-4" />}
            {agree ? 'Models agree' : 'Models disagree — review the explanation below'}
          </span>
          <span className="text-fine-print adaptive-muted">
            demo offset applied to quantum track
          </span>
        </div>

        {/* Key contributors */}
        {result.explain?.top_features?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-body-strong adaptive-text mb-3">Key contributors</h3>
            <div className="flex flex-wrap gap-2">
              {result.explain.top_features.map((f, i) => (
                <span
                  key={f}
                  className="rounded-pill bg-classical/10 border border-classical/30 px-3 py-1.5 text-caption text-ink"
                >
                  <span className="text-fine-print adaptive-text mr-1.5 tabular">#{i + 1}</span>
                  {f}
                </span>
              ))}
            </div>
            {explanation?.contributor_text && (
              <p className="text-caption adaptive-muted mt-3">
                {explanation.contributor_text.slice(0, result.explain.top_features.length).join(' · ')}
              </p>
            )}
          </div>
        )}

        <p className="text-micro-legal mt-6 border-t border-hairline pt-4 adaptive-muted">
          Screening aid only — not a medical diagnosis. Do not label a model score as the patient's
          actual probability of disease unless the pipeline has been properly calibrated and that
          interpretation is justified.
        </p>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('last-result', JSON.stringify({ disease, inputs: result?.inputs ?? {}, result }))
              navigate('/report')
            }}
            className="inline-flex items-center gap-2 rounded-pill bg-quantum text-ink px-5 py-2.5 text-caption-strong hover:bg-quantum-dim transition-colors"
          >
            <FileText className="size-4" /> Generate screening report
          </button>
        </div>
      </div>

      {/* RAG explanation card — trusted evidence */}
      {explanation && (
        <div className="glass-panel p-6">
          <h3 className="text-body-strong adaptive-text flex items-center gap-2">
            <BookOpen className="size-4 text-quantum" aria-hidden="true" />
            What this result means
          </h3>
          <p className="text-body adaptive-muted mt-3 max-w-[60ch]">
            {explanation.summary}
          </p>

          {explanation.evidence?.length > 0 && (
            <div className="mt-5">
              <h4 className="text-caption-strong adaptive-muted tracking-[0.05em] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Trusted evidence
              </h4>
              <ul className="space-y-3">
                {explanation.evidence.map((e, i) => (
                  <li key={i} className="rounded-lg border border-hairline p-4">
                    <p className="text-body-strong adaptive-text">{e.title}</p>
                    <p className="text-caption adaptive-muted mt-1">{e.summary}</p>
                    <p className="text-fine-print adaptive-muted mt-2">
                      Source: {e.source}{' '}
                      {e.url && (
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-quantum hover:underline ml-1"
                        >
                          ↗
                        </a>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {explanation.next_steps?.length > 0 && (
            <div className="mt-5">
              <h4 className="text-caption-strong adaptive-muted tracking-[0.05em] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Next-step guidance
              </h4>
              <ul className="space-y-2">
                {explanation.next_steps.map((s, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-caption adaptive-muted">
                    <span className="adaptive-text shrink-0">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}