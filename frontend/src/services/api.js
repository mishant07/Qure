import axios from 'axios'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const predict = (dataset, features) => axios.post(`${API}/predict`, {dataset, features})
export const benchmark = () => axios.get(`${API}/benchmark`)
export const health = () => axios.get(`${API}/health`)
