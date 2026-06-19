import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import type { Metadata } from 'next'
import { fetchStockData } from '@/lib/stock-server'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'
import { RelatedTabs } from './related-tabs'

interface Post {
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  image_url: string | null
  image_alt: string | null
  published_at: string
  seo_title: string | null
  seo_description: string | null
  tickers: string[] | null
}

interface RelatedPost {
  slug: string
  title: string
  excerpt: string | null
  image_url: string | null
  image_alt: string | null
  category: string
}

function supabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabase()
    .from('blog_posts')
    .select('title, seo_title, seo_description, image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!data) return {}
  const title       = data.seo_title ?? data.title
  const description = data.seo_description ?? undefined
  const images      = data.image_url ? [data.image_url] : []
  return {
    title,
    description,
    alternates: { canonical: `https://stockmarketroi.com/blog/${slug}` },
    openGraph:  { title, description, images, type: 'article' },
    twitter:    { card: 'summary_large_image', title, description, images },
  }
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-zinc-100 mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-zinc-100 mt-10 mb-4">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, text, href) => {
      const isInternal = href.includes('stockmarketroi.com')
      return isInternal
        ? `<a href="${href}" class="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">${text}</a>`
        : `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors">${text}</a>`
    })
    .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, (_, text, href) => {
      return `<a href="${href}" class="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">${text}</a>`
    })
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-zinc-300">$1</li>')
    .replace(/(<li[\s\S]+?<\/li>)/g, '<ul class="my-4 space-y-1">$1</ul>')
    .replace(/^(?!<[hul])(.*\S.*)$/gm, '<p class="text-zinc-300 leading-relaxed my-4">$1</p>')
}

