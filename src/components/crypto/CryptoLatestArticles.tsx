'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'

interface BlogPost {
  slug: string
  title: string
  excerpt: string | null
  image_url: string | null
  image_alt: string | null
  category: string
  published_at: string
}

export function CryptoLatestArticles() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['crypto-latest-articles'],
    queryFn: async () => {
      const res = await fetch('/api/blog/latest?limit=20')
      const all = await res.json()
      // Filter for Crypto category only
      return Array.isArray(all) ? all.filter((p: BlogPost) => p.category === 'Crypto').slice(0, 9) : []
    },
    staleTime: 10 * 60_000,
    refetchInterval: 30 * 60_000,
    retry: 1,
  })

  // Don't render if no crypto posts
  if (!isLoading && (!posts || posts.length === 0)) {
    return null
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Latest Crypto Analysis</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="h-44 rounded-xl bg-zinc-800" />
              <div className="h-3 w-3/4 rounded bg-zinc-800" />
              <div className="h-3 w-1/2 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Latest Crypto Analysis</h2>
        <Link
          href="/blog?category=Crypto"
          className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts?.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors hover:bg-zinc-800/50"
          >
            {post.image_url && (
              <div className="relative h-44 w-full overflow-hidden bg-zinc-800">
                <Image
                  src={post.image_url}
                  alt={post.image_alt ?? post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <span className="mb-2 text-xs font-medium text-orange-400">Crypto</span>
              <h3 className="mb-2 text-sm font-semibold leading-snug text-zinc-100 group-hover:text-white transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="line-clamp-2 text-xs text-zinc-400">{post.excerpt}</p>
              <span className="mt-auto pt-3 text-xs text-zinc-600">
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
