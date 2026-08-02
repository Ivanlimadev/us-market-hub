'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useKrakenTicker } from '@/lib/hooks/useKrakenTicker'
import { CoinImage } from '@/components/crypto/CoinImage'
import type { CryptoMarket } from '@/types/crypto'

type SortKey = 'market_cap_rank' | 'current_price' | 'price_change_percentage_24h' | 'market_cap' | 'total_volume'

function fmt(n: number, decimals = 2): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(decimals)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(decimals)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(decimals)}M`
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(decimals)}K`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`
}

function PctCell({ val }: { val: number | null }) {
  if (val == null) return <span className="text-zinc-600">-</span>
  const pos = val >= 0
  return (
    <span className={pos ? 'text-emerald-400' : 'text-red-400'}>
      {pos ? '+' : ''}{val.toFixed(2)}%
    </span>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 text-zinc-600" />
  return dir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-emerald-400" />
    : <ArrowDown className="h-3 w-3 text-emerald-400" />
}

export function CryptoTable() {
  const [sortKey, setSortKey]   = useState<SortKey>('market_cap_rank')
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc')
  const [page, setPage]         = useState(0)
  const [expanded, setExpanded] = useState(false)
  const PAGE_SIZE = 50
  const VISIBLE   = 7

  const { data, isLoading } = useQuery<CryptoMarket[]>({
    queryKey: ['crypto-markets'],
    queryFn: () => fetch('/api/crypto/markets?limit=100').then((r) => r.json()),
    staleTime: 55_000,
    refetchInterval: 60_000,
  })

  // Kraken keyed by lowercase CoinGecko symbol (e.g. "btc", "eth")
  const symbols = (data ?? []).map((c) => c.symbol)
  const tickers = useKrakenTicker(symbols)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'market_cap_rank' ? 'asc' : 'desc')
    }
    setPage(0)
  }

  const sorted = [...(data ?? [])].sort((a, b) => {
    const aVal = a[sortKey] ?? 0
    const bVal = b[sortKey] ?? 0
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil((data ?? []).length / PAGE_SIZE)
  // Collapsed by default: show only the top few; "View all" expands to the
  // full paginated table.
  const rows = expanded ? paged : sorted.slice(0, VISIBLE)

  const cols: { key: SortKey; label: string; align?: string }[] = [
    { key: 'market_cap_rank', label: '#' },
    { key: 'current_price', label: 'Price', align: 'right' },
    { key: 'price_change_percentage_24h', label: '24h %', align: 'right' },
    { key: 'market_cap', label: 'Market Cap', align: 'right' },
    { key: 'total_volume', label: 'Volume (24h)', align: 'right' },
  ]

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-200">Top Cryptocurrencies</h2>
        <p className="text-[11px] text-zinc-500">Live prices via Kraken WebSocket · Market data via CoinGecko</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 font-medium text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-2.5 text-right font-medium text-zinc-500">7d %</th>
              <th className="px-4 py-2.5 text-right font-medium text-zinc-500">30d %</th>
              <th className="px-4 py-2.5 text-right font-medium text-zinc-500">1y %</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: VISIBLE }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 animate-pulse">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-4 rounded bg-zinc-800/50 w-full" />
                    </td>
                  </tr>
                ))
              : rows.map((coin) => {
                  const live = tickers.get(coin.symbol)
                  const price  = live ? live.price : coin.current_price
                  const pct24h = live ? live.priceChangePercent : (coin.price_change_percentage_24h ?? 0)

                  return (
                    <tr
                      key={coin.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-zinc-500 font-mono text-xs w-10">
                        {coin.market_cap_rank}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link href={`/crypto/${coin.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <CoinImage src={coin.image} symbol={coin.symbol} size={24} />
                          <div>
                            <p className="font-semibold text-zinc-200 leading-none">{coin.name}</p>
                            <p className="text-[10px] text-zinc-500 uppercase">{coin.symbol}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-zinc-200">
                        {price >= 1
                          ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `$${price.toFixed(6)}`}
                        {live && (
                          <span className="ml-1 text-[9px] text-emerald-400 animate-pulse">●</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <PctCell val={pct24h} />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-zinc-400">
                        {fmt(coin.market_cap)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-zinc-400">
                        {fmt(coin.total_volume)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <PctCell val={coin.price_change_percentage_7d_in_currency} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <PctCell val={coin.price_change_percentage_30d_in_currency} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <PctCell val={coin.price_change_percentage_1y_in_currency} />
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      {/* Collapsed: single "View all" button */}
      {!isLoading && !expanded && (data ?? []).length > VISIBLE && (
        <div className="border-t border-zinc-800 p-3">
          <button
            onClick={() => setExpanded(true)}
            className="w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            View all {(data ?? []).length} cryptocurrencies
          </button>
        </div>
      )}

      {/* Expanded: pagination + collapse */}
      {expanded && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
          <button
            onClick={() => { setExpanded(false); setPage(0) }}
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Show less
          </button>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="text-xs text-zinc-500">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
