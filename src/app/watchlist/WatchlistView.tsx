'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Star, Bell, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { useWatchlistStore } from '@/lib/store/watchlist-store'
import { useWatchlistSync } from '@/lib/hooks/useWatchlistSync'
import { AlertButton } from '@/components/watchlist/AlertButton'
import type { WatchlistItem, PriceAlert } from '@/types/watchlist'
import type { YFBatchQuote } from '@/lib/yahoo-finance'
import type { CryptoMarket } from '@/types/crypto'

function fmtPrice(n: number): string {
  if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (n >= 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(8)}`
}

function ChangePct({ val }: { val: number | undefined }) {
  if (val == null) return <span className="text-zinc-600">—</span>
  const pos = val >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
      {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pos ? '+' : ''}{val.toFixed(2)}%
    </span>
  )
}

function AssetLogo({ item }: { item: WatchlistItem }) {
  if (item.image) {
    return (
      <Image
        src={item.image}
        alt={item.symbol}
        width={32}
        height={32}
        className="rounded-full shrink-0"
        unoptimized
      />
    )
  }
  return (
    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-zinc-800 overflow-hidden">
      <Image
        src={`https://assets.parqet.com/logos/symbol/${item.symbol}?format=png`}
        alt={item.symbol}
        width={32}
        height={32}
        className="object-contain"
        unoptimized
        onError={(e) => {
          const t = e.target as HTMLImageElement
          t.style.display = 'none'
          if (t.parentElement)
            t.parentElement.innerHTML = `<span class="text-xs font-bold text-zinc-400">${item.symbol.slice(0, 2)}</span>`
        }}
      />
    </div>
  )
}

