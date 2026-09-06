import axios from 'axios'

// '' = same-origin (vite dev proxy → :8000). Set VITE_API_URL in prod builds
// to point at the FastAPI host directly.
const API = import.meta.env.VITE_API_URL ?? ''

const client = axios.create({ baseURL: API, timeout: 60000 })

/** Normalize axios/network failures into one human sentence. */
function extractError(err) {
  const d = err?.response?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map((x) => x?.msg ?? JSON.stringify(x)).join('; ')
  if (err?.code === 'ECONNABORTED')
    return 'The request timed out — the quantum simulator may be busy. Try again.'
  if (err?.response) return `Backend error ${err.response.status}. Check the API logs.`
  return 'Cannot reach the backend — is it running on port 8000?'
}

/** POST /predict {dataset, features} → verdict payload (throws Error with message). */
export async function predict(dataset, features) {
  try {
    const { data } = await client.post('/predict', { dataset, features })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** Disease-specific prediction: /api/predict/{heart|diabetes|hcv} */
export async function predictDisease(disease, features) {
  try {
    const { data } = await client.post(`/api/predict/${disease}`, { features })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** Multi-disease prediction: /api/predict/all */
export async function predictAll(payload) {
  try {
    const { data } = await client.post('/api/predict/all', payload)
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** GET /triage/questions → 5 rule-based questions */
export async function getTriageQuestions() {
  try {
    const { data } = await client.get('/triage/questions')
    return data.questions
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** POST /api/triage {answers: [{question_id, answer}]} → recommended pathways */
export async function submitTriage(answers) {
  try {
    const { data } = await client.post('/api/triage', { answers })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** POST /api/upload-report?disease=… (multipart) → OCR review table */
export async function uploadReport(disease, file) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await client.post(`/api/upload-report?disease=${disease}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** POST /api/validate-report {disease, features} → validated inputs */
export async function validateReport(disease, features) {
  try {
    const { data } = await client.post('/api/validate-report', { disease, features })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** POST /api/explain {disease, risk, top_features} → RAG-style evidence */
export async function explainResult(disease, risk, topFeatures, modelVersion = 'vqc_4qubit') {
  try {
    const { data } = await client.post('/api/explain', {
      disease, risk, top_features: topFeatures, model_version: modelVersion,
    })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** POST /api/report → structured screening report */
export async function generateReport(disease, inputs, result) {
  try {
    const { data } = await client.post('/api/report', { disease, inputs, result })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** POST /api/quantum-attribution {dataset, features} → XQAI ablation map (throws Error with message). */
export async function quantumAttribution(dataset, features) {
  try {
    const { data } = await client.post('/api/quantum-attribution', { dataset, features })
    return data
  } catch (err) {
    throw new Error(extractError(err))
  }
}

/** GET /benchmark → per-dataset metrics */
export async function benchmark() {
  try {
    const { data } = await client.get('/benchmark')
    return data
  } catch {
    return null
  }
}

/** GET /health → true when backend is reachable. */
export async function health() {
  try {
    await client.get('/health')
    return true
  } catch {
    return false
  }
}