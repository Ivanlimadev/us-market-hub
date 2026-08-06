// v3 - compact card grid (portal-style): smaller cards, more posts, no long summary
'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, ArrowRight } from 'lucide-react'

interface Post {
  slug: string
  title: string
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
      const r = await fetch(`/api/blog/by-ticker?ticker=${encodeURIComponent(symbol)}&limit=6`)
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-zinc-800">
              <div className="aspect-[16/10] w-full bg-zinc-800" />
              <div className="space-y-1.5 p-2.5">
                <div className="h-2.5 w-full rounded bg-zinc-700" />
                <div className="h-2.5 w-2/3 rounded bg-zinc-700" />
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

      {/* Compact grid: small cards, more posts visible at once (portal-style) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {posts.map(post => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-colors hover:border-violet-500/40"
          >
            {post.image_url ? (
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={post.image_url}
                  alt={post.image_alt ?? post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 240px"
                />
                <span className="absolute left-1.5 top-1.5 rounded bg-violet-500/80 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
                  {post.category}
                </span>
              </div>
            ) : (
              <div className="flex aspect-[16/10] w-full items-center justify-center bg-zinc-800">
                <BookOpen className="h-6 w-6 text-zinc-600" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-2.5">
              <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-100 group-hover:text-white">
                {post.title}
              </h3>
              {post.published_at && (
                <span className="mt-auto pt-1.5 text-[10px] text-zinc-500">{timeAgo(post.published_at)}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