function WatchlistRow({
  item,
  price,
  changePct,
  onRemove,
}: {
  item: WatchlistItem
  price?: number
  changePct?: number
  onRemove: () => void
}) {
  const href = item.asset_type === 'crypto' ? `/crypto/${item.coingeckoId}` : `/stocks/${item.symbol}`

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <AssetLogo item={item} />
      <Link href={href} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <p className="text-sm font-bold text-white">{item.symbol}</p>
        <p className="text-xs text-zinc-500 truncate">{item.name}</p>
      </Link>
      <div className="text-right shrink-0 min-w-[80px]">
        {price != null ? (
          <>
            <p className="text-sm font-mono font-semibold text-zinc-200">{fmtPrice(price)}</p>
            <ChangePct val={changePct} />
          </>
        ) : (
          <p className="text-sm text-zinc-600">—</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <AlertButton
          symbol={item.symbol}
          name={item.name}
          asset_type={item.asset_type}
          coingeckoId={item.coingeckoId}
          image={item.image}
          currentPrice={price}
          size="sm"
        />
        <button
          onClick={onRemove}
          title="Remove from watchlist"
          className="rounded-lg p-1 text-zinc-600 hover:text-red-400 transition-colors"
        >
          <Star className="h-3.5 w-3.5" fill="currentColor" />
        </button>
      </div>
    </div>
  )
}

function AlertRow({
  alert,
  currentPrice,
  onRemove,
}: {
  alert: PriceAlert
  currentPrice?: number
  onRemove: () => void
}) {
  function fmtPrice2(n: number) {
    if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (n >= 0.01) return `$${n.toFixed(4)}`
    return `$${n.toFixed(8)}`
  }

  const isPct  = alert.condition === 'change_up' || alert.condition === 'change_down'
  const isUp   = alert.condition === 'above'    || alert.condition === 'change_up'
  const colorCls = isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'

  // Label for the condition badge
  const condLabel = isPct
    ? (isUp ? `▲ +${alert.targetPct?.toFixed(2)}%` : `▼ -${alert.targetPct?.toFixed(2)}%`)
    : (isUp ? '▲ Above' : '▼ Below')

  // Value shown next to label
  const condValue = isPct
    ? (alert.referencePrice ? `ref. ${fmtPrice2(alert.referencePrice)}` : '')
    : fmtPrice2(alert.targetPrice)

  // Live % change from reference (for % alerts)
  const livePct = isPct && alert.referencePrice && currentPrice != null
    ? ((currentPrice - alert.referencePrice) / alert.referencePrice) * 100
    : null

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
      alert.triggered ? 'border-zinc-800 bg-zinc-900/50 opacity-60' : 'border-zinc-800 bg-zinc-900'
    }`}>
      {alert.image ? (
        <Image src={alert.image} alt={alert.symbol} width={28} height={28} className="rounded-full shrink-0" unoptimized />
      ) : (
        <div className="h-7 w-7 flex items-center justify-center rounded-full bg-zinc-800 shrink-0">
          <Bell className="h-3.5 w-3.5 text-zinc-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white">{alert.symbol}</span>
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${colorCls}`}>
            {condLabel}
          </span>
          <span className="text-xs font-mono text-zinc-400">{condValue}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {currentPrice != null && (
            <span className="text-xs text-zinc-500">
              Current: <span className="text-zinc-400">{fmtPrice2(currentPrice)}</span>
            </span>
          )}
          {livePct != null && (
            <span className={`text-xs font-semibold ${livePct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {livePct >= 0 ? '+' : ''}{livePct.toFixed(2)}% now
            </span>
          )}
          {alert.triggered ? (
            <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
              ✓ Triggered
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
              Active
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        title="Delete alert"
        className="rounded-lg p-1.5 text-zinc-600 hover:text-red-400 transition-colors shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function WatchlistView() {
  const items  = useWatchlistStore((s) => s.items)
  const alerts = useWatchlistStore((s) => s.alerts)
  const { removeFromWatchlist, removeAlert } = useWatchlistSync()
  const getWatchId = useWatchlistStore((s) => s.getWatchId)

  const stockItems  = items.filter((i) => i.asset_type === 'stock')
  const cryptoItems = items.filter((i) => i.asset_type === 'crypto')

  const stockSymbols = stockItems.map((i) => i.symbol)
  const stockKey     = stockSymbols.sort().join(',')

  const { data: stockQuotes } = useQuery<YFBatchQuote[]>({
    queryKey: ['batch-quotes', stockKey],
    queryFn: () => fetch(`/api/batch-quotes?symbols=${stockKey}`).then((r) => r.json()),
    enabled: stockSymbols.length > 0,
    refetchInterval: 60_000,
    staleTime: 55_000,
  })

  const { data: cryptoMarkets } = useQuery<CryptoMarket[]>({
    queryKey: ['crypto-markets'],
    queryFn: () => fetch('/api/crypto/markets?limit=250').then((r) => r.json()),
    staleTime: 55_000,
  })

  function getStockPrice(symbol: string) {
    return stockQuotes?.find((q) => q.symbol === symbol)
  }

  function getCryptoPrice(item: WatchlistItem) {
    return cryptoMarkets?.find(
      (c) => c.id === item.coingeckoId || c.symbol === item.symbol.toLowerCase()
    )
  }

  function getAlertPrice(alert: PriceAlert) {
    if (alert.asset_type === 'stock') {
      return stockQuotes?.find((q) => q.symbol === alert.symbol)?.price
    }
    return cryptoMarkets?.find(
      (c) => c.id === alert.coingeckoId || c.symbol === alert.symbol.toLowerCase()
    )?.current_price
  }

  const isEmpty = items.length === 0

  return (
    <div className="mx-auto max-w-screen-md px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Watchlist</h1>

      {isEmpty && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <Star className="mx-auto h-10 w-10 text-zinc-700 mb-4" />
          <p className="text-zinc-400 text-sm">No assets in watchlist yet.</p>
          <p className="text-zinc-600 text-xs mt-1">
            Click the ★ star on any stock or crypto to add it.
          </p>
        </div>
      )}

      {/* Stocks */}
      {stockItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Stocks</h2>
          <div className="space-y-2">
            {stockItems.map((item) => {
              const q = getStockPrice(item.symbol)
              const id = getWatchId(item.symbol, item.asset_type)
              return (
                <WatchlistRow
                  key={item.id}
                  item={item}
                  price={q?.price}
                  changePct={q?.changePct}
                  onRemove={() => { if (id) removeFromWatchlist(id) }}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Crypto */}
      {cryptoItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Crypto</h2>
          <div className="space-y-2">
            {cryptoItems.map((item) => {
              const c = getCryptoPrice(item)
              const id = getWatchId(item.symbol, item.asset_type)
              return (
                <WatchlistRow
                  key={item.id}
                  item={item}
                  price={c?.current_price}
                  changePct={c?.price_change_percentage_24h}
                  onRemove={() => { if (id) removeFromWatchlist(id) }}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Price Alerts</h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                currentPrice={getAlertPrice(alert)}
                onRemove={() => removeAlert(alert.id)}
              />
            ))}
          </div>
        </section>
      )}

      {!isEmpty && alerts.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <Bell className="mx-auto h-7 w-7 text-zinc-700 mb-3" />
          <p className="text-xs text-zinc-500">No price alerts set.</p>
          <p className="text-xs text-zinc-600 mt-0.5">
            Click the bell icon on any asset to create one.
          </p>
        </div>
      )}
    </div>
  )
}
