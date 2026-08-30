// Tiny SPA router — no dependency. 40 lines.
import { useState, useEffect } from 'react'

export function useRoute() {
  const [route, setRoute] = useState(window.location.pathname)
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return route
}

export function navigate(to) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function Link({ to, children, ...rest }) {
  const onClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return // let browser handle
    e.preventDefault()
    navigate(to)
  }
  return <a href={to} onClick={onClick} {...rest}>{children}</a>
}