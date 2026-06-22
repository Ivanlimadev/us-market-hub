'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home, PiggyBank, Wallet, Newspaper, Menu, X, ChevronRight,
  Bitcoin, Star, Filter, BarChart3, LayoutGrid, GitCompareArrows, Calculator,
  TrendingUp, Settings,
} from 'lucide-react'

/**
 * Floating dock — mirrors the app's navigation (Home · Finance · Portfolio ·
 * News · Menu). A centered pill fixed at the bottom on all breakpoints. The
 * "Menu" button opens a sheet (bottom sheet on mobile, centered dialog on
 * desktop) with the tools list and a Settings shortcut.
 */

const DOCK_ITEMS = [
  { href: '/',          label: 'Home',      icon: Home },
  { href: '/finance',   label: 'Finance',   icon: PiggyBank },
  { href: '/portfolio', label: 'Portfolio', icon: Wallet },
  { href: '/blog',      label: 'News',      icon: Newspaper },
]

// Items alphabetical within each section
const MENU_SECTIONS = [
  {
    title: 'Markets',
    items: [
      { href: '/crypto', label: 'Crypto', icon: Bitcoin },
      { href: '/stocks', label: 'Stocks', icon: TrendingUp },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/calculators', label: 'Calculators',    icon: Calculator },
      { href: '/compare',     label: 'Compare Stocks', icon: GitCompareArrows },
      { href: '/heatmap',     label: 'Market Heatmap', icon: LayoutGrid },
      { href: '/rankings',    label: 'Rankings',       icon: BarChart3 },
      { href: '/screener',    label: 'Stock Screener', icon: Filter },
      { href: '/watchlist',   label: 'Watchlist',      icon: Star },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/account', label: 'Settings', icon: Settings },
    ],
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the sheet whenever the route changes.
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* Floating dock — centered pill at the bottom on all breakpoints. */}
      <nav
        className="fixed bottom-1 left-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-stretch rounded-2xl border border-zinc-800 bg-zinc-950/90 px-1 shadow-xl backdrop-blur-md"
        style={{ marginBottom: 'calc(env(safe-area-inset-bottom) / 2)' }}
        aria-label="Primary"
      >
        {DOCK_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition-colors ${
                active ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
        <button
          onClick={() => setMenuOpen(true)}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition-colors ${
            menuOpen ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
          }`}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>

      {/* Menu — bottom sheet on mobile, centered dialog on desktop */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-zinc-800 bg-zinc-950 shadow-2xl md:max-h-[80vh] md:rounded-2xl md:border"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h2 className="text-lg font-bold text-white">Menu</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-t border-zinc-800" />

            {MENU_SECTIONS.map((section) => (
              <div key={section.title} className="py-2">
                <p className="px-5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {section.title}
                </p>
                {section.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3.5 px-4 py-3 hover:bg-zinc-800/60"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-zinc-800 text-zinc-300">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-white">{label}</span>
                    <ChevronRight className="h-[18px] w-[18px] text-zinc-500" />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
