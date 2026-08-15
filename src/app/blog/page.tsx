import Link from 'next/link'
import Image from 'next/image'
import { createServerClient } from '@supabase/ssr'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog - Stock Market Insights & Investing Guides',
  description: 'In-depth articles on stocks, investing strategies, ETFs, dividends, and US market analysis from Stock Market ROI.',
  alternates: { canonical: 'https://stockmarketroi.com/blog' },
}

interface Post {
  slug: string
  title: string
  excerpt: string
  category: string
  image_url: string | null
  image_alt: string | null
  published_at: string
}

const CATEGORIES = ['All', 'Markets', 'Stocks', 'Investing', 'Finance', 'Banks & Cards', 'Economics', 'Crypto', 'Technology']

function supabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const db = supabase()

  let query = db
    .from('blog_posts')
    .select('slug, title, excerpt, category, image_url, image_alt, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data: posts } = await query
  const active = category ?? 'All'

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-zinc-100">Blog</h1>
      <p className="mb-8 text-zinc-400">Investing guides, market analysis, and financial education.</p>

      {/* Category filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={c === 'All' ? '/blog' : `/blog?category=${encodeURIComponent(c)}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === c
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {!posts?.length ? (
        <p className="text-zinc-500">No posts yet. Check back soon.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: Post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700"
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
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <span className="mb-2 text-xs font-medium text-emerald-400">{post.category}</span>
                <h2 className="mb-2 text-base font-semibold leading-snug text-zinc-100 group-hover:text-emerald-400 transition-colors">
                  {post.title}
                </h2>
                <p className="line-clamp-3 text-sm text-zinc-400">{post.excerpt}</p>
                <span className="mt-auto pt-4 text-xs text-zinc-600">
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
