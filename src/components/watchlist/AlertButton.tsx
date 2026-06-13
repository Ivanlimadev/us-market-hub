'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useWatchlistStore } from '@/lib/store/watchlist-store'
import { AlertModal } from './AlertModal'

interface Props {
  symbol: string
  name: string
  asset_type: 'stock' | 'crypto'
  coingeckoId?: string
  image?: string
  currentPrice?: number
  size?: 'sm' | 'md'
  className?: string
}

export function AlertButton({
  symbol,
  name,
  asset_type,
  coingeckoId,
  image,
  currentPrice,
  size = 'md',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const getAlertsForSymbol = useWatchlistStore((s) => s.getAlertsForSymbol)
  const activeCount = getAlertsForSymbol(symbol, asset_type).filter((a) => !a.triggered).length

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const btnSize  = size === 'sm' ? 'p-1'         : 'p-1.5'

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        title="Price alerts"
        className={`relative rounded-lg transition-colors ${btnSize} ${
          activeCount > 0
            ? 'text-amber-400 hover:text-amber-300'
            : 'text-zinc-500 hover:text-zinc-300'
        } ${className}`}
      >
        <Bell className={iconSize} />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
            {activeCount > 9 ? '9+' : activeCount}
          </span>
        )}
      </button>

      {open && (
        <AlertModal
          symbol={symbol}
          name={name}
          asset_type={asset_type}
          coingeckoId={coingeckoId}
          image={image}
          currentPrice={currentPrice}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
