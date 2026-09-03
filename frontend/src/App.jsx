// Router shell — / is Landing (info + scroll story), /detect is the working page.
// 25-line custom router kept (no react-router) per frontend-plan.md §3.
import { Toaster } from 'sonner'
import { useRoute } from './router'
import Detect from './routes/Detect'
import Landing from './routes/Landing'

export default function App() {
  const route = useRoute()
  const isDetect = route.startsWith('/detect')
  return (
    <>
      {isDetect ? <Detect /> : <Landing />}
      <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: '11px' } }} />
    </>
  )
}
