'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Clock, Tag, ChevronRight } from 'lucide-react'
import type { ArticleMeta } from '@/lib/articles'

function fmtDate(raw: string) {
  if (!raw) return ''
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function NewsPage() {
  const { data, isLoading } = useQuery<ArticleMeta[]>({
    queryKey: ['articles'],
    queryFn:  () => fetch('/api/news/articles').then((r) => r.json()),
    staleTime: Infinity,
  })

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">News &amp; Insights</h1>
        <p className="text-sm text-zinc-400">Articles and publications from Stock Market ROI</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 py-20 text-center">
          <BookOpen className="h-8 w-8 text-zinc-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-400">No articles yet</p>
            <p className="text-xs text-zinc-600">
              Add <code className="font-mono">.mdx</code> files to{' '}
              <code className="font-mono">content/posts/</code> to publish.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((a) => (
            <Link
              key={a.slug}
              href={`/news/${a.slug}`}
              className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all"
            >
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
      )}
    </div>
  )
}
