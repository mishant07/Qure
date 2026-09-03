import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, Wand2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { cn } from '../lib/utils'

/** Typical starting values — the documented example per field (mid as fallback). */
export function defaultsFor(dataset, meta) {
  return Object.fromEntries(
    meta[dataset].map((f) => [
      f.k,
      f.ex !== undefined ? f.ex : Number((f.min + (f.max - f.min) * 0.5).toFixed(4)),
    ])
  )
}

function FieldRow({ f, value, onChange, invalid }) {
  const id = `f-${f.k}`
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 flex items-baseline justify-between">
        <span>{f.label}</span>
        <span className="text-fine-print font-normal text-ink-muted-48">{f.unit}</span>
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        min={f.min}
        max={f.max}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(f.k, e.target.value)}
        placeholder={String(f.ex)}
      />
      <p className="text-fine-print mt-1 text-ink-muted-48">
        {f.help === `${f.min}–${f.max}` ? f.help : `${f.help} · ${f.min}–${f.max}`}
      </p>
    </div>
  )
}

/**
 * The working form. Fields per dataset from fields.js (30-field WDBC groups
 * into accordions). Presets + reset in the panel header per frontend-plan.md.
 */
function PredictForm({ datasets, meta, values, setValues, onReset, onSubmit }) {
  const first = datasets[0]
  const [dataset, setDataset] = useState(first.id)

  // keep the form in sync with the dataset switcher above the page
  useEffect(() => {
    if (!datasets.some((d) => d.id === dataset)) setDataset(first.id)
  }, [datasets, dataset, first.id])

  const fields = meta[dataset]
  const vals = values[dataset] ?? {}

  const invalidKeys = useMemo(
    () =>
      new Set(
        fields
          // red ring only for a filled-but-non-numeric value; empty is just "not filled yet"
          .filter((f) => vals[f.k] !== undefined && vals[f.k] !== '' && Number.isNaN(Number(vals[f.k])))
          .map((f) => f.k)
      ),
    [fields, vals]
  )
  const missingCount = fields.filter(
    (f) => vals[f.k] === undefined || vals[f.k] === '' || Number.isNaN(Number(vals[f.k]))
  ).length
  const complete = missingCount === 0

  const setField = (k, v) => setValues((prev) => ({ ...prev, [dataset]: { ...prev[dataset], [k]: v } }))

  const simple = fields.length <= 13
  const groups = useMemo(() => {
    if (simple) return null
    return [
      { id: 'mean', label: 'Mean values', keys: fields.slice(0, 10) },
      { id: 'se', label: 'Standard error', keys: fields.slice(10, 20) },
      { id: 'worst', label: 'Worst values', keys: fields.slice(20, 30) },
    ]
  }, [fields, simple])

  const submit = (e) => {
    e.preventDefault()
    if (!complete) return
    onSubmit(dataset, Object.fromEntries(fields.map((f) => [f.k, Number(vals[f.k])])))
  }

  return (
    <form onSubmit={submit} aria-label="Prediction form" className="min-w-0">
      {/* dataset switcher — pill tab list */}
      <div role="tablist" aria-label="Dataset" className="mb-8 flex flex-wrap gap-2">
        {datasets.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={dataset === d.id}
            onClick={() => setDataset(d.id)}
            className={cn(
              'min-h-[36px] cursor-pointer rounded-pill px-4 py-2 text-caption-strong transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
              dataset === d.id ? 'bg-ink text-white' : 'bg-parchment text-ink-muted-80 hover:bg-divider-soft'
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-ink-muted-48">
          {fields.length} clinical features · values stay in your browser until you run
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="pearl"
            size="sm"
            onClick={() => setValues((prev) => ({ ...prev, [dataset]: defaultsFor(dataset, meta) }))}
          >
            <Wand2 className="size-3.5" aria-hidden="true" /> Fill typical values
          </Button>
          <Button type="button" variant="pearl" size="sm" onClick={onReset}>
            <RotateCcw className="size-3.5" aria-hidden="true" /> Reset
          </Button>
        </div>
      </div>

      {simple ? (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <FieldRow key={f.k} f={f} value={vals[f.k] ?? ''} onChange={setField} invalid={invalidKeys.has(f.k)} />
          ))}
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={['mean']}>
          {groups.map((g) => (
            <AccordionItem key={g.id} value={g.id}>
              <AccordionTrigger>
                <span>
                  {g.label}{' '}
                  <span className="text-caption font-normal text-ink-muted-48">({g.keys.length} features)</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  {g.keys.map((f) => (
                    <FieldRow key={f.k} f={f} value={vals[f.k] ?? ''} onChange={setField} invalid={invalidKeys.has(f.k)} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* sticky action bar — one primary pill, honest about completion */}
      <div className="sticky bottom-0 mt-8 border-t border-hairline bg-canvas/90 py-4 backdrop-blur">
        <Button type="submit" size="lg" disabled={!complete} className="w-full sm:w-auto">
          Run prediction
        </Button>
        {!complete && (
          <span className="text-caption ml-0 mt-2 inline-block text-ink-muted-48 sm:ml-4 sm:mt-0">
            {missingCount} value{missingCount > 1 ? 's' : ''} still needed
          </span>
        )}
      </div>
    </form>
  )
}

export { PredictForm as default }