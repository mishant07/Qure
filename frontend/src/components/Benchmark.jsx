// Benchmark — Honest Scoreboard, Paradigm Colors (3 active Musa modules)
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import benchmark from '../data/benchmark.json'
import { cn } from '../lib/utils'

const DATASETS = [
  { key: 'musa_heart', label: 'Heart' },
  { key: 'musa_hcv', label: 'Hepatitis C' },
  { key: 'musa_diabetes', label: 'Diabetes (3-class)' },
]

const GRID = 'rgba(255,255,255,0.04)'
const AXIS = { fontSize: 12, fill: '#7a7a7a' }

function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md bg-void/90 px-3 py-2 text-ink shadow-sm backdrop-blur border border-hairline">
      <p className="text-caption-strong text-quantum">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-caption mt-0.5">
          {p.name}: <span className="font-medium tabular">{(p.value * 100).toFixed(1)}%</span>
        </p>
      ))}
    </div>
  )
}

export default function Benchmark() {
  const rows = useMemo(
    () =>
      DATASETS.map(({ key, label }) => {
        const b = benchmark[key]
        return {
          name: label,
          classical: b.classical_best.f1 ?? b.classical_best.roc_auc,
          quantum: b.vqc.f1 ?? b.vqc.roc_auc,
          winner:
            (b.classical_best.f1 ?? b.classical_best.roc_auc) >= (b.vqc.f1 ?? b.vqc.roc_auc)
              ? 'classical'
              : 'quantum',
        }
      }),
    []
  )
  const quantumWins = rows.filter((r) => r.winner === 'quantum').length
  const gaps = rows.map((r) => r.classical - r.quantum)
  const worstGap = Math.max(...gaps)

  return (
    <div>
      {/* Scoreboard — stat cards with paradigm colors */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-panel p-5 text-center">
          <p className="text-display-md font-medium tabular-display adaptive-text">{quantumWins}/3</p>
          <p className="text-caption mt-1 adaptive-muted">modules where the VQC leads on F1</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <p className="text-display-md font-medium tabular-display adaptive-text">{(worstGap * 100).toFixed(0)} pts</p>
          <p className="text-caption mt-1 adaptive-muted">largest F1 gap favouring the classical model</p>
        </div>
        <div className="glass-panel p-5 text-center">
          <p className="text-display-md font-medium tabular-display adaptive-text">4–8</p>
          <p className="text-caption mt-1 adaptive-muted">qubits per VQC — exact simulation, no sampling noise</p>
        </div>
      </div>

      {/* Charts — paradigm colors */}
      <div className="grid gap-8 lg:grid-cols-2">
        {['f1', 'roc_auc'].map((metric) => (
          <figure key={metric}>
            <div className="glass-panel p-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={rows} barGap={4} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
                  <YAxis
                    domain={[0.5, 1]}
                    ticks={[0.5, 0.6, 0.7, 0.8, 0.9, 1]}
                    tick={AXIS}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <Tooltip content={<TooltipBox />} cursor={{ fill: 'rgba(0,212,170,0.08)' }} />
                  <Legend iconType="circle" iconSize={8} wrapperClassName="text-caption adaptive-muted" />
                  <Bar dataKey="classical" name="Classical" fill="#1D1D1F" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="quantum" name="VQC" fill="#00D4AA" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <figcaption className="text-caption mt-3 adaptive-muted">
              {metric === 'f1' ? 'F1 score (positive class)' : 'ROC-AUC'} — higher is better.
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Per-dataset honesty table — winner badge uses paradigm color */}
      <div className="mt-8 overflow-hidden rounded-lg border border-hairline">
        <table className="w-full text-left">
          <caption className="sr-only">Winner per dataset, computed from benchmark data</caption>
          <thead>
            <tr className="bg-glass text-caption-strong">
              <th scope="col" className="px-4 py-3 font-medium adaptive-muted tabular" style={{ fontFamily: 'var(--font-display)' }}>Dataset</th>
              <th scope="col" className="px-4 py-3 font-medium adaptive-muted tabular">Classical F1</th>
              <th scope="col" className="px-4 py-3 font-medium adaptive-muted tabular">VQC F1</th>
              <th scope="col" className="px-4 py-3 font-medium adaptive-muted tabular">Honest Verdict</th>
            </tr>
          </thead>
          <tbody className="text-caption">
            {rows.map((r, i) => (
              <tr key={r.name} className={cn('border-t border-hairline', i % 2 ? 'bg-glass' : 'bg-transparent')}>
                <th scope="row" className="px-4 py-3 font-medium adaptive-text tabular" style={{ fontFamily: 'var(--font-display)' }}>{r.name}</th>
                <td className="px-4 py-3 adaptive-text tabular">{(r.classical * 100).toFixed(1)}%</td>
                <td className="px-4 py-3 adaptive-text tabular">{(r.quantum * 100).toFixed(1)}%</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-fine-print tabular',
                    r.winner === 'quantum' ? 'winner-quantum' : 'winner-classical'
                  )}>
                    {r.winner === 'quantum' ? 'Quantum leads' : 'Classical leads'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}