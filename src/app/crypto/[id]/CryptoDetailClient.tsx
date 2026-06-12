'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react'
import { useKrakenTicker } from '@/lib/hooks/useKrakenTicker'
import type { CryptoDetail, CryptoHistoryBar } from '@/types/crypto'

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

// Simple canvas price chart
function PriceChart({ bars, isLoading }: { bars: CryptoHistoryBar[]; isLoading: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || isLoading || bars.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const prices = bars.map((b) => b.price)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const rangeP = maxP - minP || 1

    const toX = (i: number) => (i / (bars.length - 1)) * W
    const toY = (p: number) => H - ((p - minP) / rangeP) * (H - 10) - 5

    ctx.clearRect(0, 0, W, H)

    const isUp = bars[bars.length - 1].price >= bars[0].price
    const color = isUp ? '#10b981' : '#ef4444'

    // Fill gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, isUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.beginPath()
    bars.forEach((b, i) => {
      const x = toX(i)
      const y = toY(b.price)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    bars.forEach((b, i) => {
      const x = toX(i)
      const y = toY(b.price)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
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
  const [days, setDays] = useState(30)

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
      <div className="flex flex-wrap items-start gap-4">
        <Image src={coin.image.large} alt={coin.name} width={64} height={64} className="rounded-full" unoptimized />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{coin.name}</h1>
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
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-white">
              {fmtPrice(price)}
              {live && <span className="ml-1.5 text-sm text-emerald-400 animate-pulse">●</span>}
            </span>
            <PctBadge val={pct24h} />
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
        <PriceChart bars={history ?? []} isLoading={histLoading} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Performance */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Performance</h3>
          <StatRow label="24h" value={<PctBadge val={md.price_change_percentage_24h} />} />
          <StatRow label="7d" value={<PctBadge val={md.price_change_percentage_7d} />} />
          <StatRow label="14d" value={<PctBadge val={md.price_change_percentage_14d} />} />
          <StatRow label="30d" value={<PctBadge val={md.price_change_percentage_30d} />} />
          <StatRow label="60d" value={<PctBadge val={md.price_change_percentage_60d} />} />
          <StatRow label="1y" value={<PctBadge val={md.price_change_percentage_1y} />} />
        </div>
      </div>

      {/* Description */}
      {coin.description && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-200">About {coin.name}</h3>
          <p
            className="text-sm text-zinc-400 leading-relaxed line-clamp-6"
            dangerouslySetInnerHTML={{ __html: coin.description }}
          />
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
    </main>
  )
}
