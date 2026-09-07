// NotFound — custom 404: the vector left the detector.
// Interference-palette native: void canvas, Geist display numerals, quantum
// primary action, adaptive text throughout. No gradients, no new tokens.
import { Radar } from 'lucide-react'
import { navigate } from '../router'
import Footer from '../components/Footer'
import { Button } from '../components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[800px] px-5 pb-[100px] pt-[120px] text-center">
        <div className="glass-panel p-10 sm:p-14">
          <div className="mx-auto mb-6 size-12 rounded-full bg-quantum/15 flex items-center justify-center">
            <Radar className="size-6 text-quantum" aria-hidden="true" />
          </div>
          <p
            className="text-display-lg tabular-display adaptive-text"
            style={{ fontSize: 'clamp(4rem, 12vw, 7rem)', lineHeight: 1 }}
            aria-label="404"
          >
            404
          </p>
          <h1 className="text-tagline adaptive-text mt-4">Signal lost.</h1>
          <p className="text-body adaptive-muted mx-auto mt-3 max-w-[46ch]">
            This vector left the detector — nothing lives at this address.
            Start over or run a screening instead.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/')}
              className="bg-quantum text-ink hover:bg-quantum-dim"
            >
              Back to start
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/detect')}
              className="border-hairline adaptive-text hover:bg-glass"
            >
              Run a vector
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
