'use client'
import Link from 'next/link'
import { CoinImage } from '@/components/crypto/CoinImage'
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { useKrakenTicker } from '@/lib/hooks/useKrakenTicker'
import { AddTransactionModal } from '@/components/portfolio/AddTransactionModal'
import { WatchlistButton } from '@/components/watchlist/WatchlistButton'
import { AlertButton } from '@/components/watchlist/AlertButton'
import type { CryptoDetail, CryptoHistoryBar } from '@/types/crypto'
import { SupplyCard }        from '@/components/crypto/SupplyCard'
import { ExchangeListings }  from '@/components/crypto/ExchangeListings'
import { SimilarCoins }      from '@/components/crypto/SimilarCoins'
import { ROICalculator }     from '@/components/crypto/ROICalculator'
import { WidgetBoundary }    from '@/components/ui/WidgetBoundary'
import { StockAIInsight }      from '@/components/stock/StockAIInsight'
import { StockRelatedPosts }   from '@/components/stock/StockRelatedPosts'
import { CryptoBlogPosts }     from '@/components/crypto/CryptoBlogPosts'

const PERIODS: { label: string; days: number }[] = [
  { label: '24h', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
]

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(2)}K`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`
}

function fmtPrice(n: number): string {
  if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${n.toFixed(8)}`
}

function PctBadge({ val }: { val: number | undefined }) {
  if (val == null) return null
  const pos = val >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
      pos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
    }`}>
      {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pos ? '+' : ''}{val.toFixed(2)}%
    </span>
  )
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-semibold text-zinc-200">{value}</span>
    </div>
  )
}

