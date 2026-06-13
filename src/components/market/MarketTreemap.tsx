'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

// ── Binance-style color scale ──────────────────────────────────────────────
function heatBg(pct: number): string {
  if (pct <= -5)   return '#450a0a'
  if (pct <= -3)   return '#7f1d1d'
  if (pct <= -1.5) return '#991b1b'
  if (pct <= -0.5) return '#7c2222'
  if (pct <   0.5) return '#27272a'
  if (pct <   1.5) return '#14532d'
  if (pct <   3)   return '#166534'
  if (pct <   5)   return '#15803d'
  return                   '#16a34a'
}

function heatText(pct: number): string {
  if (Math.abs(pct) < 0.5) return '#a1a1aa'
  return '#ffffff'
}

// ── Recursive binary partition treemap ────────────────────────────────────
type Rect = { x: number; y: number; w: number; h: number }

function partition(values: number[], rect: Rect): Rect[] {
  if (values.length === 0) return []
  if (values.length === 1) return [rect]

  const total = values.reduce((a, b) => a + b, 0)
  let bestSplit = 1
  let bestScore = Infinity

  for (let i = 1; i < values.length; i++) {
    const lf = values.slice(0, i).reduce((a, b) => a + b, 0) / total
    const rf = 1 - lf
    let score: number
    if (rect.w >= rect.h) {
      const lw = rect.w * lf, rw = rect.w * rf
      score = Math.max(lw / rect.h, rect.h / lw, rw / rect.h, rect.h / rw)
    } else {
      const lh = rect.h * lf, rh = rect.h * rf
      score = Math.max(rect.w / lh, lh / rect.w, rect.w / rh, rh / rect.w)
    }
    if (score < bestScore) { bestScore = score; bestSplit = i }
  }

  const lf = values.slice(0, bestSplit).reduce((a, b) => a + b, 0) / total
  let left: Rect, right: Rect

  if (rect.w >= rect.h) {
    left  = { x: rect.x,             y: rect.y, w: rect.w * lf,       h: rect.h }
    right = { x: rect.x + rect.w * lf, y: rect.y, w: rect.w * (1 - lf), h: rect.h }
  } else {
    left  = { x: rect.x, y: rect.y,             w: rect.w, h: rect.h * lf }
    right = { x: rect.x, y: rect.y + rect.h * lf, w: rect.w, h: rect.h * (1 - lf) }
  }

  return [
    ...partition(values.slice(0, bestSplit), left),
    ...partition(values.slice(bestSplit),    right),
  ]
}

const GAP = 0.25 // percentage gap between blocks

export function MarketTreemap() {
  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey:        ['screener'],
    queryFn:         () => fetch('/api/screener').then(r => r.json()),
    staleTime:       55_000,
    refetchInterval: getPollInterval,
  })

  const sorted = [...(data ?? [])]
    .filter(q => (q.marketCap ?? 0) > 0)
    .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))

  const rects = partition(
    sorted.map(q => q.marketCap ?? 1),
    { x: 0, y: 0, w: 100, h: 100 }
  )

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-200">Market Heatmap</h2>
      </div>

      {/* Treemap */}
      <div className="relative w-full bg-zinc-950" style={{ paddingBottom: '55%' }}>
        <div className="absolute inset-0">
          {isLoading
            ? (
              <div className="w-full h-full animate-pulse bg-zinc-800/40" />
            )
            : sorted.map((q, i) => {
                const r = rects[i]
                if (!r) return null

                const bg   = heatBg(q.changePct)
                const fg   = heatText(q.changePct)
                const sign = q.changePct >= 0 ? '+' : ''

                // Decide how much text to show based on block area
                const big  = r.w > 12 && r.h > 14
                const med  = r.w > 7  && r.h > 9
                const show = r.w > 3  && r.h > 4

                if (!show) return null

                return (
                  <Link
                    key={q.symbol}
                    href={`/stocks/${q.symbol}`}
                    style={{
                      position:        'absolute',
                      left:            `${r.x + GAP}%`,
                      top:             `${r.y + GAP}%`,
                      width:           `${r.w - GAP * 2}%`,
                      height:          `${r.h - GAP * 2}%`,
                      backgroundColor: bg,
                    }}
                    className="flex flex-col items-center justify-center overflow-hidden transition-opacity hover:opacity-75"
                  >
                    <span
                      className="font-bold leading-none truncate px-1"
                      style={{
                        color:    fg,
                        fontSize: big ? '13px' : med ? '10px' : '8px',
                      }}
                    >
                      {q.symbol}
                    </span>
                    {med && (
                      <span
                        className="leading-none mt-0.5"
                        style={{ color: fg, fontSize: big ? '11px' : '9px', opacity: 0.85 }}
                      >
                        {sign}{q.changePct.toFixed(2)}%
                      </span>
                    )}
                    {big && (
                      <span
                        className="leading-none mt-0.5"
                        style={{ color: fg, fontSize: '10px', opacity: 0.6 }}
                      >
                        ${q.price.toFixed(2)}
                      </span>
                    )}
                  </Link>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}
