import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import type { Metadata } from 'next'

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
  return {
    title:      data.seo_title ?? data.title,
    description: data.seo_description,
    alternates: { canonical: `https://stockmarketroi.com/blog/${slug}` },
    openGraph:  { images: data.image_url ? [data.image_url] : [] },
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
        ? `<a href="${href}" class="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">${text}</a>`
        : `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors">${text}</a>`
    })
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-zinc-300">$1</li>')
    .replace(/(<li[\s\S]+?<\/li>)/g, '<ul class="my-4 space-y-1">$1</ul>')
    .replace(/^(?!<[hul])(.*\S.*)$/gm, '<p class="text-zinc-300 leading-relaxed my-4">$1</p>')
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

  const jsonLd = {
    '@context':        'https://schema.org',
    '@type':           'Article',
    headline:          post.title,
    description:       post.excerpt,
    image:             post.image_url ?? undefined,
    datePublished:     post.published_at,
    dateModified:      post.published_at,
    author:            { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
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
      <p className="mb-6 text-zinc-500">
        {new Date(post.published_at).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        })}
      </p>

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

      {/* E-E-A-T author section */}
      <div className="mt-10 flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <span className="text-sm font-bold text-emerald-400">SMR</span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-200">Editorial Team · Stock Market ROI</p>
          <p className="text-xs leading-relaxed text-zinc-500">
            Our editorial team consists of financial analysts and market researchers with expertise
            in US equities, macroeconomics, and portfolio strategy. All articles are fact-checked
            against public market data and reviewed for accuracy before publication.
          </p>
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
