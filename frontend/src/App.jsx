// Router shell — / is Landing (brand), /app is Dashboard (collider predict).
// The original collider thesis comment lives at the top of routes/Dashboard.jsx.
import { useRoute } from './router'
import Dashboard from './routes/Dashboard'
import Landing from './routes/Landing'

export default function App() {
  const route = useRoute()
  if (route.startsWith('/app')) return <Dashboard />
  return <Landing />
}
