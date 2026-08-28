import { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App(){
  const [dataset,setDataset]=useState('heart')
  const [form,setForm]=useState({})
  const [res,setRes]=useState(null)
  const [bench,setBench]=useState(null)

  const heartFields = ["age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal"]
  const diabFields = ["Pregnancies","Glucose","BloodPressure","SkinThickness","Insulin","BMI","DiabetesPedigreeFunction","Age"]
  const fields = dataset==='heart'? heartFields: diabFields

  const predict = async()=>{
    const {data}= await axios.post(`${API}/predict`, {dataset, features: form})
    setRes(data)
  }
  const loadBench = async()=>{
    const {data}= await axios.get(`${API}/benchmark`)
    setBench(data.report)
  }

  return (
    <div style={{fontFamily:'system-ui', padding:24, maxWidth:900, margin:'auto'}}>
      <h1>SIH26139 Hybrid QML Platform — Heart + Diabetes</h1>
      <p><b>Team:</b> you, Musa, Ashutosh, Anmol, Abdul, Mishti | <a href="/docs/MERGED_CHECKLIST.md">Checklist</a></p>
      <div>
        <label>Dataset: </label>
        <select value={dataset} onChange={e=>{setDataset(e.target.value); setForm({}); setRes(null)}}>
          <option value="heart">Heart (UCI Cleveland)</option>
          <option value="diabetes">Diabetes (Pima)</option>
        </select>
        <button onClick={loadBench} style={{marginLeft:12}}>Load Benchmark</button>
      </div>
      {bench && <pre style={{background:'#f5f5f5', padding:12, whiteSpace:'pre-wrap'}}>{bench}</pre>}
      <h2>Patient Input ({dataset})</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
        {fields.map(f=>(
          <label key={f}>{f}: <input value={form[f]||''} onChange={e=>setForm({...form,[f]:e.target.value})} placeholder={f}/></label>
        ))}
      </div>
      <button onClick={predict} style={{marginTop:12, padding:'8px 16px'}}>Analyze — ML + QML</button>
      {res && (
        <div style={{marginTop:16, border:'1px solid #ddd', padding:12}}>
          <h3>Results — Risk: {res.risk}</h3>
          <p><b>Classical ({res.ml_model}):</b> {res.ml_prediction} prob {res.ml_probability.toFixed(2)}</p>
          <p><b>Quantum ({res.qml_model}):</b> {res.qml_prediction} prob {res.qml_probability.toFixed(2)}</p>
          <p><b>Explain:</b> {res.explain.top_features.join(', ')} — {res.explain.note}</p>
        </div>
      )}
      <hr style={{marginTop:24}}/>
      <p><i>Core flow: {fields.length}→ scaler→PCA8 → SVM/RF vs VQC/QSVM → benchmark → risk</i></p>
    </div>
  )
}
