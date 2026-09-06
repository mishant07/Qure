// Landing — Interference Palette, Two-Track Hero with SIH entry actions
import { ArrowRight, Atom, Brain, Activity, FileText, ClipboardList } from 'lucide-react'
import { Link } from '../router'
import Benchmark from '../components/Benchmark'
import Footer from '../components/Footer'
import { Button } from '../components/ui/button'

/* Project stats */
function ProjectStats() {
  const stats = [
    { icon: Activity, val: '3', label: 'Clinical Modules' },
    { icon: Atom, val: '4–8', label: 'Qubit VQC' },
    { icon: Brain, val: '98.5%', label: 'Best Classical F1' },
    { icon: ArrowRight, val: '~2s', label: 'Inference' },
  ]
  return (
    <div className="grid w-full max-w-[680px] grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-4 pt-8">
      {stats.map(({ icon: Icon, val, label }) => (
        <div key={label} className="flex flex-col items-center gap-1.5">
          <div className="grid size-9 place-items-center rounded-full bg-glass border border-hairline">
            <Icon className="size-4 text-quantum" aria-hidden="true" />
          </div>
          <p className="m-0 tabular-display adaptive-text" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>
            {val}
          </p>
          <p className="m-0 text-center text-caption adaptive-muted">{label}</p>
        </div>
      ))}
    </div>
  )
}

/* interference-in ends at transform:none, but fill-mode:forwards can leave the
   element in a retained transform/filter state — an isolating stacking context
   that severs mix-blend-mode from the fixed background video (adaptive text
   would blend against nothing and stay white). Strip the animation once it
   finishes so the element returns to a clean, blend-through state. */
const clearReveal = (e) => {
  const el = e.currentTarget
  el.style.animation = 'none'
  el.style.opacity = '1'
  el.style.transform = 'none'
  el.style.filter = 'none'
}

