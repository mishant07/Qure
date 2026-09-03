import axios from 'axios'

// '' = same-origin (vite dev proxy → :8000, see vite.config.js). Set
// VITE_API_URL in prod builds to point at the FastAPI host directly.
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

/** GET /benchmark → per-dataset metrics (falls back to bundled JSON on failure). */
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
