// Sticky scroll story — "The Journey of One Patient Vector".
// Keynote plate composition: a framed image card sits centered on void,
// big act headlines sit ABOVE it, and each frame WIPES in over the
// previous one (left→right clip reveal) while settling scale 0.94→1.02.
// One rAF scroll listener drives everything; only opacity/transform/
// clip-path are touched. Stage fades to void over the final 10% of scroll.
// Reduced-motion fallback per DESIGN.md: static frame grid with captions.
import { useMemo } from 'react'
import { FRAMES, STORY_ACTS } from '../data/story-frames'
import { useScrollProgress } from '../hooks/useScrollProgress'

const N = FRAMES.length
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smoothstep = (t) => t * t * (3 - 2 * t)

// Wipe window: frame j reveals over [j-1, j-1+0.7] in continuous frame
// position (0..N-1). Frame 0 is the base layer — always revealed.
const wipeAt = (j, pos) => (j === 0 ? 1 : smoothstep(clamp01((pos - (j - 1)) / 0.7)))
const settleAt = (j, pos) => smoothstep(clamp01((pos - (j - 1)) / 1.3)) // scale 0.94 → 1.02

function StoryStage() {
  const [ref, raw] = useScrollProgress()
  const pos = raw * (N - 1) // 0..15 continuous position
  const end = clamp01((raw - 0.9) / 0.06) // fade the whole story to void at the end

  return (
    <div ref={ref} className="relative h-[320vh]" aria-label="Scroll story: the journey of one patient vector">
      <div className="sticky top-0 h-screen overflow-hidden" style={{ opacity: 1 - end }} aria-hidden={end > 0.5}>
        {/* ——— act headline, ABOVE the plate ——— */}
        <div className="absolute inset-x-0 top-[6vh] z-10 px-6 text-center sm:top-[7vh]">
          {STORY_ACTS.map((act, i) => {
            const first = FRAMES.findIndex((f) => f.act.id === act.id)
            const last = FRAMES.findLastIndex((f) => f.act.id === act.id)
            const inT = smoothstep(clamp01((pos - first + 1.2) / 0.7))
            const outT = i === STORY_ACTS.length - 1 ? 0 : smoothstep(clamp01((pos - (last + 0.35)) / 0.7))
            const opacity = inT * (1 - outT)
            const rise = 22 * (1 - inT) - 16 * outT
            return (
              <div
                key={act.id}
                className="absolute inset-x-0 top-0 px-6 will-change-[opacity,transform]"
                style={{ opacity, transform: `translateY(${rise}px)` }}
                aria-hidden={opacity < 0.15}
              >
                <p className="text-fine-print uppercase tracking-[0.18em] text-white/55">
                  Act {act.id} — {act.label}
                </p>
                <h2 className="text-display-md mx-auto mt-2 max-w-[24ch] font-semibold text-white">{act.text}</h2>
              </div>
            )
          })}
        </div>

        {/* ——— the plate: framed card, frames wipe in over each other ——— */}
        <div
          className="absolute inset-x-[4vw] bottom-[8vh] top-[24vh] overflow-hidden rounded-[18px] bg-void ring-1 ring-white/10 will-change-[transform] sm:inset-x-[9vw] sm:top-[22vh]"
          style={{
            boxShadow: 'var(--shadow-product)',
            // one gentle plate entrance as the story arrives, slight shrink into the end-fade
            transform: `scale(${(0.97 + 0.03 * clamp01(pos / 1.5)) * (1 - 0.05 * end)})`,
          }}
        >
          {FRAMES.map((f, i) => {
            const wipe = wipeAt(i, pos)
            const scale = 0.94 + 0.08 * settleAt(i, pos)
            return (
              <img
                key={f.n}
                src={f.src}
                alt={wipe > 0.5 ? f.alt : ''}
                className="absolute inset-0 h-full w-full object-cover will-change-[clip-path,transform]"
                style={{ clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`, transform: `scale(${scale})` }}
                loading={i < 3 ? 'eager' : 'lazy'}
                decoding="async"
                draggable="false"
              />
            )
          })}
        </div>

        {/* ——— progress: counter + hairline ——— */}
        <div className="absolute inset-x-0 bottom-[2.5vh] px-[9vw]">
          <div className="h-px w-full bg-white/15">
            <div className="h-px origin-left bg-white/70 will-change-transform" style={{ transform: `scaleX(${raw})` }} />
          </div>
          <p className="text-fine-print mt-2 text-center text-white/50" aria-hidden="true">
            {String(Math.min(N, Math.floor(pos) + 1)).padStart(2, '0')} / {N}
          </p>
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