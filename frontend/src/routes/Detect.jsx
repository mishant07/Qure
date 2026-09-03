// /detect — the working page. Two-pane: sticky intro + form; result appears
// below after submit. Sonner toasts errors; skeletons during inference.
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import PredictForm from '../components/PredictForm'
import ResultPanel from '../components/ResultPanel'
import ErrorState from '../components/ErrorState'
import { FormSkeleton, ResultSkeleton } from '../components/LoadingSkeletons'
import { predict } from '../services/api'
import { FIELD_META, DATASETS } from '../data/fields'

export default function Detect() {
  const [values, setValues] = useState({})
  const [result, setResult] = useState(null)
  const [meta, setMeta] = useState(null) // last submitted {dataset, label}
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const onSubmit = useCallback(async (dataset, features) => {
    setPending(true)
    setError(null)
    setResult(null)
    const label = DATASETS.find((d) => d.id === dataset)?.label ?? dataset
    try {
      const data = await predict(dataset, features)
      setMeta({ dataset, label })
      setResult(data)
      requestAnimationFrame(() => {
        document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (e) {
      setError(e.message)
      toast.error('Prediction failed', { description: e.message })
    } finally {
      setPending(false)
    }
  }, [])

  const onReset = useCallback(() => setValues({}), [])

  return (
    <div className="min-h-screen bg-canvas">
      <Nav />
      {/* 44 + 52 nav stack */}
      <main className="mx-auto max-w-[980px] px-5 pb-[120px] pt-[144px]">
        <header className="mb-10 max-w-[600px]">
          <h1 className="text-display-lg">Run a vector.</h1>
          <p className="text-lead mt-3 font-light text-ink-muted-80">
            Enter clinical measurements, get one verdict from both paradigms — classical and
            quantum — side by side, honestly labeled.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            {FIELD_META ? (
              <PredictForm
                datasets={DATASETS}
                meta={FIELD_META}
                values={values}
                setValues={setValues}
                onReset={onReset}
                onSubmit={onSubmit}
              />
            ) : (
              <FormSkeleton />
            )}
          </div>

          {/* sticky side rail — what happens under the hood */}
          <aside className="top-[144px] self-start lg:sticky">
            <h2 className="text-caption-strong text-ink">Under the hood</h2>
            <ol className="mt-4 space-y-4">
              {[
                ['Validate', '13–30 features checked against dataset ranges'],
                ['Standardize', 'same scaler fitted during training'],
                ['PCA', 'compressed to the 8-dim subspace'],
                ['VQC', '8-qubit circuit, 512 shots, simulated'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-pill bg-ink text-fine-print font-semibold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="text-caption-strong block">{t}</span>
                    <span className="text-fine-print text-ink-muted-48">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-fine-print mt-6 text-ink-muted-48">
              Quantum inference uses a calibrated demo offset on classical output in this build —
              labeled as such in every result.
            </p>
          </aside>
        </div>

        {/* result zone */}
        <section id="result" className="mt-16 scroll-mt-[144px]" aria-label="Prediction result">
          {pending && <ResultSkeleton />}
          {!pending && error && (
            <ErrorState
              title="Prediction failed"
              hint={error}
              retryLabel="Check backend"
              onRetry={() => window.open('/docs', '_blank')}
            />
          )}
          {!pending && !error && result && (
            <ResultPanel result={result} datasetLabel={meta?.label} />
          )}
          {!pending && !error && !result && (
            <div className="rounded-lg border border-dashed border-hairline p-10 text-center">
              <ArrowDown className="mx-auto mb-3 size-6 text-ink-muted-48" aria-hidden="true" />
              <p className="text-caption text-ink-muted-48">
                Your verdict appears here — nothing is stored, nothing leaves the page until you run.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}