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
        <span className="text-caption-strong text-ink">{f.label}</span>
        <span className="text-fine-print font-normal text-muted">{f.unit}</span>
      </Label>
      {f.opts ? (
        <select
          id={id}
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(f.k, f.raw ? e.target.value : Number(e.target.value))}
          className="flex h-10 w-full rounded-sm border-0 bg-void/60 px-3 py-2 text-sm text-ink ring-1 ring-hairline transition-[box-shadow,background-color] duration-200 hover:ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-quantum focus-visible:ring-offset-0 focus-visible:ring-offset-void disabled:cursor-not-allowed disabled:opacity-40 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-warn"
        >
          {f.opts.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
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
      )}
      <p className="text-fine-print mt-1 text-muted">
        {f.help === `${f.min}–${f.max}` ? f.help : `${f.help} · ${f.min}–${f.max}`}
      </p>
    </div>
  )
}

/**
 * The working form. Classical Track styling.
 * Fields per dataset from fields.js (30-field WDBC groups into accordions).
 * Presets + reset in the panel header.
 */
function PredictForm({ datasets, meta, values, setValues, onReset, onSubmit, initialDataset }) {
  const first = datasets[0]
  const [dataset, setDataset] = useState(
    datasets.some((d) => d.id === initialDataset) ? initialDataset : first.id
  )

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
          // red ring only for a filled-but-non-numeric value; raw string fields
          // (e.g. HCV Sex 'm'/'f') are exempt; empty is just "not filled yet"
          .filter((f) => !f.raw && vals[f.k] !== undefined && vals[f.k] !== '' && Number.isNaN(Number(vals[f.k])))
          .map((f) => f.k)
      ),
    [fields, vals]
  )
  const missingCount = fields.filter((f) => {
    const v = vals[f.k]
    if (f.raw) return v === undefined || v === ''
    return v === undefined || v === '' || Number.isNaN(Number(v))
  }).length
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
    // Select fields may carry raw string values (e.g. HCV Sex 'm'/'f'); the
    // rest are numbers. Send values exactly as entered.
    onSubmit(dataset, Object.fromEntries(fields.map((f) => [f.k, f.raw ? String(vals[f.k]) : Number(vals[f.k])])))
  }

  return (
    <form onSubmit={submit} aria-label="Prediction form" className="min-w-0">
      {/* Dataset selector — segmented control, classical paradigm */}
      <div role="tablist" aria-label="Dataset" className="mb-6 flex flex-wrap gap-1 bg-glass p-1 rounded-lg">
        {datasets.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={dataset === d.id}
            onClick={() => setDataset(d.id)}
            className={cn(
              'min-h-[40px] cursor-pointer rounded-md px-4 py-2 text-caption-strong tabular transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quantum',
              dataset === d.id
                ? 'bg-classical text-quantum shadow-sm'
                : 'text-muted hover:text-ink hover:bg-white/5'
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-muted">
          {fields.length} clinical features · values stay in your browser until you run
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setValues((prev) => ({ ...prev, [dataset]: defaultsFor(dataset, meta) }))}
            className="border-hairline text-muted hover:text-ink hover:bg-glass"
          >
            <Wand2 className="size-3.5" aria-hidden="true" /> Fill typical values
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onReset} className="border-hairline text-muted hover:text-ink hover:bg-glass">
            <RotateCcw className="size-3.5" aria-hidden="true" /> Reset
          </Button>
        </div>
      </div>

      {simple ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <FieldRow key={f.k} f={f} value={vals[f.k] ?? ''} onChange={setField} invalid={invalidKeys.has(f.k)} />
          ))}
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={['mean']} className="space-y-2">
          {groups.map((g) => (
            <AccordionItem key={g.id} value={g.id} className="border border-hairline rounded-lg overflow-hidden">
              <AccordionTrigger className="flex items-center justify-between px-4 py-3 bg-glass hover:bg-glass-strong transition-colors">
                <span className="text-caption-strong text-ink">
                  {g.label}
                  <span className="ml-2 text-caption font-normal text-muted">({g.keys.length} features)</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.keys.map((f) => (
                    <FieldRow key={f.k} f={f} value={vals[f.k] ?? ''} onChange={setField} invalid={invalidKeys.has(f.k)} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Sticky action bar — Quantum track primary */}
      <div className="sticky bottom-0 mt-6 border-t border-hairline bg-void/80 py-4 backdrop-blur-xl">
        <Button type="submit" size="lg" disabled={!complete} className="w-full sm:w-auto bg-quantum text-void hover:bg-quantum-dim disabled:bg-quantum/30 disabled:text-void/50">
          Run a vector
        </Button>
        {!complete && (
          <span className="text-caption mt-2 inline-block text-muted sm:mt-0">
            {missingCount} value{missingCount > 1 ? 's' : ''} still needed
          </span>
        )}
      </div>
    </form>
  )
}

export { PredictForm as default }