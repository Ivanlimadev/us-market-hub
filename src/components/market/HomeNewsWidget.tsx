'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Minus, ExternalLink, ArrowRight } from 'lucide-react'
import type { StockNewsItem } from '@/app/api/stocks/news/route'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor(diff / 60_000)
  if (h >= 24) return `${Math.floor(h / 24)}d ago`
  if (h >= 1)  return `${h}h ago`
  return `${m}m ago`
}

function SentimentDot({ sentiment }: { sentiment: StockNewsItem['sentiment'] }) {
  if (sentiment === 'Positive') return <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
  if (sentiment === 'Negative') return <TrendingDown className="h-3 w-3 text-red-400 shrink-0" />
  return <Minus className="h-3 w-3 text-zinc-600 shrink-0" />
}

export function HomeNewsWidget() {
  const { data, isLoading } = useQuery<StockNewsItem[]>({
    queryKey: ['market-news'],
    queryFn:  () => fetch('/api/news/market').then(r => r.json()),
    staleTime: 14 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
    select: (d) => d.slice(0, 5),
  })

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Market News</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Top stories today</p>
        </div>
        <Link
          href="/news"
          className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="divide-y divide-zinc-800/50 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-4/5 rounded bg-zinc-800" />
                <div className="h-2.5 w-1/3 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* News list */}
      {!isLoading && data && (
        <div className="divide-y divide-zinc-800/30">
          {data.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors group"
            >
              {/* Thumbnail */}
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-12 w-12 shrink-0 rounded-lg object-cover bg-zinc-800"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-800" />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                  {item.title}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-600">
                  <SentimentDot sentiment={item.sentiment} />
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>{timeAgo(item.publishedAt)}</span>
                </div>
              </div>

              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
