'use client'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface NewsItem {
  title: string
  url: string
  image: string | null
  source: string
  publishedAt: string
  summary: string
  sentiment: 'Positive' | 'Negative' | 'Neutral'
  tickers: string[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const SENTIMENT_CONFIG = {
  Positive: { icon: TrendingUp,   cls: 'text-emerald-400' },
  Negative: { icon: TrendingDown, cls: 'text-red-400'     },
  Neutral:  { icon: Minus,        cls: 'text-zinc-500'    },
}

export function StockNews({ symbol }: { symbol: string }) {
  const { data, isLoading, isError } = useQuery<NewsItem[]>({
    queryKey: ['stock-news', symbol],
    queryFn: async () => {
      const r = await fetch(`/api/stocks/news?symbol=${symbol}`)
      if (!r.ok) throw new Error('failed')
      return r.json()
    },
    staleTime: 1000 * 60 * 15,
    retry: 0,
  })

  if (isError || (!isLoading && (!data || data.length === 0))) return null

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-sky-400" />
        <h2 className="text-sm font-semibold text-zinc-200">Latest News</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800/60">
          {(data ?? []).slice(0, 5).map((item, i) => {
            const cfg = SENTIMENT_CONFIG[item.sentiment]
            const Icon = cfg.icon
            return (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3"
                >
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="h-14 w-20 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-zinc-200 group-hover:text-white line-clamp-2">
                      {item.title}
                    </p>
                    {item.summary && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500 line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-600">
                      <span className="font-medium text-zinc-400">{item.source}</span>
                      <span>·</span>
                      <span>{timeAgo(item.publishedAt)}</span>
                      <Icon className={`ml-auto h-3.5 w-3.5 shrink-0 ${cfg.cls}`} />
                      <ExternalLink className="h-3 w-3 shrink-0 text-zinc-700 group-hover:text-zinc-400" />
                    </div>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
