'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'

interface BlogPost {
  slug:         string
  title:        string
  excerpt:      string | null
  image_url:    string | null
  published_at: string
  category:     string
}

const CAT_COLORS: Record<string, string> = {
  Stocks:     'text-emerald-400 bg-emerald-400/10',
  Investing:  'text-amber-400 bg-amber-400/10',
  Markets:    'text-indigo-400 bg-indigo-400/10',
  Finance:    'text-violet-400 bg-violet-400/10',
  Economics:  'text-red-400 bg-red-400/10',
  Crypto:     'text-orange-400 bg-orange-400/10',
  Technology: 'text-blue-400 bg-blue-400/10',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (d >= 1) return `${d}d ago`
  if (h >= 1) return `${h}h ago`
  return `${Math.floor(diff / 60_000)}m ago`
}

export function HomeBlogWidget() {
  const { data, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['home-blog-latest'],
    queryFn:  () => fetch('/api/blog/latest?limit=5').then(r => r.json()),
    staleTime: 15 * 60_000,
    refetchInterval: 20 * 60_000,
    retry: 1,
    select: (d) => (Array.isArray(d) ? d.slice(0, 5) : []),
  })

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Our Blog</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Latest analysis & insights</p>
        </div>
        <Link
          href="/blog"
          className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Loading skeleton */}
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

      {/* Posts list */}
      {!isLoading && data && data.length > 0 && (
        <div className="divide-y divide-zinc-800/30">
          {data.map((post, i) => {
            const catCls = CAT_COLORS[post.category] ?? 'text-emerald-400 bg-emerald-400/10'
            return (
              <Link
                key={i}
                href={`/blog/${post.slug}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors group"
              >
                {/* Thumbnail */}
                {post.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover bg-zinc-800"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-800" />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-snug">{post.excerpt}</p>
                  )}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${catCls}`}>
                      {post.category}
                    </span>
                    <span className="text-[11px] text-zinc-600">{timeAgo(post.published_at)}</span>
                  </div>
                </div>

                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="px-5 py-8 text-center text-sm text-zinc-600">
          No articles found.
        </div>
      )}
    </div>
  )
}
