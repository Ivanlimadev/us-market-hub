'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import type { CryptoMarket } from '@/types/crypto'

interface BlogPost {
  slug:         string
  title:        string
  excerpt:      string
  image_url:    string | null
  image_alt:    string | null
  published_at: string
  category:     string
}

function fmt(n: number): string {
  if (n >= 1_000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (n >= 1)     return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

export function CryptoHomeWidget() {
  const { data: coins, isLoading: coinsLoading } = useQuery<CryptoMarket[]>({
    queryKey: ['crypto-home-top5'],
    queryFn:  () => fetch('/api/crypto/markets?limit=5').then(r => r.json()),
    staleTime: 55_000,
    refetchInterval: 60_000,
    select: d => d.slice(0, 5),
  })

  const { data: posts } = useQuery<BlogPost[]>({
    queryKey: ['crypto-latest-post'],
    queryFn:  () => fetch('/api/blog/latest?category=Crypto&limit=1').then(r => r.json()),
    staleTime: 15 * 60_000,
  })

  const latestPost = posts?.[0]

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Crypto Markets</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Top 5 coins right now</p>
        </div>
        <Link
          href="/crypto"
          className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          See more <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Top 5 coins */}
      {coinsLoading && (
        <div className="divide-y divide-zinc-800/50 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="h-8 w-8 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 rounded bg-zinc-800" />
                <div className="h-2.5 w-12 rounded bg-zinc-800" />
              </div>
              <div className="h-3 w-16 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {!coinsLoading && coins && (
        <div className="divide-y divide-zinc-800/30">
          {coins.map((coin) => {
            const pct = coin.price_change_percentage_24h
            const up  = pct >= 0
            return (
              <Link
                key={coin.id}
                href={`/crypto/${coin.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors group"
              >
                {/* Icon */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coin.image} alt={coin.name} className="h-8 w-8 rounded-full shrink-0" />

                {/* Name + symbol */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                    {coin.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 uppercase">{coin.symbol}</p>
                </div>

                {/* Price + change */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-zinc-100">${fmt(coin.current_price)}</p>
                  <p className={`flex items-center justify-end gap-0.5 text-[11px] font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(pct).toFixed(2)}%
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Latest crypto blog post */}
      {latestPost && (
        <div className="border-t border-zinc-800 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-3">Latest analysis</p>
          <Link href={`/blog/${latestPost.slug}`} className="group flex gap-3 items-start hover:opacity-80 transition-opacity">
            {latestPost.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={latestPost.image_url}
                alt={latestPost.image_alt ?? latestPost.title}
                className="h-14 w-14 shrink-0 rounded-lg object-cover bg-zinc-800"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                {latestPost.title}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500 line-clamp-1">{latestPost.excerpt}</p>
            </div>
          </Link>
        </div>
      )}

      {/* CTA */}
      <div className="border-t border-zinc-800 px-5 py-3">
        <Link
          href="/crypto"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          Explorar Cripto <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
