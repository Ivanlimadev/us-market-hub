'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { TrendingUp, LogIn, LogOut, User, Bell, Sun, Moon, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import { GlobalSearch } from './GlobalSearch'
import { formatMarketStatus, isMarketOpen } from '@/lib/market-hours'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useWatchlistStore } from '@/lib/store/watchlist-store'
import { useAlertChecker } from '@/lib/hooks/useAlertChecker'
import { TriggeredAlertsToast } from '@/components/watchlist/TriggeredAlertsToast'

// Markets (home) first, then alphabetical by label
const NAV_LINKS = [
  { href: '/', label: 'Markets' },
  { href: '/blog', label: 'Blog' },
  { href: '/calculators', label: 'Calculators' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/compare', label: 'Compare' },
  { href: '/crypto', label: 'Crypto' },
  { href: '/dxy', label: 'Dollar' },
  { href: '/finance', label: 'Finance' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/screener', label: 'Screener' },
  { href: '/stocks', label: 'Stocks' },
]

export function Navbar() {
  const pathname        = usePathname()
  const router          = useRouter()
  const isCryptoPage    = pathname.startsWith('/crypto')
  const open            = isCryptoPage ? true : isMarketOpen()
  const { user }        = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Alert checker — fires store.triggerAlert when prices cross thresholds
  useAlertChecker()

  // Bell badge: count triggered alerts
  const triggeredCount = useWatchlistStore(
    (s) => s.alerts.filter((a) => a.triggered).length
  )

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const name     = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? ''
  const initials = name.split(/[\s@]/)[0]?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md overflow-hidden" translate="no">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-white shrink-0">
            <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold text-white">Stock Market</span>
              <span className="text-[10px] font-semibold text-amber-400 tracking-widest uppercase">ROI</span>
            </span>
          </Link>

          {/* Desktop nav — shrinkable + horizontally scrollable so a crowded
              link list never pushes the right-side controls off screen */}
          <nav className="hidden min-w-0 items-center gap-1 overflow-x-auto md:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side — shrink-0 keeps the Settings gear (last item) pinned
              on screen even when the nav link list overflows */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* Global search */}
            <GlobalSearch />

            {/* Theme toggle — hidden on mobile (available in drawer) */}
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                {resolvedTheme === 'dark'
                  ? <Sun className="h-4 w-4" />
                  : <Moon className="h-4 w-4" />
                }
              </button>
            )}

            {/* Watchlist bell — hidden on mobile (available in drawer) */}
            <button
              onClick={() => router.push('/watchlist')}
              title="Watchlist & Alerts"
              className="relative hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Bell className="h-4 w-4" />
              {triggeredCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {triggeredCount > 9 ? '9+' : triggeredCount}
                </span>
              )}
            </button>

            {/* Market status */}
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              open ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="hidden sm:inline">
                {isCryptoPage ? 'Crypto · 24/7' : formatMarketStatus()}
              </span>
              <span className="sm:hidden">{open ? 'Open' : 'Closed'}</span>
            </span>

            {/* Auth — desktop */}
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  {initials}
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl py-1">
                      <div className="px-4 py-2 border-b border-zinc-800">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{name}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <User className="h-4 w-4" /> My Account
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden md:flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </Link>
            )}

            {/* Settings — top entry point to the account / settings hub */}
            <Link
              href="/account"
              title="Settings"
              aria-label="Settings"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                pathname === '/account'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Global triggered alerts toast */}
      <TriggeredAlertsToast />
    </>
  )
}
