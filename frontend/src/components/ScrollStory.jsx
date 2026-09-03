// Sticky scroll story — "The Journey of One Patient Vector".
// Images sit BEHIND the text: every act's caption lives in a fixed full-screen
// layer, and scroll progress (rAF, single listener) crossfades both layers —
// act captions fade in/out in place while the image bed crossfades + drifts
// scale, then the whole story fades to void at its end. Only opacity/transform
// are animated (GPU-composited, zero layout cost).
// Reduced-motion fallback per DESIGN.md: static frame grid with captions.
import { useMemo } from 'react'
import { FRAMES, STORY_ACTS } from '../data/story-frames'
import { useScrollProgress } from '../hooks/useScrollProgress'

const N = FRAMES.length
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smoothstep = (t) => t * t * (3 - 2 * t)

// [fadeInStart, fullyIn, startLeaving, gone] — continuous frame positions 0..N
const WINDOW = (i) => [i - 0.35, i + 0.35, i + N - 1.35, i + N - 0.35]

function StoryStage() {
  const [ref, raw] = useScrollProgress()
  const pos = raw * (N - 1) // 0..15 continuous position
  const end = clamp01((raw - 0.9) / 0.06) // fade the whole story to void at the end

  return (
    <div ref={ref} className="relative h-[320vh]" aria-label="Scroll story: the journey of one patient vector">
      {/* fixed stage: images BEHIND text, text on top, both scroll-faded */}
      <div className="sticky top-0 h-screen overflow-hidden" style={{ opacity: 1 - end }} aria-hidden={end > 0.5}>
        {/* ——— image bed (behind) ——— */}
        <div className="absolute inset-0 bg-void">
          {FRAMES.map((f, i) => {
            const [a, b, c, d] = WINDOW(i)
            // asymmetric window: slow warm-up, steady hold, gentle exit (already smoothstepped)
            const t = pos <= i + 0.5 ? smoothstep(clamp01((pos - a) / (b - a))) : 1 - smoothstep(clamp01((pos - c) / (d - c)))
            const opacity = t
            const scale = 1.06 - 0.05 * t // slow Ken Burns settle as the frame arrives
            return (
              <img
                key={f.n}
                src={f.src}
                alt={t > 0.5 ? f.alt : ''}
                className="absolute inset-0 h-full w-full object-cover will-change-[opacity,transform]"
                style={{ opacity, transform: `scale(${scale})` }}
                loading={i < 3 ? 'eager' : 'lazy'}
                decoding="async"
                draggable="false"
              />
            )
          })}
          {/* legibility veil — text always reads over the imagery */}
          <div className="absolute inset-0 bg-black/55" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-void via-void/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55vh] bg-gradient-to-t from-void via-void/55 to-transparent" />
        </div>

        {/* ——— text (front): every act mounted, scroll decides who is visible ——— */}
        <div className="absolute inset-0">
          {STORY_ACTS.map((act, i) => {
            const first = FRAMES.findIndex((f) => f.act.id === act.id)
            const [a, b] = WINDOW(first)
            // fade out as the act's 3rd frame arrives (last act holds until the end-fade)
            const c = i === STORY_ACTS.length - 1 ? Infinity : first + 1.65
            const inT = smoothstep(clamp01((pos - a) / (b - a)))
            const outT = i === STORY_ACTS.length - 1 ? 0 : smoothstep(clamp01((pos - c) / 0.7))
            const opacity = inT * (1 - outT)
            const rise = 26 * (1 - inT) - 18 * outT
            return (
              <div
                key={act.id}
                className="absolute inset-x-0 bottom-[10vh] px-6 text-center will-change-[opacity,transform]"
                style={{ opacity, transform: `translateY(${rise}px)` }}
                aria-hidden={opacity < 0.15}
              >
                <p className="text-fine-print uppercase tracking-[0.14em] text-body-muted">
                  Act {act.id} — {act.label}
                </p>
                <p className="text-lead-airy mx-auto mt-3 max-w-[28ch] font-light text-white sm:max-w-[36ch]">
                  {act.text}
                </p>
              </div>
            )
          })}
          <div className="absolute inset-x-0 bottom-4 text-center">
            <p className="text-fine-print text-white/50" aria-hidden="true">
              {String(Math.min(N, Math.floor(pos) + 1)).padStart(2, '0')} / {N}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StoryStatic() {
  // prefers-reduced-motion: no scroll-driven motion — render all acts as a calm grid
  return (
    <div className="mx-auto max-w-[980px] px-5 py-16">
      <div className="grid gap-10 sm:grid-cols-2">
        {STORY_ACTS.map((act) => {
          const frame = FRAMES.find((f) => f.act.id === act.id)
          return (
            <figure key={act.id}>
              <img
                src={frame.src}
                alt={frame.alt}
                className="aspect-video w-full rounded-lg object-cover"
                loading="lazy"
              />
              <figcaption className="mt-3">
                <p className="text-caption-strong text-ink">
                  Act {act.id} — {act.label}
                </p>
                <p className="text-caption text-ink-muted-80">{act.text}</p>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}

export default function ScrollStory() {
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
  return reduced ? <StoryStatic /> : <StoryStage />
}