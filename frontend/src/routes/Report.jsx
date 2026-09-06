// Report — Downloadable screening summary
// Per SIH 26139 guide: "Downloadable screening summary with inputs, outputs,
// explanation, model/version information and disclaimer."
import { useEffect, useState } from 'react'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { navigate } from '../router'
import Footer from '../components/Footer'
import { Button } from '../components/ui/button'
import { generateReport } from '../services/api'

const DISEASE_TITLES = {
  musa_heart: 'Heart Disease',
  musa_diabetes: 'Diabetes (3-class)',
  musa_hcv: 'Hepatitis C',
}

export default function Report() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = sessionStorage.getItem('last-result')
    if (!raw) {
      navigate('/detect')
      return
    }
    const { disease, inputs, result } = JSON.parse(raw)
    generateReport(disease, inputs, result)
      .then((r) => {
        setReport(r)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  function downloadJSON() {
    if (!report) return
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `screening-report-${report.disease}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadMarkdown() {
    if (!report) return
    const md = renderMarkdown(report)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `screening-report-${report.disease}-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-caption text-muted">Generating screening report…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center px-5">
        <div className="glass-panel p-6 text-center max-w-md">
          <p className="text-body-strong text-warn">Could not generate report</p>
          <p className="text-caption text-muted mt-2">{error}</p>
          <Button onClick={() => navigate('/detect')} className="mt-4 bg-quantum text-void hover:bg-quantum-dim">
            Back to Detect
          </Button>
        </div>
      </div>
    )
  }

  if (!report) return null

  const ms = report.model_scores
  const agr = report.agreement

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[900px] px-5 pb-[100px] pt-[80px]">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-glass px-3 py-1 text-fine-print text-quantum">
                <FileText className="size-3" aria-hidden="true" />
                Screening Report
              </span>
            </div>
            <h1 className="text-display-lg text-ink">{report.title}</h1>
            <p className="text-caption text-muted mt-2">
              {DISEASE_TITLES[report.disease] || report.disease} · {new Date(report.generated_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadMarkdown} className="border-hairline text-ink hover:bg-glass">
              <Download className="size-4" /> Markdown
            </Button>
            <Button onClick={downloadJSON} className="bg-quantum text-void hover:bg-quantum-dim">
              <Download className="size-4" /> JSON
            </Button>
          </div>
        </header>

        {/* Outcome */}
        <section className="glass-panel p-6 mb-6">
          <p className="text-caption-strong text-quantum tracking-[0.05em] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Screening outcome
          </p>
          <h2 className="text-display-lg text-ink">{report.screening_outcome}</h2>
        </section>

        {/* Model scores */}
        <section className="glass-panel p-6 mb-6">
          <h3 className="text-body-strong text-ink mb-4">Model scores</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-classical/30 bg-classical/10 p-5">
              <p className="text-caption-strong adaptive-text">Classical ML</p>
              <p className="text-display-md tabular-display adaptive-text mt-1">
                {ms.classical_ml.score != null ? (ms.classical_ml.score * 100).toFixed(1) + '%' : '—'}
              </p>
              <p className="text-fine-print adaptive-muted mt-1">{ms.classical_ml.prediction}</p>
              <p className="text-fine-print adaptive-muted mt-0.5">{ms.classical_ml.model_name}</p>
            </div>
            <div className="rounded-lg border border-quantum/30 bg-quantum/10 p-5">
              <p className="text-caption-strong track-quantum">Quantum ML</p>
              <p className="text-display-md tabular-display text-quantum mt-1">
                {ms.quantum_ml.score != null ? (ms.quantum_ml.score * 100).toFixed(1) + '%' : '—'}
              </p>
              <p className="text-fine-print text-muted mt-1">{ms.quantum_ml.prediction}</p>
              <p className="text-fine-print text-muted mt-0.5">{ms.quantum_ml.model_name}</p>
            </div>
          </div>
          <p className="text-caption text-muted mt-4">
            {agr.explanation}
          </p>
        </section>

        {/* Key contributors */}
        <section className="glass-panel p-6 mb-6">
          <h3 className="text-body-strong text-ink mb-4">Key contributors</h3>
          {report.key_contributors.length > 0 ? (
            <ul className="space-y-2">
              {report.key_contributors.map((c, i) => (
                <li key={c.feature} className="flex items-baseline gap-3 text-caption">
                  <span className="text-fine-print text-quantum tabular w-6">#{i + 1}</span>
                  <span className="text-ink font-medium">{c.feature}</span>
                  <span className="text-muted">— {c.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-caption text-muted">No top contributors were highlighted for this input.</p>
          )}
        </section>

        {/* Inputs used */}
        <section className="glass-panel p-6 mb-6">
          <h3 className="text-body-strong text-ink mb-4">Inputs used</h3>
          <dl className="grid gap-2 sm:grid-cols-2">
            {Object.entries(report.inputs_used || {}).map(([k, v]) => (
              <div key={k} className="flex justify-between text-caption border-b border-hairline pb-2">
                <dt className="text-muted tabular">{k}</dt>
                <dd className="text-ink tabular">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Explanation */}
        {report.explanation?.summary && (
          <section className="glass-panel p-6 mb-6">
            <h3 className="text-body-strong text-ink mb-4">What this means</h3>
            <p className="text-body text-muted">{report.explanation.summary}</p>
            {report.explanation.evidence?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-caption-strong text-quantum mb-2">Trusted evidence</h4>
                <ul className="space-y-3">
                  {report.explanation.evidence.map((e, i) => (
                    <li key={i} className="rounded-lg border border-hairline p-3">
                      <p className="text-caption-strong text-ink">{e.title}</p>
                      <p className="text-caption text-muted mt-1">{e.summary}</p>
                      <p className="text-fine-print text-muted mt-1">Source: {e.source}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.explanation.next_steps?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-caption-strong text-quantum mb-2">Next steps</h4>
                <ul className="space-y-1">
                  {report.explanation.next_steps.map((s, i) => (
                    <li key={i} className="text-caption text-muted">→ {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Disclaimer */}
        <section className="rounded-lg border border-quantum/30 bg-quantum/5 p-5 mb-8">
          <p className="text-caption-strong text-quantum mb-2">Disclaimer</p>
          <p className="text-caption text-muted">{report.disclaimer}</p>
        </section>

        {/* Back */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/detect')} className="text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Back to Detect
          </Button>
          <p className="text-fine-print text-muted">
            Model version: {report.explanation?.model_version || 'vqc_4qubit'}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function renderMarkdown(r) {
  const lines = []
  lines.push(`# ${r.title}`)
  lines.push('')
  lines.push(`**Disease:** ${r.disease}`)
  lines.push(`**Generated:** ${r.generated_at}`)
  lines.push('')
  lines.push(`## Screening outcome`)
  lines.push(r.screening_outcome)
  lines.push('')
  lines.push(`## Model scores`)
  lines.push(`- **Classical ML** (${r.model_scores.classical_ml.model_name}): ${(r.model_scores.classical_ml.score ?? 0) * 100} — ${r.model_scores.classical_ml.prediction}`)
  lines.push(`- **Quantum ML** (${r.model_scores.quantum_ml.model_name}): ${(r.model_scores.quantum_ml.score ?? 0) * 100} — ${r.model_scores.quantum_ml.prediction}`)
  lines.push('')
  lines.push(`**Agreement:** ${r.agreement.models_agree ? 'Yes' : 'No'} — ${r.agreement.explanation}`)
  lines.push('')
  lines.push(`## Key contributors`)
  for (const c of r.key_contributors) {
    lines.push(`- \`${c.feature}\` — ${c.description}`)
  }
  lines.push('')
  lines.push(`## Inputs used`)
  for (const [k, v] of Object.entries(r.inputs_used || {})) {
    lines.push(`- ${k}: ${v}`)
  }
  lines.push('')
  if (r.explanation?.summary) {
    lines.push(`## Explanation`)
    lines.push(r.explanation.summary)
    lines.push('')
    if (r.explanation.evidence?.length) {
      lines.push(`### Trusted evidence`)
      for (const e of r.explanation.evidence) {
        lines.push(`- **${e.title}** — ${e.summary} _(${e.source})_`)
      }
      lines.push('')
    }
    if (r.explanation.next_steps?.length) {
      lines.push(`### Next steps`)
      for (const s of r.explanation.next_steps) {
        lines.push(`- ${s}`)
      }
      lines.push('')
    }
  }
  lines.push(`## Disclaimer`)
  lines.push(r.disclaimer)
  return lines.join('\n')
}