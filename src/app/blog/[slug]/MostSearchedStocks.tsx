'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

interface Q { symbol: string; name: string; price: number; changePct: number }

export function MostSearchedStocks() {
  const { data } = useQuery<Q[]>({
    queryKey: ['trending-sidebar'],
    queryFn: () => fetch('/api/trending').then((r) => (r.ok ? r.json() : [])),
    staleTime: 5 * 60_000,
  })
  // Stocks only — drop crypto pairs (BTC-USD, ETH-USD…), forex and futures.
  const items = (Array.isArray(data) ? data : [])
    .filter((s) => !/-USDT?$/i.test(s.symbol) && !/[=^]/.test(s.symbol))
    .slice(0, 8)

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Most Searched Stocks</h3>
      {items.length === 0 ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/60" />)}</div>
      ) : (
        <ul className="divide-y divide-zinc-800/60">
          {items.map((s) => (
            <li key={s.symbol}>
              <Link href={`/stocks/${s.symbol}`} className="flex items-center gap-2.5 py-2 transition-opacity hover:opacity-80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://assets.parqet.com/logos/symbol/${s.symbol}?format=png`}
                  alt={s.symbol} width={28} height={28} loading="lazy"
                  className="h-7 w-7 shrink-0 rounded-md bg-white object-contain p-0.5"
                  onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{s.symbol}</p>
                  <p className="truncate text-[11px] text-zinc-500">{s.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-zinc-200">${s.price.toFixed(2)}</p>
                  <p className={`text-[11px] font-medium tabular-nums ${s.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/screener" className="mt-3 block text-center text-xs font-medium text-emerald-400 hover:text-emerald-300">
        Browse all stocks →
      </Link>
    </div>
  )
}
