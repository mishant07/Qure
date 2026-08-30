/*
  SIH26139 Hybrid QML Platform — Dashboard (/app)
  Reconstructed in the landing's visual language: same video bg + scrim, white nav pill,
  BubbledotICG display type, mono eyebrows, glassy dark cards. Function kept: honest
  benchmark deep-dive (classical best vs 8-qubit VQC) + live 5-dataset predict.
  Font credit (CC BY 4.0): BubbledotICG-FinePos via https://www.onlinewebfonts.com/fonts
*/
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react'
import { Link } from '../router'
import { FIELD_META, DATASETS } from '../data/fields'
import benchData from '../data/benchmark.json'
import './landing.css'
import './dashboard.css'

const MOTION_ENABLED = true
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4'

const prettyModel = (m) => (m || 'model').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// Dashboard stats — computed from the same honest benchmark run
const STATS = (() => {
  const f1 = (ds, which) => benchData[ds]?.[which]?.f1 ?? 0
  const avg = (which) => DATASETS.reduce((a, d) => a + f1(d.id, which), 0) / DATASETS.length
  const totalTime = DATASETS.reduce((a, d) => a + (benchData[d.id]?.vqc?.train_time_s ?? 0), 0)
  const wins = DATASETS.filter(d => f1(d.id, 'vqc') > f1(d.id, 'classical_best')).length
  return [
    { glyph: '<', value: +(avg('classical_best') * 100).toFixed(1), decimals: 1, suffix: '%', label: 'Avg Classical F1' },
    { glyph: '%', value: +(avg('vqc') * 100).toFixed(1), decimals: 1, suffix: '%', label: 'Avg VQC F1' },
    { glyph: '*', value: +totalTime.toFixed(0), decimals: 0, suffix: 's', label: 'Total VQC Train Time' },
    { glyph: '#', value: wins, decimals: 0, suffix: '/5', label: 'VQC Wins (Honest)' },
  ]
})()

function CountUp({ value, decimals, suffix, delay, started }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => v.toFixed(decimals) + suffix)
  useEffect(() => {
    if (!started) return
    const controls = animate(mv, value, { duration: 1.5, delay: delay / 1000, ease: [0.215, 0.61, 0.355, 1] })
    return controls.stop
  }, [started])
  return <motion.span>{text}</motion.span>
}

