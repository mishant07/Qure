// RouteSelection — After triage, show recommended disease pathways + a complete list
// Per SIH 26139 guide: "Show Heart Disease, Diabetes and HCV pathways that are
// relevant based on triage. Multiple pathways can be selected."
import { useEffect, useState } from 'react'
import { ArrowRight, Heart, Droplet, Microscope, ChevronLeft } from 'lucide-react'
import { Link, navigate } from '../router'
import Footer from '../components/Footer'
import { Button } from '../components/ui/button'

const ALL_PATHWAYS = [
  {
    id: 'musa_heart',
    icon: Heart,
    name: 'Heart Disease',
    desc: 'UCI Cleveland 13-feature screening — HistGradientBoosting + 4-qubit VQC',
    family: 'musa',
  },
  {
    id: 'musa_diabetes',
    icon: Droplet,
    name: 'Diabetes (3-class)',
    desc: 'Baghdad cohort 11 lab features — Random Forest + 4-qubit VQC',
    family: 'musa',
  },
  {
    id: 'musa_hcv',
    icon: Microscope,
    name: 'Hepatitis C (HCV)',
    desc: '12 blood biomarkers — albumin, ALT, AST, bilirubin — XGBoost + 4-qubit VQC',
    family: 'musa',
  },
]

const PATHWAY_ICONS = Object.fromEntries(ALL_PATHWAYS.map((p) => [p.id, p.icon]))

export default function RouteSelection() {
  const [result, setResult] = useState(null)
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    const raw = sessionStorage.getItem('triage-result')
    if (!raw) {
      navigate('/triage')
      return
    }
    const parsed = JSON.parse(raw)
    setResult(parsed)
    // preselect recommended
    setSelected(new Set(parsed.recommended || []))
  }, [])

  if (!result) return null

  const recommended = new Set(result.recommended || [])
  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function continueToDetect() {
    if (selected.size === 0) return
    // For now, we send the user to the first selected pathway
    const first = [...selected][0]
    sessionStorage.setItem('selected-pathways', JSON.stringify([...selected]))
    navigate(`/detect?disease=${first}`)
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[1000px] px-5 pb-[100px] pt-[80px]">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-glass px-3 py-1 text-fine-print text-quantum">
              Step 2 of 3
            </span>
            <span className="text-fine-print text-muted">Screening pathway</span>
          </div>
          <h1 className="text-display-lg">Recommended pathways</h1>
          <p className="text-body mt-2 text-muted max-w-[680px]">
            {result.rationale}
          </p>
        </header>

        {/* Recommended (highlighted) */}
        {recommended.size > 0 && (
          <section className="mb-8">
            <p className="text-caption-strong text-quantum tracking-[0.05em] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Strongly recommended
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[...recommended].map((id) => {
                const p = ALL_PATHWAYS.find((x) => x.id === id)
                if (!p) return null
                const Icon = p.icon
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className={`text-left glass-panel p-5 border-2 transition-all ${
                      selected.has(id)
                        ? 'border-quantum bg-quantum/5'
                        : 'border-hairline hover:border-quantum/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`grid size-10 place-items-center rounded-full ${selected.has(id) ? 'bg-quantum text-void' : 'bg-classical text-quantum'}`}>
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-body-strong text-ink">{p.name}</h3>
                          {p.family === 'musa' && (
                            <span className="rounded-pill bg-glass border border-hairline px-2 py-0.5 text-fine-print text-muted">
                              Musa module
                            </span>
                          )}
                        </div>
                        <p className="text-caption text-muted mt-1">{p.desc}</p>
                      </div>
                      {selected.has(id) && (
                        <div className="size-6 rounded-full bg-quantum grid place-items-center shrink-0">
                          <span className="text-void text-caption-strong">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* All pathways (greyed) */}
        <section className="mb-8">
          <p className="text-caption-strong text-muted tracking-[0.05em] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            All available pathways
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_PATHWAYS.map((p) => {
              const Icon = p.icon
              const isRec = recommended.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`text-left rounded-lg border p-4 transition-colors ${
                    selected.has(p.id)
                      ? 'border-quantum bg-quantum/5'
                      : 'border-hairline hover:bg-glass'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`size-5 mt-0.5 ${selected.has(p.id) ? 'text-quantum' : 'text-muted'}`} aria-hidden="true" />
                    <div className="flex-1">
                      <h4 className="text-caption-strong text-ink">{p.name}</h4>
                      <p className="text-fine-print text-muted mt-0.5">{p.desc}</p>
                    </div>
                    {isRec && (
                      <span className="rounded-pill bg-quantum/15 text-quantum text-fine-print px-2 py-0.5">recommended</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Continue */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/triage')}
            className="text-muted hover:text-ink"
          >
            <ChevronLeft className="size-4" /> Back to questionnaire
          </Button>
          <Button
            onClick={continueToDetect}
            disabled={selected.size === 0}
            className="bg-quantum text-void hover:bg-quantum-dim disabled:opacity-30"
          >
            Continue to screening <ArrowRight className="size-4" />
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}