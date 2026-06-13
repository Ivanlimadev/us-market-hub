import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { getAllArticles } from '@/lib/articles'
import { MarketNewsFeed } from './MarketNewsFeed'

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function NewsPage() {
  const articles = getAllArticles()

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">News</h1>
        <p className="text-sm text-zinc-400 mt-1">Editorial analysis and live market updates</p>
      </div>

      {/* Editorial Articles */}
      {articles.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Featured Articles</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/news/${article.slug}`}
                className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all overflow-hidden"
              >
                {/* Cover */}
                {article.cover ? (
                  <div className="relative w-full h-44 bg-zinc-800 overflow-hidden">
                    <Image
                      src={article.cover}
                      alt={article.title}
                      fill
                      className="object-cover"
                      unoptimized={article.cover.endsWith('.svg')}
                    />
                  </div>
                ) : (
                  <div className="w-full h-44 bg-zinc-800 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-zinc-700" />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-col flex-1 p-4 gap-2">
                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="rounded-md bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-zinc-100 leading-snug line-clamp-3 group-hover:text-white transition-colors">
                    {article.title}
                  </h3>

                  {article.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {article.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 mt-auto pt-1">
                    <span>{article.author}</span>
                    <span>·</span>
                    <span>{fmtDate(article.date)}</span>
                    <span>·</span>
                    <span>{article.readTime} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Divider */}
      {articles.length > 0 && (
        <div className="border-t border-zinc-800" />
      )}

      {/* Live Market News */}
      <MarketNewsFeed />
    </div>
  )
}
