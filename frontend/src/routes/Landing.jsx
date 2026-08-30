/*
  SIH26139 Hybrid QML Platform — Landing
  Spec: single-viewport full-bleed video-background landing, brand type, real benchmark stats.
  Font credit (CC BY 4.0): BubbledotICG-FinePos via https://www.onlinewebfonts.com/fonts
*/
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react'
import { Link } from '../router'
import { FIELD_META, DATASETS } from '../data/fields'
import benchData from '../data/benchmark.json'
import './landing.css'

const MOTION_ENABLED = true // flip to false to revert to CSS-only entrance animations
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4'

// Real benchmark stats (5-dataset honest numbers)
const STATS = (() => {
  const f1 = (ds, which) => benchData[ds]?.[which]?.f1 ?? 0
  const time = (ds) => benchData[ds]?.vqc?.train_time_s ?? 0
  const wins = DATASETS.filter(d => f1(d.id, 'vqc') > f1(d.id, 'classical_best')).length
  const samples = 303 + 768 + 569 + 583 + 195
  return [
    { glyph: '<', value: +(time('heart') + time('diabetes') + time('liver')) / 3, decimals: 1, suffix: 's', label: 'Avg VQC Train Time' },
    { glyph: '%', value: +(f1('heart', 'vqc') * 100).toFixed(1), decimals: 1, suffix: '%', label: 'Heart VQC F1' },
    { glyph: '*', value: wins, decimals: 0, suffix: '/5', label: 'VQC Wins (Honest)' },
    { glyph: '#', value: samples / 1000, decimals: 1, suffix: 'k', label: 'Patient Samples' },
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
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dataset, setDataset] = useState('heart')
  const [form, setForm] = useState({})
  const [res, setRes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fields = FIELD_META[dataset]
  const statsRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, amount: 0.25 })

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
            <Link to="/" className="nav-link active">Home</Link>
            <a href="#predict" className="nav-link">Predict</a>
            <a href="#stats" className="nav-link">Benchmark</a>
            <Link to="/app" className="nav-link">Dashboard</Link>
          </nav>
          <a href="#predict" className="sign-in">Fire Vector</a>
          <button className="burger" aria-expanded={menuOpen} aria-label="Menu" onClick={() => setMenuOpen(o => !o)}>
            <span/><span/><span/>
          </button>
        </motion.header>

        <main className="hero">
          <div className="trust-row">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`avatar a${i}`}><span className="avatar-inner">◉</span></div>
            ))}
            <div className="trust-pill">Trusted by 5 Datasets · 2418 Patients</div>
          </div>

          <h1 className="headline">
            <span className="line">Hybrid Quantum</span>
            <span className="line">Disease Detection</span>
          </h1>
          <p className="subhead">
            Classical baselines vs 8-qubit VQC on the same split — F1, AUC, depth and time reported honestly
            across five UCI clinical datasets.
          </p>
          <a href="#predict" className="cta">Fire the Vector ↓</a>
        </main>

        <section id="predict" className="predict-section">
          <div className="predict-head">
            <span className="mono-eyebrow">// RUN DIAGNOSTICS · 5 DISEASES · 8-QUBIT VQC</span>
            <h2 className="predict-title">Two Reconstructions.<br />One Vector.</h2>
          </div>

          <div className="dataset-tabs" role="tablist">
            {DATASETS.map((d, i) => (
              <button key={d.id} role="tab" aria-selected={dataset === d.id}
                className={`ds-tab${dataset === d.id ? ' on' : ''}`}
                onClick={() => { setDataset(d.id); setForm({}); setRes(null); setError('') }}>
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
