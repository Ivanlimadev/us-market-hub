'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Award, Flame, Search } from 'lucide-react'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

function Logo({ sym }: { sym: string }) {
  return (
    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-zinc-800 flex items-center justify-center">
      <Image src={`https://assets.parqet.com/logos/symbol/${sym}?format=png`}
        alt={sym} width={28} height={28} className="object-contain" unoptimized
        onError={(e) => {
          const t = e.target as HTMLImageElement; t.style.display = 'none'
          if (t.parentElement) t.parentElement.innerHTML = `<span class="text-[10px] font-bold text-zinc-400">${sym.slice(0,2)}</span>`
        }}
      />
    </div>
  )
}

interface RankItem { symbol: string; name: string; value: string; sub: string; subUp?: boolean }

function RankCard({ title, icon: Icon, color, items, isLoading, href }: {
  title: string
  icon: React.ElementType
  color: string
  items: RankItem[]
  isLoading?: boolean
  href: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        </div>
        <Link href={href} className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
          See more →
        </Link>
      </div>
      <div className="divide-y divide-zinc-800/50 flex-1">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="h-7 w-7 animate-pulse rounded-lg bg-zinc-800" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-14 animate-pulse rounded bg-zinc-800" />
                  <div className="h-2.5 w-20 animate-pulse rounded bg-zinc-800" />
                </div>
                <div className="h-4 w-12 animate-pulse rounded bg-zinc-800" />
              </div>
            ))
          : items.map((item, i) => (
              <Link key={item.symbol} href={`/stocks/${item.symbol}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/40 transition-colors"
              >
                <span className="w-4 text-center text-[10px] font-bold text-zinc-600">{i + 1}</span>
                <Logo sym={item.symbol} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{item.symbol}</p>
                  <p className="truncate text-[10px] text-zinc-500">{item.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-bold ${color}`}>{item.value}</p>
                  {item.sub && (
                    <p className={`text-[10px] ${item.subUp === undefined ? 'text-zinc-500' : item.subUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.sub}
                    </p>
                  )}
                </div>
              </Link>
            ))
        }
        {!isLoading && !items.length && (
          <p className="px-4 py-6 text-center text-xs text-zinc-600">No data available</p>
        )}
      </div>
    </div>
  )
}

export function HomeRankings() {
  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey: ['screener'],
    queryFn:  () => fetch('/api/screener').then((r) => r.json()),
    staleTime: 5 * 60_000,
  })

  const { data: trending, isLoading: trendingLoading } = useQuery<YFBatchQuote[]>({
    queryKey: ['trending'],
    queryFn:  () => fetch('/api/trending').then((r) => r.json()),
    staleTime: 5 * 60_000,
  })

  const TOP = 5

  // /api/screener can return a non-array error body (e.g. 429 rate limit) -
  // guard so a bad response degrades to empty cards instead of crashing the widget.
  const rows = Array.isArray(data) ? data : []

  const topDY: RankItem[] = rows
    .filter((s) => (s.dividendYield ?? 0) > 0)
    .sort((a, b) => (b.dividendYield ?? 0) - (a.dividendYield ?? 0))
    .slice(0, TOP)
    .map((s) => ({
      symbol: s.symbol, name: s.name,
      value: ((s.dividendYield ?? 0) * 100).toFixed(2) + '%',
      sub: (s.changePct >= 0 ? '+' : '') + s.changePct.toFixed(2) + '%',
      subUp: s.changePct >= 0,
    }))

  const topVolume: RankItem[] = rows
    .filter((s) => (s.volume ?? 0) > 0)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, TOP)
    .map((s) => {
      const vol = s.volume ?? 0
      const fmt = vol >= 1_000_000
        ? (vol / 1_000_000).toFixed(1) + 'M'
        : vol >= 1_000
        ? (vol / 1_000).toFixed(0) + 'K'
        : vol.toString()
      return {
        symbol: s.symbol, name: s.name,
        value: fmt,
        sub: (s.changePct >= 0 ? '+' : '') + s.changePct.toFixed(2) + '%',
        subUp: s.changePct >= 0,
      }
    })

  const topGainers: RankItem[] = rows
    .filter((s) => s.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, TOP)
    .map((s) => ({
      symbol: s.symbol, name: s.name,
      value: '+' + s.changePct.toFixed(2) + '%',
      sub: '$' + s.price.toFixed(2),
    }))

  const trendingItems: RankItem[] = (Array.isArray(trending) ? trending : [])
    .slice(0, TOP)
    .map((s) => ({
      symbol: s.symbol, name: s.name,
      value: '$' + s.price.toFixed(2),
      sub: (s.changePct >= 0 ? '+' : '') + s.changePct.toFixed(2) + '%',
      subUp: s.changePct >= 0,
    }))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Rankings</h2>
        <Link href="/rankings" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RankCard title="Top Dividend Yield" icon={Award} color="text-emerald-400"
          items={topDY} isLoading={isLoading} href="/rankings" />
        <RankCard title="Most Active" icon={Flame} color="text-orange-400"
          items={topVolume} isLoading={isLoading} href="/rankings" />
        <RankCard title="Top Gainers" icon={TrendingUp} color="text-emerald-400"
          items={topGainers} isLoading={isLoading} href="/rankings" />
        <RankCard title="Most Searched" icon={Search} color="text-violet-400"
          items={trendingItems} isLoading={trendingLoading} href="/rankings" />
      </div>
    </div>
  )
}
