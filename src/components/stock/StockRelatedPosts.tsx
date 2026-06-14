'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, ArrowRight } from 'lucide-react'

interface Post {
  slug: string
  title: string
  excerpt: string | null
  category: string
  image_url: string | null
  image_alt: string | null
  published_at: string | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function StockRelatedPosts({ symbol }: { symbol: string }) {
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['stock-related-posts', symbol],
    queryFn: async () => {
      const r = await fetch(`/api/blog/by-ticker?ticker=${encodeURIComponent(symbol)}&limit=3`)
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
    staleTime: 1000 * 60 * 30,
    retry: 0,
  })

  if (isLoading) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Related Articles</h2>
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse rounded-xl border border-zinc-800 overflow-hidden">
              <div className="h-36 w-full bg-zinc-800" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-3/4 rounded bg-zinc-800" />
                <div className="h-3 w-full rounded bg-zinc-700" />
                <div className="h-3 w-5/6 rounded bg-zinc-700" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (!posts?.length) return null

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-zinc-200">Related Articles</h2>
        <Link
          href="/blog"
          className="ml-auto flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <ul className="space-y-4">
        {posts.map(post => (
          <li key={post.slug} className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900 hover:border-zinc-700 transition-colors">
            {/* Image */}
            {post.image_url ? (
              <div className="relative h-40 w-full">
                <Image
                  src={post.image_url}
                  alt={post.image_alt ?? post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                <span className="absolute bottom-2 left-3 rounded-full bg-violet-500/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  {post.category}
                </span>
              </div>
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-zinc-800">
                <BookOpen className="h-8 w-8 text-zinc-600" />
              </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                {!post.image_url && (
                  <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                    {post.category}
                  </span>
                )}
                {post.published_at && (
                  <span className="text-[11px] text-zinc-500">{timeAgo(post.published_at)}</span>
                )}
              </div>

              <h3 className="text-sm font-semibold leading-snug text-zinc-100 line-clamp-2">
                {post.title}
              </h3>

              {post.excerpt && (
                <p className="text-xs leading-relaxed text-zinc-400 line-clamp-3">
                  {post.excerpt}
                </p>
              )}

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 transition-colors"
              >
                Read full article <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
