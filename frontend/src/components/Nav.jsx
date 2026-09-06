// Nav — rebuild-style pill header over video background
import { useState } from 'react'
import { Link, useRoute } from '../router'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Overview' },
  { to: '/detect', label: 'Detection' },
  { href: 'https://github.com/aceshaurya/hybrid-qml-disease-detection', label: 'GitHub' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const route = useRoute()

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 sm:px-8"
      style={{ paddingTop: 'clamp(16px, 2.4vh, 28px)', paddingBottom: 'clamp(16px, 2.4vh, 28px)' }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="grid place-items-center rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.16)] transition hover:scale-[1.04]"
        style={{ width: 'clamp(40px, 4.4vw, 46px)', height: 'clamp(40px, 4.4vw, 46px)' }}
        aria-label="Intelligence Designed To Evolve"
      >
        <img src="/assets/logo.webp" alt="" width="52" height="52" style={{ width: '72%', height: '72%', objectFit: 'contain' }} />
      </Link>

      {/* Nav pill — desktop */}
      <nav
        className="hidden max-w-[430px] flex-1 items-center justify-center gap-1 rounded-full bg-white px-2 py-1 shadow-[0_4px_14px_rgba(0,0,0,0.16)] sm:flex"
        style={{ height: 'clamp(44px, 5.2vw, 48px)' }}
      >
        {NAV_LINKS.map((l) =>
          l.href ? (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="relative px-2.5 text-[clamp(13px,1.4vw,15px)] font-medium tracking-[-0.01em] text-[#2e2e2e] opacity-50 transition hover:opacity-75"
              style={{ padding: '0 10px' }}
            >
              {l.label}
            </a>
          ) : (
            <Link
              key={l.label}
              to={l.to}
              className={`relative px-2.5 text-[clamp(13px,1.4vw,15px)] font-medium tracking-[-0.01em] text-[#2e2e2e] transition ${
                route === l.to ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              }`}
              style={{ padding: '0 10px' }}
            >
              {l.label}
              {route === l.to && (
                <span
                  aria-hidden
                  className="absolute bottom-[5px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-black shadow-[-5px_0_0_#000,5px_0_0_#000]"
                />
              )}
            </Link>
          )
        )}
      </nav>

      {/* CTA — desktop */}
      <Link
        to="/detect"
        className="hidden items-center justify-center rounded-full bg-[#28282a] px-5 text-[clamp(13px,1.4vw,15px)] font-medium text-[#c8c8c8] shadow-[0_4px_14px_rgba(0,0,0,0.16)] transition hover:translate-y-[-1px] hover:bg-[#323234] hover:text-white sm:inline-flex"
        style={{ height: 'clamp(44px, 5.2vw, 48px)' }}
      >
        Try detection
      </Link>

      {/* Burger — mobile */}
      <button
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="grid size-12 place-items-center rounded-full bg-[#28282a] sm:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="size-5 text-white" /> : <Menu className="size-5 text-white" />}
      </button>

      {/* Mobile menu */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed left-1/2 z-50 w-[min(560px,92%)] -translate-x-1/2 rounded-[28px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:hidden"
            style={{ top: 'clamp(76px, 8.5vh, 96px)' }}
          >
            {NAV_LINKS.map((l) =>
              l.href ? (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block py-3 text-[15px] font-medium text-[#2e2e2e]"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.to}
                  className="block py-3 text-[15px] font-medium text-[#2e2e2e]"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              )
            )}
            <Link
              to="/detect"
              className="mt-2 block rounded-full bg-[#28282a] py-3 text-center text-[15px] font-medium text-[#c8c8c8]"
              onClick={() => setOpen(false)}
            >
              Try detection
            </Link>
          </div>
        </>
      )}
    </header>
  )
}
