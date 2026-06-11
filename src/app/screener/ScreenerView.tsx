'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { SECTORS } from '@/lib/stock-universe'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

function fmtCap(n: number | null) {
  if (!n) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`
  return `$${n.toLocaleString()}`
}

type SortKey = 'price' | 'changePct' | 'marketCap' | 'pe' | 'pb' | 'dividendYield' | 'roe' | 'beta'

function SortBtn({ col, cur, dir, onClick }: { col: SortKey; cur: SortKey; dir: 'asc' | 'desc'; onClick: () => void }) {
  const Icon = cur === col ? (dir === 'desc' ? ChevronDown : ChevronUp) : ChevronDown
  return (
    <button onClick={onClick} className="inline-flex items-center gap-0.5 hover:text-white transition-colors">
      {col === 'changePct' ? 'Change' : col === 'marketCap' ? 'Mkt Cap' : col === 'pe' ? 'P/E' : col === 'pb' ? 'P/B' : col === 'dividendYield' ? 'DY' : col === 'roe' ? 'ROE' : col.charAt(0).toUpperCase() + col.slice(1)}
      <Icon className={`h-3.5 w-3.5 ${cur === col ? 'text-emerald-400' : ''}`} />
    </button>
  )
}

function LogoImg({ symbol }: { symbol: string }) {
  return (
    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-zinc-800 flex items-center justify-center">
      <Image
        src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
        alt={symbol} width={28} height={28} className="object-contain" unoptimized
        onError={(e) => {
          const t = e.target as HTMLImageElement
          t.style.display = 'none'
          if (t.parentElement) t.parentElement.innerHTML = `<span class="text-[10px] font-bold text-zinc-400">${symbol.slice(0, 2)}</span>`
        }}
      />
    </div>
  )
}

export function ScreenerView() {
  const [sector, setSector]   = useState('All')
  const [minDY,  setMinDY]    = useState('')
  const [maxPE,  setMaxPE]    = useState('')
  const [search, setSearch]   = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('marketCap')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey: ['screener'],
    queryFn: () => fetch('/api/screener').then((r) => r.json()),
    staleTime: 5 * 60_000,
  })

  const filtered = useMemo(() => {
    if (!data) return []
    const minDYNum = parseFloat(minDY) || 0
    const maxPENum = parseFloat(maxPE) || Infinity
    const q = search.trim().toUpperCase()

    return data
      .filter((s) => sector === 'All' || s.sector === sector)
      .filter((s) => !q || s.symbol.includes(q) || s.name.toUpperCase().includes(q))
      .filter((s) => minDYNum === 0 || ((s.dividendYield ?? 0) * 100) >= minDYNum)
      .filter((s) => maxPENum === Infinity || (s.pe !== null && s.pe > 0 && s.pe <= maxPENum))
      .sort((a, b) => {
        const av = (a[sortKey] as number | null) ?? (sortDir === 'desc' ? -Infinity : Infinity)
        const bv = (b[sortKey] as number | null) ?? (sortDir === 'desc' ? -Infinity : Infinity)
        return sortDir === 'desc' ? bv - av : av - bv
      })
  }, [data, sector, minDY, maxPE, search, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbol or name…"
          className="h-9 w-48 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
        <select
          value={sector} onChange={(e) => setSector(e.target.value)}
          className="h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="All">All Sectors</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-zinc-500">Min DY%</label>
          <input
            type="number" min="0" max="20" value={minDY} onChange={(e) => setMinDY(e.target.value)}
            placeholder="0"
            className="h-9 w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-zinc-500">Max P/E</label>
          <input
            type="number" min="0" value={maxPE} onChange={(e) => setMaxPE(e.target.value)}
            placeholder="∞"
            className="h-9 w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <span className="ml-auto flex items-center text-xs text-zinc-500">
          {filtered.length} results
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-4 py-3 text-left">Symbol</th>
                <th className="px-4 py-3 text-right"><SortBtn col="price"       cur={sortKey} dir={sortDir} onClick={() => toggleSort('price')} /></th>
                <th className="px-4 py-3 text-right"><SortBtn col="changePct"   cur={sortKey} dir={sortDir} onClick={() => toggleSort('changePct')} /></th>
                <th className="hidden px-4 py-3 text-right sm:table-cell"><SortBtn col="marketCap"   cur={sortKey} dir={sortDir} onClick={() => toggleSort('marketCap')} /></th>
                <th className="hidden px-4 py-3 text-right md:table-cell"><SortBtn col="pe"          cur={sortKey} dir={sortDir} onClick={() => toggleSort('pe')} /></th>
                <th className="hidden px-4 py-3 text-right md:table-cell"><SortBtn col="pb"          cur={sortKey} dir={sortDir} onClick={() => toggleSort('pb')} /></th>
                <th className="px-4 py-3 text-right"><SortBtn col="dividendYield" cur={sortKey} dir={sortDir} onClick={() => toggleSort('dividendYield')} /></th>
                <th className="hidden px-4 py-3 text-right lg:table-cell"><SortBtn col="roe"         cur={sortKey} dir={sortDir} onClick={() => toggleSort('roe')} /></th>
                <th className="hidden px-4 py-3 text-right lg:table-cell"><SortBtn col="beta"        cur={sortKey} dir={sortDir} onClick={() => toggleSort('beta')} /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-zinc-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((s) => {
                    const isUp = s.changePct >= 0
                    const dy   = s.dividendYield !== null ? (s.dividendYield * 100).toFixed(2) + '%' : '—'
                    const roe  = s.roe !== null ? (s.roe * 100).toFixed(1) + '%' : '—'
                    return (
                      <tr key={s.symbol} className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-2.5">
                          <Link href={`/stocks/${s.symbol}`} className="flex items-center gap-2.5">
                            <LogoImg symbol={s.symbol} />
                            <div>
                              <p className="font-semibold text-white">{s.symbol}</p>
                              <p className="max-w-[120px] truncate text-[11px] text-zinc-500">{s.name}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-white">
                          ${s.price.toFixed(2)}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-mono text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isUp ? '+' : ''}{s.changePct.toFixed(2)}%
                        </td>
                        <td className="hidden px-4 py-2.5 text-right font-mono text-xs text-zinc-400 sm:table-cell">
                          {fmtCap(s.marketCap)}
                        </td>
                        <td className="hidden px-4 py-2.5 text-right font-mono text-xs text-zinc-400 md:table-cell">
                          {s.pe !== null && s.pe > 0 ? s.pe.toFixed(1) : '—'}
                        </td>
                        <td className="hidden px-4 py-2.5 text-right font-mono text-xs text-zinc-400 md:table-cell">
                          {s.pb !== null ? s.pb.toFixed(2) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-emerald-400">
                          {dy}
                        </td>
                        <td className="hidden px-4 py-2.5 text-right font-mono text-xs text-zinc-400 lg:table-cell">
                          {roe}
                        </td>
                        <td className="hidden px-4 py-2.5 text-right font-mono text-xs text-zinc-400 lg:table-cell">
                          {s.beta !== null ? s.beta.toFixed(2) : '—'}
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
