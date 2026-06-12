'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Newspaper, BookOpen, Clock, ExternalLink, Tag, ChevronRight } from 'lucide-react'
import type { NewsItem } from '@/lib/news-feed'
import type { ArticleMeta } from '@/lib/articles'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(raw: string) {
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(raw: string) {
  const diff = Date.now() - new Date(raw).getTime()
  const h    = Math.floor(diff / 3_600_000)
  if (h < 1)  return 'Just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

// ── Market News ───────────────────────────────────────────────────────────────

function MarketNewsTab() {
  const { data, isLoading, isError } = useQuery<NewsItem[]>({
    queryKey: ['market-news'],
    queryFn:  () => fetch('/api/news/market').then((r) => r.json()),
    staleTime: 900_000,
  })

  if (isLoading) return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800" />
      ))}
    </div>
  )

  if (isError || !data?.length) return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
      Could not load market news. Try again later.
    </div>
  )

  return (
    <div className="divide-y divide-zinc-800/60 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {data.map((item, i) => (
        <a
          key={i}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 px-5 py-4 hover:bg-zinc-800/40 transition-colors group"
        >
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-semibold text-zinc-100 leading-snug group-hover:text-white line-clamp-2">
              {item.title}
            </p>
            {item.description && (
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-zinc-600">
              <span>{item.source}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(item.pubDate)}
              </span>
            </div>
          </div>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 group-hover:text-zinc-400" />
        </a>
      ))}
    </div>
  )
}

// ── Articles ──────────────────────────────────────────────────────────────────

function ArticlesTab() {
  const { data, isLoading } = useQuery<ArticleMeta[]>({
    queryKey: ['articles'],
    queryFn:  () => fetch('/api/news/articles').then((r) => r.json()),
    staleTime: Infinity,
  })

  if (isLoading) return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl bg-zinc-800" />
      ))}
    </div>
  )

  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 py-16 text-center">
      <BookOpen className="h-8 w-8 text-zinc-600" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-400">No articles yet</p>
        <p className="text-xs text-zinc-600">
          Add <code className="font-mono">.mdx</code> files to{' '}
          <code className="font-mono">content/posts/</code> to publish articles.
        </p>
      </div>
    </div>
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {data.map((a) => (
        <Link
          key={a.slug}
          href={`/news/${a.slug}`}
          className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all"
        >
          {/* Tags */}
          {a.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {a.tags.slice(0, 3).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <Tag className="h-2.5 w-2.5" />{t}
                </span>
              ))}
            </div>
          )}

          <h2 className="flex-1 text-sm font-bold text-zinc-100 leading-snug group-hover:text-white line-clamp-3">
            {a.title}
          </h2>

          {a.description && (
            <p className="mt-2 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
              {a.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-600">
            <div className="flex items-center gap-2">
              <span>{a.author}</span>
              <span>·</span>
              <span>{fmtDate(a.date)}</span>
            </div>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {a.readTime} min read
            </span>
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Read article <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'market' | 'articles'

export default function NewsPage() {
  const [tab, setTab] = useState<Tab>('market')

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">News &amp; Insights</h1>
        <p className="text-sm text-zinc-400">Live market news and in-depth articles</p>
      </div>

      {/* Tab bar */}
      <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1 gap-1 w-fit">
        <button
          onClick={() => setTab('market')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'market' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Newspaper className="h-3.5 w-3.5" />
          Market News
        </button>
        <button
          onClick={() => setTab('articles')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'articles' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Articles
        </button>
      </div>

      {tab === 'market'   && <MarketNewsTab />}
      {tab === 'articles' && <ArticlesTab />}
    </div>
  )
}