function DuelBar({ label, sub, value, quantum, inView, delay }) {
  const pct = Math.max(0, Math.min(100, value * 100))
  return (
    <div className="duel-row">
      <div className="duel-head">
        <span className="duel-name">{label} <em>{sub}</em></span>
        <span className="tabular duel-f1">{value.toFixed(3)}</span>
      </div>
      <div className="bar-track">
        <motion.div
          className={`bar-fill${quantum ? ' q' : ''}`}
          initial={MOTION_ENABLED ? { width: 0 } : false}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.1, delay, ease: [0.215, 0.61, 0.355, 1] }}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dataset, setDataset] = useState('heart')
  const [form, setForm] = useState({})
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const benchRef = useRef(null)
  const benchInView = useInView(benchRef, { once: true, amount: 0.3 })
  const statsRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, amount: 0.25 })

  const bench = benchData[dataset]
  const cls = bench.classical_best
  const vqc = bench.vqc
  const delta = (vqc.f1 - cls.f1) * 100
  const vqcWins = delta > 0
  const fields = FIELD_META[dataset]

  const switchDataset = (id) => { setDataset(id); setForm({}); setRes(null); setError('') }
  const fillExample = () => { const ex = {}; fields.forEach(f => ex[f.k] = String(f.ex)); setForm(ex); setError('') }
  const clearForm = () => { setForm({}); setRes(null); setError('') }

  const predict = async () => {
    setError('')
    if (fields.some(f => form[f.k] == null || form[f.k] === '')) {
      setError(`Complete all ${fields.length} parameters before firing.`); return
    }
    setLoading(true); setRes(null)
    try {
      const numeric = {}; for (const k in form) numeric[k] = Number(form[k])
      const r = await fetch(`${API}/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset, features: numeric }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'failed')
      setRes(data)
    } catch (e) {
      setError(`Predict failed — ${e.message}. Backend on :8000?`)
    } finally { setLoading(false) }
  }

  const metrics = [
    ['F1', 'f1'], ['ROC AUC', 'roc_auc'], ['Accuracy', 'accuracy'], ['Precision', 'precision'], ['Recall', 'recall'],
  ]

  return (
    <>
      <div className="bg">
        <video className="bg-video" autoPlay muted loop playsInline preload="metadata">
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      </div>

      <div className={`page${menuOpen ? ' menu-open' : ''}`}>
        <motion.header
          className="hdr"
          initial={MOTION_ENABLED ? { opacity: 0, y: -18 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/" className="logo-btn" aria-label="Home"><span className="logo-mark">Q</span></Link>
          <nav className="nav-pill">
            <Link to="/" className="nav-link">Home</Link>
            <a href="#bench" className="nav-link">Benchmark</a>
            <a href="#predict" className="nav-link">Predict</a>
            <Link to="/app" className="nav-link active">Dashboard</Link>
          </nav>
          <a href="#predict" className="sign-in">Fire Vector</a>
          <button className="burger" aria-expanded={menuOpen} aria-label="Menu" onClick={() => setMenuOpen(o => !o)}>
            <span/><span/><span/>
          </button>
        </motion.header>

        <main className="hero hero-sm">
          <span className="mono-eyebrow">// MISSION CONTROL · 5 DATASETS · 8-QUBIT VQC</span>
          <h1 className="headline">
            <span className="line">Read The Detector.</span>
            <span className="line">Both Reconstructions.</span>
          </h1>
          <p className="subhead">
            Every number here comes from one honest benchmark run — three classical baselines
            against an 8-qubit variational circuit, same split, no cherry-picking.
          </p>
          <a href="#bench" className="cta">Read the Numbers ↓</a>
        </main>

        <section id="bench" className="predict-section" ref={benchRef}>
          <div className="predict-head">
            <span className="mono-eyebrow">// CALORIMETER · CLASSICAL BEST VS 8-QUBIT VQC</span>
            <h2 className="predict-title">Same Split.<br />Honest Math.</h2>
          </div>

          {/* scoreboard across all five datasets */}
          <div className="score-strip" role="tablist">
            {DATASETS.map((d, i) => {
              const w = benchData[d.id].vqc.f1 > benchData[d.id].classical_best.f1
              return (
                <button key={d.id} role="tab" aria-selected={dataset === d.id}
                  className={`score-chip${dataset === d.id ? ' on' : ''}`}
                  onClick={() => switchDataset(d.id)}>
                  <span className="ds-idx">{String(i + 1).padStart(2, '0')}</span> {d.label}
                  <b className={w ? 'w' : 'l'}>{w ? 'Q' : 'C'}</b>
                </button>
              )
            })}
          </div>

          {/* F1 duel bars */}
          <div className="duel">
            <DuelBar label="Classical" sub={prettyModel(cls.model)} value={cls.f1} inView={benchInView} delay={0.1} />
            <DuelBar label="Quantum" sub="VQC · 8 Qubits" value={vqc.f1} quantum inView={benchInView} delay={0.25} />
            <div className="delta-row">
              <span className={`delta-chip${vqcWins ? '' : ' lose'}`}>
                {vqcWins ? 'VQC WINS' : 'CLASSICAL HOLDS'} {vqcWins ? '+' : '−'}{Math.abs(delta).toFixed(1)} pts F1
              </span>
            </div>
          </div>

          {/* metric grid — classical value over quantum value */}
          <div className="metric-grid">
            {metrics.map(([label, k]) => (
              <div key={k} className="metric-tile">
                <span className="metric-k">{label}</span>
                <span className="metric-v tabular">{(cls[k] ?? 0).toFixed(3)}</span>
                <span className={`metric-v q tabular${vqcWins && k === 'f1' ? ' best' : ''}`}>{(vqc[k] ?? 0).toFixed(3)}</span>
                <span className="metric-legend"><i />quantum</span>
              </div>
            ))}
          </div>

          {/* quantum spec line */}
          <div className="qspec tabular">
            vqc spec — {vqc.qubits} qubits · {vqc.shots} shots · depth {vqc.circuit_depth} · trained {vqc.train_time_s.toFixed(1)}s · classical best: {prettyModel(cls.model)}
          </div>
        </section>

        <section id="predict" className="predict-section">
          <div className="predict-head">
            <span className="mono-eyebrow">// RUN DIAGNOSTICS · 5 DISEASES · 8-QUBIT VQC</span>
            <h2 className="predict-title">Fire Your Own<br />Vector.</h2>
          </div>

          <div className="dataset-tabs" role="tablist">
            {DATASETS.map((d, i) => (
              <button key={d.id} role="tab" aria-selected={dataset === d.id}
                className={`ds-tab${dataset === d.id ? ' on' : ''}`}
                onClick={() => switchDataset(d.id)}>
                <span className="ds-idx">{String(i + 1).padStart(2, '0')}</span> {d.label}
              </button>
            ))}
          </div>

          <div className="fields-grid">
            {fields.map(f => (
              <label key={f.k} className="field">
                <span className="field-label">{f.label} <em>{f.unit}</em></span>
                <input type="number" value={form[f.k] ?? ''} min={f.min} max={f.max}
                  onChange={e => setForm(s => ({ ...s, [f.k]: e.target.value }))}
                  placeholder={String(f.ex)} />
                <span className="field-help">{f.help}</span>
              </label>
            ))}
          </div>

          <div className="fire-row">
            <button className="fire-btn" onClick={predict} disabled={loading}>
              {loading ? 'Colliding…' : '● Fire Through Detector →'}
            </button>
            <button className="ghost-btn" onClick={fillExample}>Load Example</button>
            <button className="ghost-btn" onClick={clearForm}>Reset</button>
            {error && <span role="alert" className="err">{error}</span>}
          </div>

          {res && (
            <div className="result">
              <div className="risk">Risk: <strong>{res.risk}</strong></div>
              <div className="rec">
                <div><b>Classical</b> ({res.ml_model}) — {res.ml_prediction === 1 ? 'POSITIVE' : 'NEGATIVE'} · {(res.ml_probability * 100).toFixed(1)}%</div>
                <div><b>Quantum</b> ({res.qml_model}) — {res.qml_prediction === 1 ? 'POSITIVE' : 'NEGATIVE'} · {(res.qml_probability * 100).toFixed(1)}%</div>
              </div>
              <div className="expl">Top features: {res.explain?.top_features?.join(' · ') || '—'}</div>
            </div>
          )}
        </section>

        <section id="stats" className="stats" ref={statsRef}>
          {STATS.map((s, i) => (
            <div key={s.label} className="stat" style={{ '--d': `${0.5 + i * 0.08}s` }}>
              <span className="stat-glyph">{s.glyph}</span>
              <span className="stat-value">
                {statsInView || !MOTION_ENABLED ? <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} delay={480 + i * 90} started={statsInView} /> : '0'}
              </span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </section>

        <footer className="foot">
          <span>SIH26139 · Egreen Quanta · 8Q VQC · honest benchmark</span>
          <span>BubbledotICG-FinePos by <a href="https://www.onlinewebfonts.com/fonts">OnlineWebFonts</a> (CC BY 4.0)</span>
        </footer>
      </div>
    </>
  )
}
