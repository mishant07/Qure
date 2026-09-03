// Landing — Apple-taste marketing page per frontend-plan.md §5:
// typography hero → 16-frame scroll story → two-track how-it-works →
// recharts benchmark (honest scoreboard) → trust strip → dense footer.
import { Sparkles, Zap } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import ScrollStory from '../components/ScrollStory'
import Benchmark from '../components/Benchmark'
import { Button } from '../components/ui/button'
import { Link } from '../router'

/* HERO */

export default function Landing() {
  return (
    <div className="bg-canvas">
      <Nav />

      {/* ——— HERO — typography-only, Action Blue verb, 64ch measure ——— */}
      <section className="mx-auto max-w-[720px] px-5 pb-24 pt-[184px] text-center sm:pt-[216px]">
        <h1 className="text-hero-display">
          The same patient. <span className="text-primary">Two verdicts.</span>
        </h1>
        <p className="text-lead-airy mx-auto mt-6 max-w-[52ch] font-light text-ink-muted-80">
          A hybrid quantum pipeline runs alongside the best classical model on five UCI clinical
          datasets — and tells you honestly which one to believe.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/detect">Start detection</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <a href="#story">See how it thinks</a>
          </Button>
          <span className="text-caption flex items-center gap-1.5 text-ink-muted-48">
            <Zap className="size-3.5 text-primary" aria-hidden="true" /> 8 qubits · 512 shots · ~2s
          </span>
        </div>
        <p className="text-fine-print mx-auto mt-6 max-w-[48ch] text-ink-muted-48">
          Research demonstration on public UCI datasets. Not a medical device.
        </p>
      </section>

      {/* ——— STORY — 16 frames, 6 acts ——— */}
      <section id="story" className="scroll-mt-[96px]">
        <ScrollStory />
      </section>

      {/* ——— HOW IT WORKS — two aligned tracks ——— */}
      <section id="how" className="scroll-mt-[96px] bg-parchment py-section">
        <div className="mx-auto max-w-[980px] px-5">
          <p className="text-caption-strong uppercase tracking-[0.12em] text-primary">How it works</p>
          <h2 className="text-display-lg mt-3 max-w-[24ch]">One vector in. Two thinking styles out.</h2>

          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-6 flex items-center gap-2">
                <Sparkles className="size-4 text-ink" aria-hidden="true" />
                <h3 className="text-tagline">The classical track</h3>
              </div>
              <ol className="space-y-5">
                {[
                  ['Train the best', 'Five model families compete per dataset; only the winner ships.'],
                  ['Prove it', 'Stratified CV with the exact metrics the scoreboard shows.'],
                  ['Serve it', 'One FastAPI endpoint, sub-100ms inference.'],
                ].map(([t, d]) => (
                  <li key={t}>
                    <p className="text-body-strong">{t}</p>
                    <p className="text-caption mt-1 text-ink-muted-80">{d}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <div className="mb-6 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" fill="none" stroke="#0066cc" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="#0066cc" />
                </svg>
                <h3 className="text-tagline">The quantum track</h3>
              </div>
              <ol className="space-y-5">
                {[
                  ['Compress', 'PCA folds 13–30 clinical signals into 8 numbers.'],
                  ['Encode', 'Eight qubits rotate into the data’s geometry.'],
                  ['Run', 'A variational circuit votes 512 times per vector.'],
                ].map(([t, d]) => (
                  <li key={t}>
                    <p className="text-body-strong">{t}</p>
                    <p className="text-caption mt-1 text-ink-muted-80">{d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ——— BENCHMARK — honest scoreboard ——— */}
      <section id="benchmark" className="scroll-mt-[96px] bg-void py-section text-white">
        <div className="mx-auto max-w-[980px] px-5">
          <p className="text-caption-strong uppercase tracking-[0.12em] text-primary-on-dark">Benchmarks</p>
          <h2 className="text-display-lg mt-3 max-w-[26ch]">Quantum wins sometimes. We say when it doesn’t.</h2>
          <p className="text-caption mt-4 max-w-[56ch] text-body-muted">
            F1 and ROC-AUC on held-out test splits across five UCI datasets. The winner badge under
            each row is computed from the numbers — never asserted in copy.
          </p>
          <div className="mt-10">
            <Benchmark />
          </div>
        </div>
      </section>

      {/* ——— TRUST STRIP — one dark band, 3 stats ——— */}
      <section className="bg-parchment py-16">
        <div className="mx-auto grid max-w-[980px] gap-8 px-5 sm:grid-cols-3">
          {[
            ['5', 'UCI datasets, end to end'],
            ['8', 'qubits encoded via PCA'],
            ['0', 'data leaves your browser'],
          ].map(([n, d]) => (
            <div key={d} className="text-center">
              <p className="text-display-lg font-semibold">{n}</p>
              <p className="text-caption mt-1 text-ink-muted-80">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}