'use client'
import { useState } from 'react'
import { Star } from 'lucide-react'
import { useWatchlistStore } from '@/lib/store/watchlist-store'
import { useWatchlistSync } from '@/lib/hooks/useWatchlistSync'
import { useAuth } from '@/lib/hooks/useAuth'
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal'

interface Props {
  symbol: string
  name: string
  asset_type: 'stock' | 'crypto'
  coingeckoId?: string
  image?: string
  size?: 'sm' | 'md'
  className?: string
}

export function WatchlistButton({
  symbol,
  name,
  asset_type,
  coingeckoId,
  image,
  size = 'md',
  className = '',
}: Props) {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { addToWatchlist, removeFromWatchlist } = useWatchlistSync()
  const isWatched = useWatchlistStore((s) => s.isWatched(symbol, asset_type))
  const getWatchId = useWatchlistStore((s) => s.getWatchId)

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const btnSize  = size === 'sm' ? 'p-1'          : 'p-1.5'

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { setShowAuthModal(true); return }
    if (isWatched) {
      const id = getWatchId(symbol, asset_type)
      if (id) removeFromWatchlist(id)
    } else {
      addToWatchlist({ symbol, name, asset_type, coingeckoId, image })
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
        className={`rounded-lg transition-colors ${btnSize} ${
          isWatched
            ? 'text-amber-400 hover:text-amber-300'
            : 'text-zinc-500 hover:text-amber-400'
        } ${className}`}
      >
        <Star className={iconSize} fill={isWatched ? 'currentColor' : 'none'} />
      </button>

      {showAuthModal && (
        <AuthRequiredModal feature="watchlist" onClose={() => setShowAuthModal(false)} />
      )}
    </>
  )
}
