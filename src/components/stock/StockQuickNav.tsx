'use client'
import { useState } from 'react'
import { BarChart3, Coins, Building2, Calculator, Newspaper, Share2, Heart, Check } from 'lucide-react'
import { useWatchlistStore } from '@/lib/store/watchlist-store'
import { useWatchlistSync } from '@/lib/hooks/useWatchlistSync'
import { useAuth } from '@/lib/hooks/useAuth'
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal'

/**
 * Investidor10-style anchor bar: a fixed-dark bar with a gold icon above each
 * label (smooth-scrolls to the matching section), plus heart (watchlist) and
 * share actions on the right. Colors use `neutral` (not remapped by the
 * light-mode zinc inversion in globals.css) so the bar stays dark and labels
 * stay light in both themes; `text-white` would invert to dark and vanish here.
 */

const ITEMS: { label: string; id: string; Icon: typeof BarChart3 }[] = [
  { label: 'Indicators', id: 'indicators', Icon: BarChart3 },
  { label: 'Dividends', id: 'dividends', Icon: Coins },
  { label: 'Company', id: 'company', Icon: Building2 },
  { label: 'Results', id: 'results', Icon: Calculator },
  { label: 'News', id: 'news', Icon: Newspaper },
]

const SQUARE =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 transition-colors hover:bg-neutral-700'

export function StockQuickNav({ symbol, name }: { symbol: string; name: string }) {
  const [copied, setCopied] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  const { user } = useAuth()
  const { addToWatchlist, removeFromWatchlist } = useWatchlistSync()
  const isWatched = useWatchlistStore((s) => s.isWatched(symbol, 'stock'))
  const getWatchId = useWatchlistStore((s) => s.getWatchId)

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleWatch = () => {
    if (!user) { setShowAuth(true); return }
    if (isWatched) {
      const id = getWatchId(symbol, 'stock')
      if (id) removeFromWatchlist(id)
    } else {
      addToWatchlist({ symbol, name, asset_type: 'stock' })
    }
  }

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }
    } catch {
      /* user cancelled the share sheet — ignore */
    }
  }

  return (
    <nav className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-800 px-4 py-3.5 sm:px-6">
      <div className="flex items-center gap-7 overflow-x-auto sm:gap-11">
        {ITEMS.map(({ label, id, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            className="group flex shrink-0 flex-col items-center gap-2"
          >
            <Icon
              className="h-6 w-6 text-[#c8a45d] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110"
              strokeWidth={1.75}
            />
            <span className="text-sm font-semibold text-neutral-100 transition-colors group-hover:text-[#c8a45d]">
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={toggleWatch}
          aria-label={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          className={SQUARE}
        >
          <Heart
            className="h-5 w-5 text-[#c8a45d] transition-transform hover:scale-110"
            strokeWidth={1.75}
            fill={isWatched ? 'currentColor' : 'none'}
          />
        </button>
        <button
          type="button"
          onClick={share}
          aria-label="Share this page"
          title="Share"
          className={SQUARE}
        >
          {copied ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : (
            <Share2 className="h-5 w-5 text-[#c8a45d] transition-transform hover:scale-110" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {showAuth && <AuthRequiredModal feature="watchlist" onClose={() => setShowAuth(false)} />}
    </nav>
  )
}
