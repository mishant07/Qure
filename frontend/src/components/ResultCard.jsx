export default function ResultCard({res}){
  if(!res) return null
  return (
    <div style={{border:'1px solid #ddd', padding:12, marginTop:12}}>
      <h3>Risk: {res.risk}</h3>
      <p><b>Classical ({res.ml_model}):</b> {res.ml_prediction} prob {res.ml_probability?.toFixed(2)}</p>
      <p><b>Quantum ({res.qml_model}):</b> {res.qml_prediction} prob {res.qml_probability?.toFixed(2)}</p>
      <p><i>Top features:</i> {res.explain?.top_features?.join(', ')}</p>
    </div>
  )
}