/* Hero — Split headline: Classical / Quantum, with two clear entry actions */
function VideoHero() {
  return (
    <section
      className="relative flex min-h-[100vh] min-h-[100dvh] flex-col items-center justify-between text-ink"
      style={{ padding: 'clamp(16px, 2.4vh, 28px) clamp(14px, 3vw, 32px)' }}
    >
      <div style={{ height: 'clamp(44px, 5.2vw, 48px)' }} />

      <div className="flex w-full max-w-[900px] flex-col items-center gap-6 py-8 text-center sm:gap-8"
        style={{ animation: 'interference-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        onAnimationEnd={clearReveal}>
        
        <h1 className="text-hero-display leading-[1.02] text-center" style={{ maxWidth: '900px' }}>
          <span className="block adaptive-text" style={{ animation: 'interference-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} onAnimationEnd={clearReveal}>
            Hybrid Quantum
          </span>
          <span className="block mt-2 adaptive-text" style={{ animation: 'interference-in-reverse 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards', opacity: 0 }} onAnimationEnd={clearReveal}>
            Disease Detection
          </span>
        </h1>

        <p
          className="mx-auto max-w-[min(600px,92%)] text-body adaptive-muted"
          style={{ fontSize: 'clamp(1rem, 1.4vw, 1.125rem)' }}
        >
          Classical ML meets variational quantum circuits (up to 8 qubits) on three
          clinical screening modules. Same test set. Honest benchmarks. No medical advice.
        </p>

        {/* Two clear entry actions per SIH guide: Start Questionnaire + Upload Lab Report */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Button asChild size="lg" className="bg-quantum text-void hover:bg-quantum-dim">
            <Link to="/triage" className="gap-2">
              <ClipboardList className="size-4" /> Start Questionnaire
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-hairline adaptive-text hover:bg-glass">
            <Link to="/upload" className="gap-2">
              <FileText className="size-4" /> Upload Lab Report
            </Link>
          </Button>
        </div>

        {/* Secondary action — direct detect (advanced users / judges) */}
        <Link
          to="/detect"
          className="text-fine-print adaptive-muted hover:text-ink transition-colors"
        >
          or jump to manual entry →
        </Link>

        <ProjectStats />
      </div>
    </section>
  )
}

/* SIH Hero — Glass panel, paradigm-aware */
function SihHero() {
  return (
    <section
      id="sih-hero"
      className="mx-auto max-w-[800px] glass-strong px-6 py-[80px] text-center sm:py-[100px]"
      style={{ borderRadius: '18px 18px 0 0', marginTop: '-18px' }}
    >
      <h2 className="text-display-lg adaptive-text">
        The same patient. <span>Two verdicts.</span>
      </h2>
      <p className="text-lead-airy adaptive-muted mx-auto mt-4 max-w-[52ch]">
        A 4-qubit variational quantum circuit runs alongside the best classical model on
        three clinical screening modules — and tells you honestly which one to believe.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" className="bg-quantum text-void hover:bg-quantum-dim">
          <Link to="/triage">Start questionnaire</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="border-hairline adaptive-text hover:bg-glass">
          <a href="#how">See how it thinks</a>
        </Button>
        <span className="flex items-center gap-1.5 rounded-full border border-hairline bg-glass px-3.5 py-1.5 text-caption adaptive-muted">
          <Atom className="size-3.5 text-quantum" aria-hidden="true" />
          4 qubits · exact simulation · ~2s
        </span>
      </div>
      <p className="text-fine-print adaptive-muted mx-auto mt-6 max-w-[48ch]">
        Research demonstration on public UCI datasets. Not a medical device.
      </p>
    </section>
  )
}

/* How it works — Two tracks visually */
function HowItWorks() {
  return (
    <section id="how" className="py-[80px] scroll-mt-[96px]">
      <div className="mx-auto max-w-[980px] px-5">
        <p className="text-caption-strong adaptive-muted tracking-[0.05em]" style={{ fontFamily: 'var(--font-display)' }}>
          How it works
        </p>
        <h2 className="text-display-lg adaptive-text mt-3 max-w-[24ch]">One vector in. Two thinking styles out.</h2>
        <p className="text-lead-airy adaptive-muted mt-4 max-w-[46ch]">
          Every patient vector passes through both tracks — the scoreboard decides which verdict earns your trust.
        </p>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Classical track */}
          <div className="glass-panel p-6">
            <div className="mb-6 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-classical text-quantum text-caption-strong tabular" aria-hidden="true">01</span>
              <h3 className="text-tagline adaptive-text">Classical Track</h3>
            </div>
            <ol className="space-y-5">
              {[
                ['Train the best', 'Five model families compete per dataset; only the winner ships.'],
                ['Prove it', 'Stratified CV with the exact metrics the scoreboard shows.'],
                ['Serve it', 'One FastAPI endpoint, sub-100ms inference.'],
              ].map(([t, d], i) => (
                <li key={t} className="border-t border-hairline py-4 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline gap-4">
                    <span className="text-caption-strong tabular adaptive-text" style={{ fontFamily: 'var(--font-display)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-body-strong adaptive-text">{t}</p>
                      <p className="text-caption mt-1 adaptive-muted">{d}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Quantum track */}
          <div className="glass-panel p-6">
            <div className="mb-6 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-quantum text-void text-caption-strong tabular" aria-hidden="true" style={{ fontFamily: 'var(--font-display)' }}>02</span>
              <h3 className="text-tagline adaptive-text">Quantum Track</h3>
            </div>
            <ol className="space-y-5">
              {[
                ['Compress', 'PCA folds each clinical panel down — the 8-qubit diabetes VQC keeps 91.3% of variance.'],
                ['Encode', 'Up to eight qubits rotate into the data\'s geometry.'],
                ['Run', 'A variational circuit votes on every vector — honestly scored.'],
              ].map(([t, d], i) => (
                <li key={t} className="border-t border-hairline py-4 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline gap-4">
                    <span className="text-caption-strong tabular adaptive-text" style={{ fontFamily: 'var(--font-display)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-body-strong adaptive-text">{t}</p>
                      <p className="text-caption mt-1 adaptive-muted">{d}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/* Benchmark — Honest Scoreboard */
function BenchmarkSection() {
  return (
    <section id="benchmark" className="py-[80px] scroll-mt-[96px]">
      <div className="mx-auto max-w-[980px] px-5">
        <p className="text-caption-strong adaptive-muted tracking-[0.05em]" style={{ fontFamily: 'var(--font-display)' }}>
          Benchmarks
        </p>
        <h2 className="text-display-lg adaptive-text mt-3 max-w-[26ch]">Quantum wins sometimes. We say when it doesn't.</h2>
        <p className="text-caption mt-4 max-w-[56ch] adaptive-muted">
          F1 and ROC-AUC on held-out test splits across the three active modules. The winner badge
          under each row is computed from the numbers — never asserted in copy.
        </p>
        <div className="mt-10">
          <Benchmark />
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <>
      <VideoHero />
      <SihHero />
      <HowItWorks />
      <BenchmarkSection />
      <Footer />
    </>
  )
}