'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, TrendingUp, TrendingDown, Minus, Newspaper } from 'lucide-react'
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

type Filter = 'all' | 'Positive' | 'Negative' | 'Neutral'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'Positive', label: 'Bullish' },
  { key: 'Negative', label: 'Bearish' },
  { key: 'Neutral',  label: 'Neutral' },
]

function NewsCard({ item }: { item: StockNewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all overflow-hidden"
    >
      {/* Thumbnail */}
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-44 object-cover bg-zinc-800"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="w-full h-44 bg-zinc-800 flex items-center justify-center">
          <Newspaper className="h-8 w-8 text-zinc-700" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h2 className="text-sm font-bold text-zinc-100 leading-snug line-clamp-3 group-hover:text-white transition-colors">
          {item.title}
        </h2>

        {item.summary && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {item.summary}
          </p>
        )}

        {/* Tickers */}
        {item.tickers.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {item.tickers.slice(0, 4).map(t => (
              <span key={t} className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 min-w-0">
            <span className="truncate">{item.source}</span>
            <span>·</span>
            <span className="shrink-0">{timeAgo(item.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <SentimentBadge sentiment={item.sentiment} />
            <ExternalLink className="h-3 w-3 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
          </div>
        </div>
      </div>
    </a>
  )
}

export default function NewsPage() {
  const [filter, setFilter] = useState<Filter>('all')

  const { data, isLoading, isError, refetch } = useQuery<StockNewsItem[]>({
    queryKey: ['market-news'],
    queryFn:  () => fetch('/api/news/market').then(r => r.json()),
    staleTime: 14 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
  })

  const filtered = (data ?? []).filter(
    item => filter === 'all' || item.sentiment === filter
  )

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Market News</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Live market updates · refreshes every 15 min
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="h-44 animate-pulse bg-zinc-800" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-3/4 rounded animate-pulse bg-zinc-800" />
                <div className="h-3 w-full rounded animate-pulse bg-zinc-800" />
                <div className="h-3 w-1/2 rounded animate-pulse bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-sm text-zinc-500">Could not load market news.</p>
          <button onClick={() => refetch()} className="text-xs text-emerald-400 hover:underline">
            Try again
          </button>
        </div>
      )}

      {/* Empty filter result */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-sm text-zinc-500">No {filter === 'all' ? '' : filter.toLowerCase()} news at the moment.</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, i) => (
            <NewsCard key={i} item={item} />
          ))}
        </div>
      )}

      <p className="text-center text-[11px] text-zinc-700">
        News provided by StockNewsAPI · click any article to read the full story on the original source
      </p>
    </div>
  )
}
