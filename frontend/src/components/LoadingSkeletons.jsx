import { Skeleton } from './ui/skeleton'

/** Form skeleton — mirrors the Detect page layout while data loads. */
export function FormSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Result panel skeleton — mirrors the verdict layout during inference. */
export function ResultSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true" aria-busy="true">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  )
}