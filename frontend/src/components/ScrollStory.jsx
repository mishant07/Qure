// Sticky scroll story — "The Journey of One Patient Vector".
// 16 frames crossfaded over a 300vh scroll; text overlays are real DOM text.
// Reduced-motion fallback per DESIGN.md: static frame grid with captions.
import { useMemo } from 'react'
import { FRAMES, STORY_ACTS } from '../data/story-frames'
import { useScrollProgress } from '../hooks/useScrollProgress'

const N = FRAMES.length

function StoryStage() {
  const [ref, progress] = useScrollProgress()
  const pos = progress * N // continuous frame position 0..16

  return (
    <div ref={ref} className="relative h-[300vh]" aria-label="Scroll story: the journey of one patient vector">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-void">
        {FRAMES.map((f, i) => {
          // triangular window → smooth crossfade with both neighbours
          const opacity = Math.max(0, Math.min(1, 1 - Math.abs(pos - (i + 0.5)) * 1.6))
          const scale = 1.04 - Math.min(0.04, Math.abs(pos - (i + 0.5)) * 0.02)
          return (
            <img
              key={f.n}
              src={f.src}
              alt={i === Math.round(pos) || opacity > 0.5 ? f.alt : ''}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity, transform: `scale(${scale})` }}
              loading={i < 3 ? 'eager' : 'lazy'}
              decoding="async"
              draggable="false"
            />
          )
        })}

        {/* legibility gradient + act caption (real DOM text, never baked into image) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-[8vh] px-6 text-center">
          <div key={FRAMES[Math.min(N - 1, Math.floor(pos))].act.id} className="story-caption">
            <p className="text-fine-print uppercase tracking-[0.14em] text-body-muted">
              Act {FRAMES[Math.min(N - 1, Math.floor(pos))].act.id} — {FRAMES[Math.min(N - 1, Math.floor(pos))].act.label}
            </p>
            <p className="text-lead-airy mx-auto mt-2 max-w-[28ch] font-light text-white sm:max-w-[36ch]">
              {FRAMES[Math.min(N - 1, Math.floor(pos))].act.text}
            </p>
          </div>
          <p className="text-fine-print mt-6 text-white/50" aria-hidden="true">
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