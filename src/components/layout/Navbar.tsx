'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { TrendingUp, Menu, X } from 'lucide-react'
import { formatMarketStatus, isMarketOpen } from '@/lib/market-hours'

const NAV_LINKS = [
  { href: '/', label: 'Markets' },
  { href: '/stocks', label: 'Stocks' },
  { href: '/screener', label: 'Screener' },
  { href: '/heatmap', label: 'Heatmap' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/compare', label: 'Compare' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/portfolio', label: 'Portfolio' },
]

export function Navbar() {
  const pathname = usePathname()
  const open = isMarketOpen()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-white shrink-0">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span>US Market Hub</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Market status + hamburger */}
          <div className="ml-auto flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                open
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="hidden sm:inline">{formatMarketStatus()}</span>
              <span className="sm:hidden">{open ? 'Open' : 'Closed'}</span>
            </span>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          {/* Panel */}
          <nav className="absolute left-0 right-0 top-14 border-b border-zinc-800 bg-zinc-950 px-4 py-3 shadow-xl">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
