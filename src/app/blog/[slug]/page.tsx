import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import type { Metadata } from 'next'
import { fetchStockData } from '@/lib/stock-server'
import { cgCoin } from '@/lib/coingecko'
import type { CryptoDetail } from '@/types/crypto'
import { jsonLdSafe } from '@/lib/jsonld'
import { authorForCategory, authorBySlug } from '@/lib/authors'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'
import { UsEconomyCards } from '@/components/macro/UsEconomyCards'
import { RelatedTabs } from './related-tabs'
import { BlogSidebar } from './BlogSidebar'
import AuthorByline from '@/components/blog/AuthorByline'
import CommentsSection from '@/components/comments/CommentsSection'
import AppDownloadCard from '@/components/blog/AppDownloadCard'

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
  author_slug: string | null
  youtube_id: string | null
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

// Converts GitHub-style Markdown tables into HTML. Runs after HTML-escaping so
// cell content is already safe; inline markdown (bold/links) is handled later.
function convertTables(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  const cells = (row: string) =>
    row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
  let i = 0
  while (i < lines.length) {
    const header = lines[i]
    const sep = lines[i + 1] ?? ''
    const isHeader = /^\s*\|(.+)\|\s*$/.test(header)
    const isSep = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(sep)
    if (isHeader && isSep) {
      const ths = cells(header)
        .map((h) => `<th class="border-b border-zinc-700 px-3 py-2 text-left font-semibold text-zinc-200">${h}</th>`)
        .join('')
      i += 2
      const trs: string[] = []
      while (i < lines.length && /^\s*\|(.+)\|\s*$/.test(lines[i])) {
        const tds = cells(lines[i])
          .map((c) => `<td class="border-b border-zinc-800/60 px-3 py-2 text-zinc-300">${c}</td>`)
          .join('')
        trs.push(`<tr>${tds}</tr>`)
        i++
      }
      out.push(
        `<div class="my-6 overflow-x-auto"><table class="w-full border-collapse text-sm"><thead><tr>${ths}</tr></thead><tbody>${trs.join('')}</tbody></table></div>`,
      )
      continue
    }
    out.push(header)
    i++
  }
  return out.join('\n')
}

