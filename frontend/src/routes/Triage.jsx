// Triage — 5 rule-based questions, progress indicator, rule-based routing.
// Per SIH 26139 guide: "It recommends screening pathways; it does not diagnose."
import { useEffect, useState } from 'react'
import { ArrowRight, ArrowLeft, Check, ClipboardList } from 'lucide-react'
import { Button } from '../components/ui/button'
import Footer from '../components/Footer'
import ErrorState from '../components/ErrorState'
import { getTriageQuestions, submitTriage } from '../services/api'
import { navigate } from '../router'

export default function Triage() {
  const [questions, setQuestions] = useState([])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getTriageQuestions()
      .then((qs) => {
        if (mounted) {
          setQuestions(qs)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <ClipboardList className="mx-auto size-8 text-quantum mb-3" aria-hidden="true" />
          <p className="text-caption adaptive-muted">Loading screening questions…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center px-5">
        <ErrorState
          title="Triage unavailable"
          hint={error}
          retryLabel="Retry"
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  const total = questions.length
  const current = questions[step]
  const progressPct = Math.round(((step + (answers[current?.id] ? 1 : 0)) / total) * 100)

  function setAnswer(qid, val) {
    setAnswers((a) => ({ ...a, [qid]: val }))
  }

  function next() {
    if (step < total - 1) setStep(step + 1)
    else finish()
  }

  function prev() {
    if (step > 0) setStep(step - 1)
  }

  async function finish() {
    setSubmitting(true)
    setError(null)
    try {
      const payload = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || 'no',
      }))
      const result = await submitTriage(payload)
      // store result and pass to route selection
      sessionStorage.setItem('triage-result', JSON.stringify(result))
      sessionStorage.setItem('triage-answers', JSON.stringify(answers))
      navigate('/route')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[800px] px-5 pb-[100px] pt-[80px]">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-glass px-3 py-1 text-fine-print adaptive-muted">
              <ClipboardList className="size-3" aria-hidden="true" />
              Step 1 of 3
            </span>
            <span className="text-fine-print adaptive-muted">Screening questionnaire</span>
          </div>
          <h1 className="text-display-lg">Five short questions.</h1>
          <p className="text-body mt-2 adaptive-muted max-w-[560px]">
            These route you to relevant screening pathways. They do not diagnose.
            This is a screening aid, not a clinical assessment.
          </p>
        </header>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-fine-print adaptive-muted mb-2">
            <span>Question {step + 1} of {total}</span>
            <span className="tabular">{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/5">
            <div
              className="h-full rounded-pill bg-quantum transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="glass-panel p-6 sm:p-8">
          <p className="text-caption-strong adaptive-muted tracking-[0.05em] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Question {step + 1}
          </p>
          <h2 className="text-display-md adaptive-text mb-6">
            {current.question}
          </h2>
          <p className="text-caption adaptive-muted mb-6 max-w-[600px]">
            <em>Why we ask:</em> {current.rationale}
          </p>

          {/* Yes / No buttons */}
          <div className="grid grid-cols-2 gap-3 sm:max-w-[400px]">
            <button
              type="button"
              onClick={() => setAnswer(current.id, 'yes')}
              className={`min-h-[60px] rounded-lg border px-4 py-3 text-body-strong transition-colors ${
                answers[current.id] === 'yes'
                  ? 'bg-quantum/15 border-quantum text-quantum'
                  : 'border-hairline adaptive-text hover:bg-glass'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setAnswer(current.id, 'no')}
              className={`min-h-[60px] rounded-lg border px-4 py-3 text-body-strong transition-colors ${
                answers[current.id] === 'no'
                  ? 'bg-classical/20 border-classical/60 adaptive-text'
                  : 'border-hairline adaptive-text hover:bg-glass'
              }`}
            >
              No
            </button>
          </div>

          {/* Per-question indicator if "triggers" present */}
          {current.triggers && current.triggers.length > 0 && answers[current.id] === 'yes' && (
            <div className="mt-5 flex flex-wrap gap-2">
              {current.triggers.map((t) => (
                <span
                  key={t}
                  className="rounded-pill bg-quantum/10 border border-quantum/30 px-3 py-1 text-fine-print text-quantum"
                >
                  + {t.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 0}
            className="text-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Back
          </Button>

          <div className="flex items-center gap-2">
            {questions.map((q, i) => (
              <span
                key={q.id}
                className={`inline-block size-2 rounded-full transition-colors ${
                  answers[q.id] ? 'bg-quantum' : i === step ? 'bg-ink' : 'bg-white/20'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>

          <Button
            onClick={next}
            disabled={!answers[current.id] || submitting}
            className="bg-quantum text-void hover:bg-quantum-dim disabled:opacity-30"
          >
            {step < total - 1 ? (
              <>Next <ArrowRight className="size-4" /></>
            ) : submitting ? (
              'Routing…'
            ) : (
              <>Finish <Check className="size-4" /></>
            )}
          </Button>
        </div>

        {error && (
          <p className="text-caption text-warn mt-4 text-center">{error}</p>
        )}
      </main>
      <Footer />
    </div>
  )
}