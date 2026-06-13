import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getArticle, getAllArticles } from '@/lib/articles'
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react'

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return {}
  return {
    title:       `${article.title} — Stock Market ROI`,
    description: article.description,
  }
}

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const date = new Date(article.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="mx-auto max-w-screen-md px-4 py-10 space-y-8">

      {/* Back */}
      <Link
        href="/news?tab=articles"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Articles
      </Link>

      {/* Header */}
      <header className="space-y-4">
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                <Tag className="h-3 w-3" />{t}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl font-bold leading-tight text-zinc-100">{article.title}</h1>

        {article.description && (
          <p className="text-lg text-zinc-400 leading-relaxed">{article.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 border-t border-zinc-800 pt-4">
          <span className="font-medium text-zinc-300">{article.author}</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />{date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />{article.readTime} min read
          </span>
        </div>
      </header>

      {/* MDX content — no prose-invert; dark mode handled via CSS vars in globals.css */}
      <article className="prose prose-zinc max-w-none
        prose-headings:text-zinc-100 prose-headings:font-bold
        prose-h2:text-xl prose-h3:text-lg
        prose-p:text-zinc-400 prose-p:leading-relaxed
        prose-a:text-emerald-400 hover:prose-a:text-emerald-300
        prose-strong:text-zinc-200
        prose-code:text-emerald-400 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
        prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800
        prose-blockquote:border-l-emerald-500 prose-blockquote:text-zinc-400
        prose-ul:text-zinc-400 prose-ol:text-zinc-400
        prose-li:marker:text-emerald-500
        prose-hr:border-zinc-800
        prose-table:text-zinc-400
        prose-th:text-zinc-300 prose-th:border-zinc-700
        prose-td:border-zinc-800
      ">
        <MDXRemote source={article.body} />
      </article>

      {/* Footer */}
      <div className="border-t border-zinc-800 pt-6 flex items-center justify-between">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to News
        </Link>
        <p className="text-xs text-zinc-600">
          For informational purposes only — not financial advice.
        </p>
      </div>
    </div>
  )
}
