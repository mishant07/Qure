// Router shell — Landing, Triage, Route, Upload, Detect, Report
import { Toaster } from 'sonner'
import { useRoute } from './router'
import Background from './components/Background'
import Detect from './routes/Detect'
import Landing from './routes/Landing'
import Triage from './routes/Triage'
import RouteSelection from './routes/RouteSelection'
import UploadPage from './routes/Upload'
import Report from './routes/Report'
import NotFound from './routes/NotFound'

export default function App() {
  const route = useRoute()
  let page
  if (route === '/' || route === '') page = <Landing />
  else if (route === '/detect') page = <Detect />
  else if (route === '/triage') page = <Triage />
  else if (route === '/route') page = <RouteSelection />
  else if (route === '/upload') page = <UploadPage />
  else if (route === '/report') page = <Report />
  else page = <NotFound />

  return (
    <>
      <Background />
      {page}
      <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: '11px' } }} />
    </>
  )
}