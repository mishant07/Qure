import { AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'

/** Error state — paradigm-aware, actionable */
export default function ErrorState({ title = "That didn't load", hint, onRetry, retryLabel = 'Try again' }) {
  return (
    <div className="glass-panel p-8 text-center" role="alert">
      <div className="mx-auto mb-4 size-12 rounded-full bg-warn/15 flex items-center justify-center">
        <AlertTriangle className="size-6 text-warn" aria-hidden="true" />
      </div>
      <p className="text-display-md adaptive-text">{title}</p>
      <p className="text-caption mx-auto mt-2 max-w-[46ch] adaptive-muted">
        {hint ?? 'Something went wrong on our side — not your input. Your data never left this page.'}
      </p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-6 bg-quantum text-ink hover:bg-quantum-dim">
          {retryLabel}
        </Button>
      )}
    </div>
  )
}