function markdownToHtml(md: string): string {
  // Escape raw HTML first so untrusted blog content (AI-generated from external
  // news) cannot inject markup/scripts. Markdown syntax below uses #, *, [](), -
  // which are unaffected by escaping &, < and >.
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return convertTables(escaped)
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-zinc-100 mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-zinc-100 mt-10 mb-4">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline images: ![alt](url). Rendered only from an allowlist of trusted
    // hosts (the CSP img-src also restricts this) so AI-generated/external blog
    // content can't embed arbitrary or hostile images. Runs before the link
    // rules because ![]() contains []().
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (_, alt, src) => {
      const safeSrc = src.replace(/"/g, '%22')
      const host = safeSrc.replace(/^https?:\/\//, '').split(/[/?#]/)[0].toLowerCase()
      const ALLOWED = ['www.google.com', 'assets.parqet.com', 'images.pexels.com', 's.yimg.com', 'assets.coingecko.com', 'coin-images.coingecko.com']
      if (!ALLOWED.includes(host)) return ''
      const safeAlt = alt.replace(/["<>]/g, '')
      return `<img src="${safeSrc}" alt="${safeAlt}" loading="lazy" class="inline-block h-12 w-12 rounded-xl object-contain align-middle" />`
    })
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, text, href) => {
      // URL-encode any `"` so a crafted link can't break out of the href
      // attribute and inject an event handler (stored XSS).
      const safe = href.replace(/"/g, '%22')
      const isInternal = safe.includes('stockmarketroi.com')
      return isInternal
        ? `<a href="${safe}" class="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">${text}</a>`
        : `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors">${text}</a>`
    })
    .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, (_, text, href) => {
      const safe = href.replace(/"/g, '%22')
      return `<a href="${safe}" class="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">${text}</a>`
    })
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-zinc-300">$1</li>')
    .replace(/(<li[\s\S]+?<\/li>)/g, '<ul class="my-4 space-y-1">$1</ul>')
    .replace(/^(?!\s*<)(.*\S.*)$/gm, '<p class="text-zinc-300 leading-relaxed my-4">$1</p>')
}

// Strip markdown to plain text for JSON-LD answer values (links -> text, drop
// emphasis/heading/list/table syntax, collapse whitespace).
function stripMd(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/[*_`>#]/g, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Cap a long answer at a sentence boundary so the FAQ value stays concise.
function capSentence(s: string, max = 600): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  return (stop > max * 0.5 ? cut.slice(0, stop + 1) : cut).trim()
}

// Builds FAQPage entries from the post so AI engines and Google rich results can
// lift ready-made Q&A. Two sources, deduped:
//   1) a dedicated "## Frequently Asked Questions" section (### question / answer)
//   2) ANY H2 heading phrased as a question (ends with "?"), whose answer is the
//      visible body up to the next heading. #2 lets ~a third of posts emit FAQ
//      structured data with no manual FAQ section.
function extractFaq(md: string): { question: string; answer: string }[] {
  const out: { question: string; answer: string }[] = []
  const seen = new Set<string>()
  const add = (q: string, a: string) => {
    const question = q.trim()
    const answer = capSentence(stripMd(a))
    const key = question.toLowerCase().replace(/\s+/g, ' ')
    if (question && answer && !seen.has(key)) {
      seen.add(key)
      out.push({ question, answer })
    }
  }

  // 1) Dedicated FAQ section.
  const head = md.match(/\n##\s+(?:Frequently Asked Questions|FAQs?)\b.*/i)
  if (head && head.index != null) {
    let section = md.slice(head.index + head[0].length)
    const nextH2 = section.search(/\n##\s/)
    if (nextH2 !== -1) section = section.slice(0, nextH2)
    const re = /\n###\s+(.+?)\s*\n([\s\S]*?)(?=\n###\s|$)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(section)) !== null) add(m[1], m[2])
  }

  // 2) Question-style H2 headings anywhere in the post.
  const qh2 = /\n##\s+([^\n]*\?)\s*\n([\s\S]*?)(?=\n#{2,3}\s|$)/g
  let h: RegExpExecArray | null
  while ((h = qh2.exec(md)) !== null) add(h[1], h[2])

  return out.slice(0, 8)
}

function readingTime(content: string): number {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))
}

function fmtCryptoPrice(p: number): string {
  return p >= 1
    ? `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${p.toLocaleString('en-US', { maximumFractionDigits: 8 })}`
}

function fmtUsdCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString('en-US')}`
}

function fmtPct(p: number | null | undefined): string {
  if (p == null) return '--'
  return `${p >= 0 ? '+' : ''}${p.toFixed(2)}%`
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
  const faqs = extractFaq(post.content)

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

  // Crypto card - for Crypto posts, feature the first coin the article links to
  // (e.g. /crypto/bitcoin). Keeps the stock `tickers`/chips untouched.
  const cryptoId = post.category === 'Crypto'
    ? (post.content.match(/\/crypto\/([a-z0-9-]+)/)?.[1] ?? null)
    : null
  let cryptoData: CryptoDetail | null = null
  if (cryptoId) {
    try {
      cryptoData = await cgCoin(cryptoId)
    } catch {
      cryptoData = null
    }
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

  // Author: explicit per-post author_slug when set, else derived from category.
  const author =
      (post.author_slug ? authorBySlug(post.author_slug) : undefined) ??
      authorForCategory(post.category)

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
      name: author.name,
      image: `https://stockmarketroi.com${author.photo}`,
      description: author.bio,
      ...(author.aboutHref ? { url: `https://stockmarketroi.com${author.aboutHref}` } : {}),
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

  const faqLd = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSafe(faqLd) }} />}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
      <div className="min-w-0">
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

      {/* YouTube video embed (when the post has a companion video) */}
      {post.youtube_id && (
        <div className="mb-8 aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${post.youtube_id}`}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      {/* Live indicator cards for the US-economy explainer */}
      {post.slug === 'us-economic-indicators-explained' && <UsEconomyCards />}

      <article
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <AppDownloadCard />

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

      {/* Crypto card - shown for crypto posts (amber accent) */}
      {cryptoData && cryptoId && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-amber-500/40 bg-zinc-900">
          {/* Header: logo + symbol + name */}
          <div className="flex items-center gap-4 border-b border-zinc-700/60 px-5 py-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cryptoData.image.large}
                alt={cryptoData.name}
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-white">{cryptoData.symbol.toUpperCase()}</p>
              <p className="truncate text-sm text-zinc-400">{cryptoData.name}</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
              Live Data
            </span>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 divide-x divide-zinc-700/60 border-b border-zinc-700/60">
            {[
              { label: 'Price', value: fmtCryptoPrice(cryptoData.market_data.current_price), cls: 'text-white' },
              {
                label: '24h',
                value: fmtPct(cryptoData.market_data.price_change_percentage_24h),
                cls: cryptoData.market_data.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400',
              },
              { label: 'Market Cap', value: fmtUsdCompact(cryptoData.market_data.market_cap), cls: 'text-zinc-200' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="px-4 py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
                <p className={`mt-1.5 text-xl font-bold tabular-nums ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 divide-x divide-zinc-700/60">
            {[
              {
                label: 'Chg (1Y)',
                value: fmtPct(cryptoData.market_data.price_change_percentage_1y),
                cls: (cryptoData.market_data.price_change_percentage_1y ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
              },
              { label: 'All-Time High', value: fmtCryptoPrice(cryptoData.market_data.ath), cls: 'text-zinc-200' },
              {
                label: 'Rank',
                value: cryptoData.market_data.market_cap_rank ? `#${cryptoData.market_data.market_cap_rank}` : '--',
                cls: 'text-zinc-200',
              },
            ].map(({ label, value, cls }) => (
              <div key={label} className="px-4 py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
                <p className={`mt-1.5 text-xl font-bold tabular-nums ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div className="px-5 py-4">
            <Link
              href={`/crypto/${cryptoId}`}
              className="block w-full rounded-xl bg-amber-500 py-3 text-center text-sm font-bold text-black shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-400"
            >
              View all {cryptoData.symbol.toUpperCase()} data →
            </Link>
          </div>
        </div>
      )}

      {/* Ticker card - shown when post has a related stock */}
      {!cryptoData && stockData && primaryTicker && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-emerald-500/40 bg-zinc-900">
          {/* Header: logo + ticker + name */}
          <div className="flex items-center gap-4 border-b border-zinc-700/60 px-5 py-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://assets.parqet.com/logos/symbol/${primaryTicker}?format=png`}
                alt={stockData.name}
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-white">{primaryTicker}</p>
              <p className="truncate text-sm text-zinc-400">{stockData.name}</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
              Live Data
            </span>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 divide-x divide-zinc-700/60 border-b border-zinc-700/60">
            {[
              {
                label: 'Price',
                value: `$${stockData.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                cls: 'text-white',
              },
              {
                label: 'Div. Yield',
                value: stockData.info?.dividendYield != null
                  ? `${(stockData.info.dividendYield * 100).toFixed(2)}%`
                  : '--',
                cls: 'text-amber-400',
              },
              {
                label: 'P/E',
                value: stockData.info?.pe != null ? stockData.info.pe.toFixed(2) : '--',
                cls: 'text-zinc-200',
              },
            ].map(({ label, value, cls }) => (
              <div key={label} className="px-4 py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
                <p className={`mt-1.5 text-xl font-bold tabular-nums ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 divide-x divide-zinc-700/60">
            {[
              {
                label: 'Chg (12M)',
                value: change12m != null ? `${change12m >= 0 ? '+' : ''}${change12m.toFixed(2)}%` : '--',
                cls: change12m == null ? 'text-zinc-400' : change12m >= 0 ? 'text-emerald-400' : 'text-red-400',
              },
              {
                label: 'Net Margin',
                value: stockData.info?.profitMargin != null
                  ? `${(stockData.info.profitMargin * 100).toFixed(2)}%`
                  : '--',
                cls: 'text-zinc-200',
              },
              {
                label: 'P/B',
                value: stockData.info?.priceToBook != null ? stockData.info.priceToBook.toFixed(2) : '--',
                cls: 'text-zinc-200',
              },
            ].map(({ label, value, cls }) => (
              <div key={label} className="px-4 py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
                <p className={`mt-1.5 text-xl font-bold tabular-nums ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div className="px-5 py-4">
            <Link
              href={`/stocks/${primaryTicker.toLowerCase()}`}
              className="block w-full rounded-xl bg-emerald-500 py-3 text-center text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
            >
              View all {primaryTicker} indicators →
            </Link>
          </div>
        </div>
      )}

      {/* Related posts com abas Related / Latest */}
      <RelatedTabs related={related} latest={latestPosts} />

      {/* Author byline (mini) - attributed by post category */}
      <AuthorByline author={author} />

      {/* Discussion - shared with the mobile app */}
      <CommentsSection entityType="post" entityId={slug} />

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
        This article was written with AI assistance based on real market data and reviewed for accuracy.
        It is for informational purposes only and does not constitute financial advice.
      </p>
      </div>{/* /article column */}

      <BlogSidebar latest={latestPosts} />
      </div>{/* /grid */}
    </main>
  )
}
