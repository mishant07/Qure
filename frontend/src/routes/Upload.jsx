// Upload — PDF/text lab report upload + OCR review flow
// Per SIH 26139 guide:
//   1. Upload — Accept PDF and show file name/size.
//   2. Extract — Run OCR/text extraction and identify candidate clinical values.
//   3. Map — Map values to the exact feature names expected by the selected model.
//   4. Review — Display every extracted value and highlight uncertain/missing fields.
//   5. Confirm — Require explicit user confirmation; allow editing.
//   6. Validate — Run range/sanity checks.
//   7. Predict — Only after confirmation, call the prediction API.
import { useState, useRef, useCallback } from 'react'
import { FileText, Upload, AlertCircle, Check, ArrowRight, ChevronLeft, Eye, ChevronDown, ChevronUp, Cpu, FileSearch } from 'lucide-react'
import { navigate } from '../router'
import Footer from '../components/Footer'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import ErrorState from '../components/ErrorState'
import { uploadReport, validateReport, predictDisease } from '../services/api'

const PATHWAY_LABELS = {
  musa_heart: 'Heart Disease',
  musa_diabetes: 'Diabetes (3-class)',
  musa_hcv: 'Hepatitis C (HCV)',
}

// Pathway ids → /api/predict/{disease} display routes
const ROUTE_FOR = {
  musa_heart: 'heart',
  musa_diabetes: 'diabetes',
  musa_hcv: 'hcv',
}

const STEPS = [
  { key: 'select', label: 'Select pathway' },
  { key: 'upload', label: 'Upload report' },
  { key: 'review', label: 'Review & confirm' },
  { key: 'predict', label: 'Screening' },
]

