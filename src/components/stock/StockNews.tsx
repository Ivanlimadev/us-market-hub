'use client'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'
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

export function StockNews({ symbol }: { symbol: string }) {
  const { data, isLoading, isError } = useQuery<StockNewsItem[]>({
    queryKey: ['stock-news', symbol],
    queryFn:  () => fetch(`/api/stocks/news?symbol=${symbol}`).then(r => r.json()),
    staleTime: 14 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
  })

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Latest News</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">{symbol} · powered by StockNewsAPI</p>
        </div>
      </div>

      {isLoading && (
        <div className="divide-y divide-zinc-800/50 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-5 py-4">
              <div className="h-16 w-16 shrink-0 rounded-lg bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-zinc-800" />
                <div className="h-3 w-full rounded bg-zinc-800" />
                <div className="h-2.5 w-1/3 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="px-5 py-8 text-center text-xs text-zinc-500">
          Could not load news for {symbol}.
        </div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <div className="px-5 py-8 text-center text-xs text-zinc-500">
          No recent news for {symbol}.
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="divide-y divide-zinc-800/30">
          {data.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 px-5 py-4 hover:bg-zinc-800/40 transition-colors group"
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
                <div className="h-16 w-16 shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs font-bold">
                  {symbol.slice(0, 2)}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                  {item.title}
                </p>
                {item.summary && (
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-zinc-600">{item.source}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-[11px] text-zinc-600">{timeAgo(item.publishedAt)}</span>
                  <SentimentBadge sentiment={item.sentiment} />
                  <ExternalLink className="ml-auto h-3 w-3 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
