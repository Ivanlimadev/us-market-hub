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
  const months = Math.floor(days / 30)
  return `${months}mo ago`
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
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-14 w-14 rounded-lg bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-full rounded bg-zinc-800" />
                <div className="h-3 w-3/4 rounded bg-zinc-800" />
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
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex gap-3 hover:opacity-80 transition-opacity"
            >
              {post.image_url ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={post.image_url}
                    alt={post.image_alt ?? post.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-zinc-600" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug text-zinc-200 line-clamp-2 group-hover:text-white transition-colors">
                  {post.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                    {post.category}
                  </span>
                  {post.published_at && (
                    <span className="text-[11px] text-zinc-500">{timeAgo(post.published_at)}</span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