export default function UploadPage() {
  const [step, setStep] = useState('select')
  const [disease, setDisease] = useState(null)
  const [file, setFile] = useState(null)
  const [review, setReview] = useState(null)
  const [editedValues, setEditedValues] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [showRawText, setShowRawText] = useState(false)
  const fileRef = useRef(null)


  const reset = useCallback(() => {
    setStep('select')
    setDisease(null)
    setFile(null)
    setReview(null)
    setEditedValues({})
    setError(null)
    setResult(null)
  }, [])

  function selectPathway(id) {
    setDisease(id)
    setStep('upload')
  }

  async function doUpload() {
    if (!file) {
      setError('Please choose a file first')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const r = await uploadReport(disease, file)
      setReview(r)
      // pre-fill edits with extracted values
      const e = {}
      for (const row of r.rows) {
        e[row.field] = row.value ?? ''
      }
      setEditedValues(e)
      setStep('review')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function doConfirm() {
    setLoading(true)
    setError(null)
    try {
      // Drop empty strings so the server reports missing fields explicitly
      const clean = {}
      for (const [k, v] of Object.entries(editedValues)) {
        if (v !== '' && v !== null && v !== undefined) clean[k] = v
      }
      await validateReport(disease, clean)
      setStep('predict')
      setPredicting(true)
      const r = await predictDisease(ROUTE_FOR[disease] ?? disease, clean)
      setResult(r)
      setPredicting(false)
      // store for report page
      sessionStorage.setItem('last-result', JSON.stringify({ disease, inputs: clean, result: r }))
    } catch (err) {
      setError(err.message)
      setPredicting(false)
    } finally {
      setLoading(false)
    }
  }

  const stepIdx = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[900px] px-5 pb-[100px] pt-[80px]">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-glass px-3 py-1 text-fine-print adaptive-muted">
              <Upload className="size-3" aria-hidden="true" />
              Upload Lab Report
            </span>
          </div>
          <h1 className="text-display-lg adaptive-text">Upload your report.</h1>
          <p className="text-body mt-2 adaptive-muted max-w-[600px]">
            We'll extract candidate clinical values, let you review and edit them, then run the screening.
            Nothing is sent to the models until you confirm.
          </p>
        </header>

        {/* Stepper */}
        <ol className="mb-8 flex flex-wrap items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-caption-strong tabular ${
                  i < stepIdx
                    ? 'bg-quantum text-ink'
                    : i === stepIdx
                    ? 'bg-classical text-quantum'
                    : 'bg-glass border border-hairline text-muted'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
                aria-hidden="true"
              >
                {i < stepIdx ? '✓' : i + 1}
              </span>
              <span className={`text-caption ${i === stepIdx ? 'adaptive-text' : 'adaptive-muted'}`}>{s.label}</span>
              {i < STEPS.length - 1 && <ArrowRight className="size-3 text-muted" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        {/* Step: select pathway */}
        {step === 'select' && (
          <div className="glass-panel p-6">
            <h2 className="text-body-strong adaptive-text mb-4">Which pathway does this report cover?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: 'musa_heart', name: 'Heart Disease', desc: 'UCI Cleveland 13-feature screening' },
                { id: 'musa_diabetes', name: 'Diabetes (3-class)', desc: 'Baghdad cohort — z-scored lab panel' },
                { id: 'musa_hcv', name: 'Hepatitis C (HCV)', desc: '12 blood biomarkers' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPathway(p.id)}
                  className="text-left rounded-lg border border-hairline hover:border-quantum/40 hover:bg-quantum/5 p-4 transition-colors"
                >
                  <h3 className="text-body-strong adaptive-text">{p.name}</h3>
                  <p className="text-caption adaptive-muted mt-1">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: upload */}
        {step === 'upload' && (
          <div className="glass-panel p-6">
            <h2 className="text-body-strong adaptive-text mb-1">Upload lab report — {PATHWAY_LABELS[disease]}</h2>
            <p className="text-caption adaptive-muted mb-5">PDF or text file. Maximum 5 MB.</p>

            <div
              className="rounded-lg border-2 border-dashed border-hairline p-8 text-center cursor-pointer hover:border-quantum/40 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault() }}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files?.[0]
                if (f) {
                  setFile(f)
                  setError(null)
                }
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,text/plain,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setFile(f)
                    setError(null)
                  }
                }}
              />
              <FileText className="mx-auto size-10 text-quantum mb-3" aria-hidden="true" />
              {file ? (
                <div>
                  <p className="text-body-strong adaptive-text">{file.name}</p>
                  <p className="text-caption adaptive-muted mt-1">
                    {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown type'}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="text-fine-print text-warn hover:underline mt-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-body-strong adaptive-text">Drag a file here, or click to choose</p>
                  <p className="text-caption adaptive-muted mt-1">PDF or plain text</p>
                </div>
              )}
            </div>

            {loading && (
              <div className="mt-4 rounded-lg border border-quantum/30 bg-quantum/5 p-4 text-center animate-pulse">
                <div className="flex items-center justify-center gap-2 text-caption-strong text-quantum mb-1">
                  <Cpu className="size-4 animate-spin" />
                  Running Multi-Stage PDF Extraction & OCR Pipeline...
                </div>
                <p className="text-fine-print adaptive-muted">
                  Detecting page layouts · preprocessing image pages · running RapidOCR · mapping lab values
                </p>
              </div>
            )}

            {error && (
              <p className="text-caption text-warn mt-3">{error}</p>
            )}

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep('select')}
                className="text-muted hover:text-ink"
              >
                <ChevronLeft className="size-4" /> Back
              </Button>
              <Button
                onClick={doUpload}
                disabled={!file || loading}
                className="bg-quantum text-ink hover:bg-quantum-dim disabled:opacity-30"
              >
                {loading ? 'Extracting…' : <>Extract values <ArrowRight className="size-4" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* Step: review & confirm */}
        {step === 'review' && review && (
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-body-strong adaptive-text">Review extracted values</h2>
                <div className="flex items-center gap-2">
                  {review.ocr_used ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-fine-print font-medium text-amber-400">
                      <Cpu className="size-3" /> OCR USED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-fine-print font-medium text-emerald-400">
                      <Check className="size-3" /> DIGITAL EXTRACTION
                    </span>
                  )}
                  {review.page_count && (
                    <span className="inline-flex items-center rounded-full bg-glass border border-hairline px-2.5 py-0.5 text-fine-print adaptive-muted">
                      {review.page_count} page{review.page_count > 1 ? 's' : ''}
                      {review.avg_confidence ? ` · ${Math.round(review.avg_confidence * 100)}% conf` : ''}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-caption adaptive-muted mb-4">
                {review.note}
              </p>

              {/* Per-page details breakdown */}
              {review.page_details && review.page_details.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5 text-fine-print">
                  {review.page_details.map((pd) => (
                    <span
                      key={pd.page}
                      className="rounded border border-hairline bg-glass px-2 py-0.5 adaptive-muted"
                    >
                      Page {pd.page}: {pd.is_scanned ? `Scanned (OCR ${Math.round(pd.confidence * 100)}%)` : 'Digital Text'}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3 text-caption mb-4">
                <div className="rounded-lg border border-hairline p-3">
                  <p className="adaptive-muted">Extracted</p>
                  <p className="text-display-md adaptive-text tabular">{review.extracted_count}/{review.rows.length}</p>
                </div>
                <div className="rounded-lg border border-hairline p-3">
                  <p className="adaptive-muted">Missing</p>
                  <p className="text-display-md text-warn tabular">{review.missing_count}</p>
                </div>
                <div className="rounded-lg border border-hairline p-3">
                  <p className="adaptive-muted">Uncertain</p>
                  <p className="text-display-md text-caution tabular">{review.uncertain_count}</p>
                </div>
              </div>

              {/* Accordion: Raw Extracted Text Preview */}
              {review.extracted_text && (
                <div className="mb-5 rounded-lg border border-hairline bg-glass overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowRawText(!showRawText)}
                    className="w-full flex items-center justify-between p-3 text-caption-strong adaptive-text hover:bg-hairline/30 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileSearch className="size-4 text-quantum" />
                      Preview Extracted Document Text ({review.extracted_chars || 0} chars)
                    </span>
                    {showRawText ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                  {showRawText && (
                    <div className="p-3 border-t border-hairline bg-ink/30 max-h-60 overflow-y-auto">
                      <pre className="text-fine-print font-mono adaptive-muted whitespace-pre-wrap leading-relaxed select-text">
                        {review.extracted_text}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {review.rows.map((row) => (
                  <div
                    key={row.field}
                    className={`grid grid-cols-1 sm:grid-cols-[1fr_140px_1fr] items-center gap-3 rounded-md border p-3 ${
                      row.missing
                        ? 'border-warn/40 bg-warn/5'
                        : row.uncertain
                        ? 'border-caution/30 bg-caution/5'
                        : 'border-hairline'
                    }`}
                  >
                    <div>
                      <p className="text-caption-strong adaptive-text tabular">{row.field}</p>
                      {row.source_text && (
                        <p className="text-fine-print adaptive-muted mt-0.5 truncate" title={row.source_text}>
                          <Eye className="inline size-3 mr-0.5" aria-hidden="true" />
                          "{row.source_text}"
                        </p>
                      )}
                    </div>
                    <Input
                      type="text"
                      value={editedValues[row.field] ?? ''}
                      onChange={(e) => setEditedValues((prev) => ({ ...prev, [row.field]: e.target.value }))}
                      placeholder="enter value"
                      className={row.missing ? 'border-warn' : row.uncertain ? 'border-caution' : ''}
                    />
                    <div className="text-fine-print adaptive-muted">
                      {row.missing ? (
                        <span className="text-warn flex items-center gap-1">
                          <AlertCircle className="size-3" aria-hidden="true" /> Missing — please enter
                        </span>
                      ) : row.uncertain ? (
                        <span className="text-caution flex items-center gap-1">
                          <AlertCircle className="size-3" aria-hidden="true" /> Verify
                        </span>
                      ) : (
                        <span className="adaptive-text flex items-center gap-1">
                          <Check className="size-3" aria-hidden="true" /> Extracted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>


            {error && (
              <ErrorState
                title="Could not confirm"
                hint={error}
                retryLabel="Try again"
                onRetry={doConfirm}
              />
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep('upload')}
                className="text-muted hover:text-ink"
              >
                <ChevronLeft className="size-4" /> Re-upload
              </Button>
              <Button
                onClick={doConfirm}
                disabled={loading || predicting}
                className="bg-quantum text-ink hover:bg-quantum-dim disabled:opacity-30"
              >
                {loading || predicting ? 'Screening…' : <>Confirm & run screening <ArrowRight className="size-4" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* Step: predict (results summary) */}
        {step === 'predict' && (
          <div className="space-y-6">
            {predicting ? (
              <div className="glass-panel p-8 text-center">
                <div className="mx-auto size-12 rounded-full bg-quantum/15 flex items-center justify-center mb-3 animate-pulse">
                  <FileText className="size-6 text-quantum" aria-hidden="true" />
                </div>
                <p className="text-body-strong adaptive-text">Running screening…</p>
                <p className="text-caption adaptive-muted mt-1">
                  Validating inputs · preprocessing · classical ML · quantum ML · comparison
                </p>
              </div>
            ) : result ? (
              <div className="glass-panel p-6 sm:p-8">
                <p className="text-caption-strong adaptive-muted tracking-[0.05em] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Screening complete — {PATHWAY_LABELS[disease]}
                </p>
                <h2 className="text-display-lg adaptive-text">
                  {result.risk === 'HIGH' ? 'Higher-risk pattern detected' : result.risk === 'MODERATE' ? 'Moderate-risk pattern detected' : 'Lower-risk pattern'}
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-classical/30 bg-classical/10 p-4">
                    <p className="text-caption-strong adaptive-text">Classical ML</p>
                    <p className="text-display-md tabular-display mt-1 adaptive-text">
                      {((result.ml_probability ?? 0) * 100).toFixed(1)}%
                    </p>
                    <p className="text-fine-print adaptive-muted mt-0.5">{result.ml_model}</p>
                  </div>
                  <div className="rounded-lg border border-quantum/30 bg-quantum/10 p-4">
                    <p className="text-caption-strong adaptive-text">Quantum ML</p>
                    <p className="text-display-md tabular-display mt-1 adaptive-text">
                      {((result.qml_probability ?? 0) * 100).toFixed(1)}%
                    </p>
                    <p className="text-fine-print adaptive-muted mt-0.5">{result.qml_model}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={reset}
                    className="border-hairline text-muted hover:text-ink"
                  >
                    New screening
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/detect?disease=' + (disease === 'musa_hcv' ? 'musa_hcv' : disease))}
                      className="border-hairline text-ink hover:bg-glass"
                    >
                      Open in Detect dashboard
                    </Button>
                    <Button
                      onClick={() => navigate('/report')}
                      className="bg-quantum text-ink hover:bg-quantum-dim"
                    >
                      Generate report <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : error ? (
              <ErrorState
                title="Screening failed"
                hint={error}
                retryLabel="Try again"
                onRetry={() => setStep('review')}
              />
            ) : null}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}