function readingTime(content: string): number {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: post } = await supabase()
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single<Post>()

  if (!post) notFound()

  const html = markdownToHtml(post.content)

  // Fetch stock data for the first ticker if post has one
  const primaryTicker = post.tickers?.[0] ?? null
  let stockData: StockDetailData | null = null
  if (primaryTicker) {
    stockData = await fetchStockData(primaryTicker)
  }

  // Calculate 12M price change from EOD history (bars are newest-first)
  let change12m: number | null = null
  if (stockData && stockData.recentEod.length >= 2) {
    const newest = stockData.recentEod[0].close
    const oldest = stockData.recentEod[stockData.recentEod.length - 1].close
    if (oldest > 0) change12m = ((newest - oldest) / oldest) * 100
  }

  // Related posts: same category first, fill with latest if needed
  const { data: sameCat } = await supabase()
    .from('blog_posts')
    .select('slug, title, excerpt, image_url, image_alt, category')
    .eq('status', 'published')
    .eq('category', post.category)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(4)

  let related: RelatedPost[] = (sameCat ?? []) as RelatedPost[]

  if (related.length < 4) {
    const { data: latest } = await supabase()
      .from('blog_posts')
      .select('slug, title, excerpt, image_url, image_alt, category')
      .eq('status', 'published')
      .neq('slug', slug)
      .not('slug', 'in', `(${related.map(p => `"${p.slug}"`).join(',')})`)
      .order('published_at', { ascending: false })
      .limit(4 - related.length)
    related = [...related, ...((latest ?? []) as RelatedPost[])]
  }

  const { data: latestData } = await supabase()
    .from('blog_posts')
    .select('slug, title, excerpt, image_url, image_alt, category')
    .eq('status', 'published')
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(4)
  const latestPosts: RelatedPost[] = (latestData ?? []) as RelatedPost[]

  const jsonLd = {
    '@context':        'https://schema.org',
    '@type':           'Article',
    headline:          post.title,
    description:       post.excerpt,
    image:             post.image_url ?? undefined,
    datePublished:     post.published_at,
    dateModified:      post.published_at,
    author: {
      '@type': 'Person',
      name: 'Ivan Lima',
      url: 'https://stockmarketroi.com/about',
      image: 'https://stockmarketroi.com/ivan-lima.jpg',
      description: 'Systems Analysis & Development student and active US stock market investor since 2018. Founder of Stock Market ROI.',
    },
    publisher:         { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
    mainEntityOfPage:  { '@type': 'WebPage', '@id': `https://stockmarketroi.com/blog/${post.slug}` },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stockmarketroi.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://stockmarketroi.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://stockmarketroi.com/blog/${post.slug}` },
    ],
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Link href="/blog" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        ← Blog
      </Link>

      <span className="mb-3 block text-sm font-medium text-emerald-400">{post.category}</span>
      <h1 className="mb-4 text-3xl font-bold leading-tight text-zinc-100">{post.title}</h1>
      {post.excerpt && (
        <p className="mb-5 text-lg italic leading-relaxed text-zinc-400">{post.excerpt}</p>
      )}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <span>{new Date(post.published_at).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        })}</span>
        <span>·</span>
        <span>{readingTime(post.content)} min read</span>
      </div>

      {post.image_url && (
        <div className="relative mb-8 h-64 w-full overflow-hidden rounded-xl bg-zinc-800 sm:h-80">
          <Image
            src={post.image_url}
            alt={post.image_alt ?? post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <article
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Share buttons */}
      {(() => {
        const pageUrl = `https://stockmarketroi.com/blog/${post.slug}`
        const shareTitle = encodeURIComponent(post.title)
        const shareUrl = encodeURIComponent(pageUrl)
        return (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-zinc-400">Share:</span>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${pageUrl}`)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-2 text-xs font-semibold text-[#25D366] hover:border-[#25D366]/60 transition-colors">
              WhatsApp
            </a>
            <a href={`https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#0088CC]/30 bg-[#0088CC]/10 px-4 py-2 text-xs font-semibold text-[#0088CC] hover:border-[#0088CC]/60 transition-colors">
              Telegram
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-400 transition-colors">
              𝕏 Twitter
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#0077B5]/30 bg-[#0077B5]/10 px-4 py-2 text-xs font-semibold text-[#0077B5] hover:border-[#0077B5]/60 transition-colors">
              LinkedIn
            </a>
          </div>
        )
      })()}

      {/* Tags */}
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-xs font-semibold text-zinc-400">
          #{post.category}
        </span>
        {(post.tickers ?? []).map((t) => (
          <Link key={t} href={`/stocks/${t.toLowerCase()}`} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 hover:border-amber-400 transition-colors">
            ${t}
          </Link>
        ))}
      </div>

      {/* Ticker card — shown when post has a related stock */}
      {stockData && primaryTicker && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-700">
          {/* Header: logo + ticker + name */}
          <div className="flex items-center gap-4 bg-zinc-900 px-5 py-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://assets.parqet.com/logos/symbol/${primaryTicker}?format=png`}
                alt={stockData.name}
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-xl font-extrabold text-zinc-100">{primaryTicker}</p>
              <p className="text-sm text-zinc-400 truncate max-w-xs">{stockData.name}</p>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="bg-[#0F1923] px-5 py-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {/* Price */}
              <div>
                <p className="text-[11px] text-[#6B8BA4]">Price</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  ${stockData.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {/* 12M Change */}
              <div>
                <p className="text-[11px] text-[#6B8BA4]">Chg (12M)</p>
                <p className={`mt-1 text-2xl font-bold flex items-center gap-1 ${change12m == null ? 'text-white' : change12m >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {change12m != null ? (
                    <>
                      {change12m >= 0 ? '▲' : '▼'}
                      {Math.abs(change12m).toFixed(2)}%
                    </>
                  ) : '--'}
                </p>
              </div>
              {/* Net Margin */}
              <div>
                <p className="text-[11px] text-[#6B8BA4]">Net Margin</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {stockData.info?.profitMargin != null
                    ? `${(stockData.info.profitMargin * 100).toFixed(2)}%`
                    : '--'}
                </p>
              </div>
              {/* Dividend Yield */}
              <div>
                <p className="text-[11px] text-[#6B8BA4]">Div. Yield</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {stockData.info?.dividendYield != null
                    ? `${(stockData.info.dividendYield * 100).toFixed(2)}%`
                    : '--'}
                </p>
              </div>
              {/* P/E */}
              <div>
                <p className="text-[11px] text-[#6B8BA4]">P/E</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {stockData.info?.pe != null ? stockData.info.pe.toFixed(2) : '--'}
                </p>
              </div>
              {/* P/B */}
              <div>
                <p className="text-[11px] text-[#6B8BA4]">P/B</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {stockData.info?.priceToBook != null ? stockData.info.priceToBook.toFixed(2) : '--'}
                </p>
              </div>
            </div>

            <Link
              href={`/stocks/${primaryTicker.toLowerCase()}`}
              className="mt-6 block w-full rounded-lg border border-zinc-600 py-3 text-center text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white"
            >
              View all indicators ({primaryTicker})
            </Link>
          </div>
        </div>
      )}

      {/* Related posts com abas Related / Latest */}
      <RelatedTabs related={related} latest={latestPosts} />

      {/* E-E-A-T author section */}
      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Written by</p>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <img
            src="/ivan-lima.jpg"
            alt="Ivan Lima"
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full object-cover border-2 border-emerald-500/30"
          />
          <div className="min-w-0 w-full space-y-2 text-center sm:text-left">
            <p className="font-semibold text-zinc-100">Ivan Lima</p>
            <p className="text-xs text-emerald-400">Founder · Stock Market ROI</p>
            <p className="text-sm leading-relaxed text-zinc-400">
              Systems Analysis &amp; Development student and active US stock market investor since 2018.
              Ivan built Stock Market ROI to give retail investors direct access to the same data and
              analytical tools he wished existed when he started. Every article on this site is written
              from the perspective of someone with real skin in the game — tracking earnings, reading
              SEC filings, and following market cycles for over eight years.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              {/* Instagram — logo only */}
              <a
                href="https://www.instagram.com/ivan_lima_dev"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @ivan_lima_dev"
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white transition-opacity hover:opacity-80"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              {/* LinkedIn — logo only */}
              <a
                href="https://www.linkedin.com/in/ivanlimadev/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#0A66C2] text-white transition-opacity hover:opacity-80"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
              {/* Email — logo only */}
              <a
                href="mailto:contato@ivanlimadev.com"
                aria-label="Email"
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-700 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="mb-3 text-zinc-300">Track US stocks, crypto, and market data</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          Open Stock Market ROI →
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        This article is for informational purposes only and does not constitute financial advice.
      </p>
    </main>
  )
}
