// Fixed chrome per DESIGN.md: black global nav (44px, pure #000) + frosted
// parchment sub-nav (52px, blur). Hairline only — never a shadow.
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, useRoute } from '../router'
import { Button } from './ui/button'

const SUB_LINKS = [
  { href: '/#story', label: 'The journey' },
  { href: '/#how', label: 'How it works' },
  { href: '/#benchmark', label: 'Benchmarks' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const route = useRoute()
  const onDetect = route.startsWith('/detect')

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-void text-white">
        <nav aria-label="Global" className="mx-auto flex h-11 max-w-[1024px] items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 py-2" aria-label="Hybrid Quantum ML home">
            <svg viewBox="0 0 32 32" className="size-4" aria-hidden="true">
              <circle cx="16" cy="16" r="12" fill="none" stroke="#fff" strokeWidth="2.5" />
              <circle cx="16" cy="16" r="4" fill="#2997ff" />
            </svg>
            <span className="text-nav-link tracking-wide">Hybrid QML</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <Link to="/" className="text-nav-link text-body-muted py-2 hover:text-white">
              Overview
            </Link>
            <Link to="/detect" className="text-nav-link text-body-muted py-2 hover:text-white">
              Detection
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-nav-link text-body-muted py-2 hover:text-white">
              GitHub
            </a>
          </div>

          <button
            className="-mr-2 flex size-11 items-center justify-center text-body-muted hover:text-white md:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {open && (
          <div className="border-t border-white/10 bg-void px-5 pb-5 pt-2 md:hidden">
            <Link to="/" className="block py-3 text-body text-white" onClick={() => setOpen(false)}>
              Overview
            </Link>
            <Link to="/detect" className="block py-3 text-body text-white" onClick={() => setOpen(false)}>
              Detection
            </Link>
          </div>
        )}
      </header>

      {/* frosted sub-nav — page-context bar with pill CTA */}
      <div className="fixed inset-x-0 top-11 z-40 border-b border-hairline bg-parchment/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[52px] max-w-[1024px] items-center justify-between px-5">
          <Link to={onDetect ? '/detect' : '/'} className="text-tagline text-ink">
            {onDetect ? 'Detection' : 'Hybrid QML'}
          </Link>

          <div className="flex items-center gap-6">
            {!onDetect && (
              <nav aria-label="Section" className="hidden items-center gap-6 lg:flex">
                {SUB_LINKS.map((l) => (
                  <a key={l.href} href={l.href} className="text-caption text-ink-muted-80 py-2 hover:text-ink">
                    {l.label}
                  </a>
                ))}
              </nav>
            )}
            {onDetect && (
              <span className="hidden text-caption text-ink-muted-48 sm:block">
                5 datasets · 8-qubit VQC · 512 shots
              </span>
            )}
            <Button asChild size="sm" className="rounded-pill">
              <Link to="/detect">{onDetect ? 'Run a vector' : 'Try detection'}</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}