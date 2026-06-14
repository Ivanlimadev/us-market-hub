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
    title: data.seo_title ?? data.title,
    description: data.seo_description,
    openGraph: { images: data.image_url ? [data.image_url] : [] },
  }
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-zinc-100 mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-zinc-100 mt-10 mb-4">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
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

      <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="mb-3 text-zinc-300">Track real-time stocks, crypto, and market data</p>
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
