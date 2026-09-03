import { AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'

/** Apple-style empty/error state: short assertion, quiet reassurance, one pill action. */
export default function ErrorState({ title = "That didn't load", hint, onRetry, retryLabel = 'Try again' }) {
  return (
    <div className="rounded-lg bg-parchment p-10 text-center" role="alert">
      <AlertTriangle className="mx-auto mb-4 size-8 text-ink-muted-48" aria-hidden="true" />
      <p className="text-display-md">{title}</p>
      <p className="text-caption mx-auto mt-2 max-w-[46ch] text-ink-muted-80">
        {hint ?? 'Something went wrong on our side — not your input. Your data never left this page.'}
      </p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-6">
          {retryLabel}
        </Button>
      )}
    </div>
  )
}