function PerformanceCell({ label, val }: { label: string; val: number | null | undefined }) {
  const hasData = val != null
  const isUp = (val ?? 0) >= 0
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-3 text-center">
      <span className="text-[11px] font-medium text-zinc-500">{label}</span>
      {hasData ? (
        <span className={`text-sm font-semibold tabular-nums ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {isUp ? '+' : ''}{val!.toFixed(2)}%
        </span>
      ) : (
        <span className="text-zinc-700 text-xs">—</span>
      )}
    </div>
  )
}

function CryptoPerformanceStrip({ md }: { md: CryptoDetail['market_data'] }) {
  const periods = [
    { label: '24h',  val: md.price_change_percentage_24h  },
    { label: '7d',   val: md.price_change_percentage_7d   },
    { label: '14d',  val: md.price_change_percentage_14d  },
    { label: '30d',  val: md.price_change_percentage_30d  },
    { label: '60d',  val: md.price_change_percentage_60d  },
    { label: '1y',   val: md.price_change_percentage_1y   },
  ]
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-300">Performance</h3>
      </div>
      <div className="grid grid-cols-3 divide-x divide-zinc-800 sm:grid-cols-6">
        {periods.map((p) => (
          <PerformanceCell key={p.label} label={p.label} val={p.val} />
        ))}
      </div>
    </div>
  )
}

// Simple canvas price chart with volume bars
function PriceChart({ bars, isLoading }: { bars: CryptoHistoryBar[]; isLoading: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || isLoading || !Array.isArray(bars) || bars.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    // Split canvas: 72% price, 6% gap, 22% volume
    const PRICE_H = Math.floor(H * 0.72)
    const VOL_H   = Math.floor(H * 0.22)

    const prices  = bars.map((b) => b.price)
    const volumes = bars.map((b) => b.volume)
    const minP  = Math.min(...prices)
    const maxP  = Math.max(...prices)
    const rangeP = maxP - minP || 1
    const maxVol = Math.max(...volumes) || 1

    const toX = (i: number) => (i / (bars.length - 1)) * W
    const toY = (p: number) => PRICE_H - ((p - minP) / rangeP) * (PRICE_H - 12) - 6

    ctx.clearRect(0, 0, W, H)

    const isUp = bars[bars.length - 1].price >= bars[0].price
    const color = isUp ? '#10b981' : '#ef4444'

    // Volume bars (bottom section)
    const barW = Math.max(1, W / bars.length - 0.5)
    bars.forEach((b, i) => {
      const x    = toX(i)
      const bH   = (b.volume / maxVol) * (VOL_H - 4)
      const up   = i === 0 || b.price >= bars[i - 1].price
      ctx.fillStyle = up ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'
      ctx.fillRect(x - barW / 2, H - bH, barW, bH)
    })

    // Price gradient fill (price area only)
    const grad = ctx.createLinearGradient(0, 0, 0, PRICE_H)
    grad.addColorStop(0, isUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.beginPath()
    bars.forEach((b, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(b.price)) : ctx.lineTo(toX(i), toY(b.price))
    })
    ctx.lineTo(W, PRICE_H)
    ctx.lineTo(0, PRICE_H)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Price line
    ctx.beginPath()
    bars.forEach((b, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(b.price)) : ctx.lineTo(toX(i), toY(b.price))
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
  }, [bars, isLoading])

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-lg bg-zinc-800/50" />
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-48 rounded-lg"
      width={900}
      height={192}
      style={{ display: 'block' }}
    />
  )
}

export function CryptoDetailClient({ id }: { id: string }) {
  const [days, setDays]           = useState(30)
  const [showAddTx, setShowAddTx] = useState(false)

  const { data: coin, isLoading: coinLoading } = useQuery<CryptoDetail>({
    queryKey: ['crypto-coin', id],
    queryFn: () => fetch(`/api/crypto/${id}`).then((r) => r.json()),
    staleTime: 55_000,
  })

  const { data: history, isLoading: histLoading } = useQuery<CryptoHistoryBar[]>({
    queryKey: ['crypto-history', id, days],
    queryFn: () => fetch(`/api/crypto/${id}/history?days=${days}`).then((r) => r.json()),
    staleTime: 55_000,
  })

  const tickers = useKrakenTicker(coin ? [coin.symbol] : [])
  const live = coin ? tickers.get(coin.symbol) : undefined

  const price  = live ? live.price  : coin?.market_data.current_price ?? 0
  const pct24h = live ? live.priceChangePercent : coin?.market_data.price_change_percentage_24h

  if (coinLoading) {
    return (
      <main className="mx-auto max-w-screen-xl px-4 py-6 space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-zinc-800/50" />
        <div className="h-48 rounded-xl bg-zinc-800/50" />
      </main>
    )
  }

  if (!coin) {
    return (
      <main className="mx-auto max-w-screen-xl px-4 py-6">
        <p className="text-zinc-400">Coin not found.</p>
        <Link href="/crypto" className="text-emerald-400 hover:underline text-sm">← Back to Crypto</Link>
      </main>
    )
  }

  const md = coin.market_data

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <Link href="/crypto" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Crypto
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <CoinImage src={coin.image.large} symbol={coin.symbol} size={56} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-white">{coin.name}</h1>
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold uppercase text-zinc-400">
                {coin.symbol}
              </span>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                Rank #{md.market_cap_rank}
              </span>
              {coin.homepage && (
                <a
                  href={coin.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-white">
              {fmtPrice(price)}
              {live && <span className="ml-1.5 text-sm text-emerald-400 animate-pulse">●</span>}
            </span>
            <PctBadge val={pct24h} />
          </div>
          <div className="flex items-center gap-1">
            <WatchlistButton
              symbol={coin.symbol.toUpperCase()}
              name={coin.name}
              asset_type="crypto"
              coingeckoId={coin.id}
              image={coin.image.large}
            />
            <AlertButton
              symbol={coin.symbol.toUpperCase()}
              name={coin.name}
              asset_type="crypto"
              coingeckoId={coin.id}
              image={coin.image.large}
              currentPrice={price}
            />
            <button
              onClick={() => setShowAddTx(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add to Portfolio
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-200">Price Chart</h2>
          <div className="flex items-center gap-1">
            {PERIODS.map(({ label, days: d }) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  days === d
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <PriceChart bars={Array.isArray(history) ? history : []} isLoading={histLoading} />
      </div>

      {/* Performance strip — below chart, same style as stocks */}
      <CryptoPerformanceStrip md={md} />

      <WidgetBoundary label="AI Insight">
        <StockAIInsight symbol={coin.id} apiPath={`/api/crypto/${coin.id}/insight`} />
      </WidgetBoundary>

      <WidgetBoundary label="Related Articles">
        <StockRelatedPosts symbol={coin.symbol.toUpperCase()} />
      </WidgetBoundary>

      <WidgetBoundary label="Latest Crypto Analysis">
        <CryptoBlogPosts />
      </WidgetBoundary>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Market Stats */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Market Stats</h3>
          <StatRow label="Market Cap" value={fmt(md.market_cap)} />
          <StatRow label="24h Volume" value={fmt(md.total_volume)} />
          <StatRow label="24h High" value={fmtPrice(md.high_24h)} />
          <StatRow label="24h Low" value={fmtPrice(md.low_24h)} />
          <StatRow label="Circulating Supply" value={`${(md.circulating_supply / 1e6).toFixed(2)}M ${coin.symbol.toUpperCase()}`} />
          <StatRow label="Max Supply" value={md.max_supply ? `${(md.max_supply / 1e6).toFixed(2)}M` : '∞'} />
        </div>

        {/* All-Time Records */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">All-Time Records</h3>
          <StatRow label="ATH" value={fmtPrice(md.ath)} />
          <StatRow label="ATH Change" value={<PctBadge val={md.ath_change_percentage} />} />
          <StatRow label="ATH Date" value={new Date(md.ath_date).toLocaleDateString()} />
          <StatRow label="ATL" value={fmtPrice(md.atl)} />
          <StatRow label="ATL Change" value={<PctBadge val={md.atl_change_percentage} />} />
          <StatRow label="ATL Date" value={new Date(md.atl_date).toLocaleDateString()} />
        </div>
      </div>

      <WidgetBoundary label="Supply">
        <SupplyCard coin={coin} />
      </WidgetBoundary>

      <WidgetBoundary label="ROI Calculator">
        <ROICalculator coin={coin} />
      </WidgetBoundary>

      <WidgetBoundary label="Where to Buy">
        <ExchangeListings coinId={coin.id} />
      </WidgetBoundary>

      <WidgetBoundary label="Similar Coins">
        <SimilarCoins coinId={coin.id} marketCap={md.market_cap} />
      </WidgetBoundary>


      {/* Description — strip HTML tags before rendering to prevent XSS */}
      {coin.description && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-200">About {coin.name}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed line-clamp-6">
            {coin.description.replace(/<[^>]*>/g, '')}
          </p>
        </div>
      )}

      {/* Categories */}
      {coin.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {coin.categories.slice(0, 8).map((cat) => (
            <span key={cat} className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
              {cat}
            </span>
          ))}
        </div>
      )}

      {showAddTx && (
        <AddTransactionModal
          defaultSymbol={coin.symbol.toUpperCase()}
          defaultName={coin.name}
          defaultAssetType="crypto"
          defaultCoingeckoId={coin.id}
          defaultImage={coin.image.large}
          onClose={() => setShowAddTx(false)}
        />
      )}
    </main>
  )
}
