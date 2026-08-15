'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface RelatedPost {
  slug: string
  title: string
  excerpt: string | null
  image_url: string | null
  image_alt: string | null
  category: string
}

export function RelatedTabs({
  related,
  latest,
}: {
  related: RelatedPost[]
  latest: RelatedPost[]
}) {
  const [tab, setTab] = useState<'related' | 'latest'>('related')
  const posts = tab === 'related' ? related : latest

  if (related.length === 0 && latest.length === 0) return null

  const featured = posts[0]
  const rest = posts.slice(1, 4)

  if (!featured) return null

  return (
    <div className="mt-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">More Articles</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('related')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'related' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            Related
          </button>
          <button
            onClick={() => setTab('latest')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'latest' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            Latest
          </button>
        </div>
      </div>

      {/* Featured post */}
      <Link
        href={`/blog/${featured.slug}`}
        className="group mb-4 block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors"
      >
        {featured.image_url && (
          <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
            <Image
              src={featured.image_url}
              alt={featured.image_alt ?? featured.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
        <div className="p-5">
          <span className="mb-2 inline-block text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            {featured.category}
          </span>
          <h3 className="mb-2 text-base font-bold leading-snug text-zinc-100 group-hover:text-white transition-colors line-clamp-2">
            {featured.title}
          </h3>
          {featured.excerpt && (
            <p className="text-sm leading-relaxed text-zinc-400 line-clamp-3">
              {featured.excerpt}
            </p>
          )}
        </div>
      </Link>

      {/* 3 small cards */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {rest.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors"
            >
              {p.image_url ? (
                <div className="relative h-28 w-full overflow-hidden bg-zinc-800">
                  <Image
                    src={p.image_url}
                    alt={p.image_alt ?? p.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              ) : (
                <div className="h-28 w-full bg-zinc-800" />
              )}
              <div className="p-3">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  {p.category}
                </span>
                <h3 className="text-sm font-semibold leading-snug text-zinc-200 group-hover:text-white transition-colors line-clamp-3">
                  {p.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
