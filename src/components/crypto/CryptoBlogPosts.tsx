'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, ArrowRight } from 'lucide-react'

interface Post {
  slug:         string
  title:        string
  excerpt:      string | null
  image_url:    string | null
  image_alt:    string | null
  published_at: string | null
  category:     string
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30)  return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function CryptoBlogPosts() {
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['crypto-blog-posts'],
    queryFn: () => fetch('/api/blog/latest?category=Crypto&limit=5').then((r) => r.json()),
    staleTime: 15 * 60_000,
    retry: 0,
  })

  if (isLoading) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-orange-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Latest Crypto Analysis</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-16 w-16 shrink-0 rounded-lg bg-zinc-800" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-3/4 rounded bg-zinc-800" />
                <div className="h-3 w-full rounded bg-zinc-700" />
                <div className="h-2.5 w-1/3 rounded bg-zinc-800" />
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
        <BookOpen className="h-4 w-4 text-orange-400" />
        <h2 className="text-sm font-semibold text-zinc-200">Latest Crypto Analysis</h2>
        <Link
          href="/blog"
          className="ml-auto flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <ul className="divide-y divide-zinc-800/50">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="flex gap-3 py-3 hover:opacity-80 transition-opacity group"
            >
              {/* Thumbnail */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                {post.image_url ? (
                  <Image
                    src={post.image_url}
                    alt={post.image_alt ?? post.title}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="h-5 w-5 text-zinc-600" />
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug text-zinc-200 line-clamp-2 group-hover:text-white transition-colors">
                  {post.title}
                </p>
                {post.excerpt && (
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{post.excerpt}</p>
                )}
                <p className="mt-1.5 text-[10px] text-zinc-600">{timeAgo(post.published_at)}</p>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 self-center text-zinc-700 group-hover:text-orange-400 transition-colors" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
