'use client'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, TrendingUp, TrendingDown, Minus, Newspaper } from 'lucide-react'
import { usePortfolioStore } from '@/lib/store/portfolio-store'
import { useMemo } from 'react'
import type { StockNewsItem } from '@/app/api/stocks/news/route'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor(diff / 60_000)
  if (h >= 24) return `${Math.floor(h / 24)}d ago`
  if (h >= 1)  return `${h}h ago`
  return `${m}m ago`
}

function SentimentBadge({ sentiment }: { sentiment: StockNewsItem['sentiment'] }) {
  if (sentiment === 'Positive') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
      <TrendingUp className="h-2.5 w-2.5" /> Bullish
    </span>
  )
  if (sentiment === 'Negative') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
      <TrendingDown className="h-2.5 w-2.5" /> Bearish
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700/50 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
      <Minus className="h-2.5 w-2.5" /> Neutral
    </span>
  )
}

export function PortfolioNews() {
  const transactions = usePortfolioStore((s) => s.transactions)

  const stockSymbols = useMemo(() =>
    [...new Set(
      transactions
        .filter(t => (t.asset_type ?? 'stock') === 'stock')
        .map(t => t.symbol)
    )],
    [transactions]
  )

  const symbolParam = stockSymbols.slice().sort().join(',')

  const { data, isLoading, isError } = useQuery<StockNewsItem[]>({
    queryKey: ['portfolio-news', symbolParam],
    queryFn:  () => fetch(`/api/stocks/news?symbol=${symbolParam}`).then(r => r.json()),
    staleTime: 14 * 60_000,
    refetchInterval: 15 * 60_000,
    enabled: stockSymbols.length > 0,
    retry: 1,
  })

  if (stockSymbols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center gap-2">
        <Newspaper className="h-8 w-8 text-zinc-600" />
        <p className="text-sm text-zinc-500">Add stocks to your portfolio to see news here.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 animate-pulse">
            <div className="h-16 w-16 shrink-0 rounded-lg bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded bg-zinc-800" />
              <div className="h-3 w-full rounded bg-zinc-800" />
              <div className="h-2.5 w-1/3 rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError || !data?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center gap-2">
        <Newspaper className="h-8 w-8 text-zinc-600" />
        <p className="text-sm text-zinc-500">No recent news for your holdings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Tickers being tracked */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-zinc-500">Tracking:</span>
        {stockSymbols.map(s => (
          <span key={s} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-bold text-zinc-400">
            {s}
          </span>
        ))}
      </div>

      {/* News list */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden divide-y divide-zinc-800/30">
        {data.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 px-4 py-4 hover:bg-zinc-800/40 transition-colors group"
          >
            {/* Thumbnail */}
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.title}
                className="h-16 w-16 shrink-0 rounded-lg object-cover bg-zinc-800"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Newspaper className="h-5 w-5 text-zinc-700" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                {item.title}
              </p>
              {item.summary && (
                <p className="mt-1 text-xs text-zinc-500 line-clamp-1 leading-relaxed">
                  {item.summary}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Tickers mencionados */}
                {item.tickers.slice(0, 3).map(t => (
                  <span key={t} className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
                    {t}
                  </span>
                ))}
                <span className="text-[11px] text-zinc-600">{item.source}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-[11px] text-zinc-600">{timeAgo(item.publishedAt)}</span>
                <SentimentBadge sentiment={item.sentiment} />
                <ExternalLink className="ml-auto h-3 w-3 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
              </div>
            </div>
          </a>
        ))}
      </div>

      <p className="text-center text-[11px] text-zinc-700">
        News provided by StockNewsAPI · click to read full article on original source
      </p>
    </div>
  )
}
