'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Search, X, ChevronRight, Loader2 } from 'lucide-react'
import { UNIVERSE_FLAT } from '@/lib/stock-universe'

// ── sector badge colors ───────────────────────────────────────────────────────
const SECTOR_COLOR: Record<string, string> = {
  'Technology':             'text-sky-400    bg-sky-500/15',
  'Communication Services': 'text-violet-400 bg-violet-500/15',
  'Consumer Discretionary': 'text-amber-400  bg-amber-500/15',
  'Consumer Staples':       'text-lime-400   bg-lime-500/15',
  'Healthcare':             'text-rose-400   bg-rose-500/15',
  'Financials':             'text-blue-400   bg-blue-500/15',
  'Energy':                 'text-orange-400 bg-orange-500/15',
  'Industrials':            'text-cyan-400   bg-cyan-500/15',
  'Real Estate':            'text-emerald-400 bg-emerald-500/15',
  'Utilities':              'text-teal-400   bg-teal-500/15',
  'Materials':              'text-yellow-400 bg-yellow-500/15',
}

const SHORT_SECTOR: Record<string, string> = {
  'Communication Services': 'Comm.',
  'Consumer Discretionary': 'Discret.',
  'Consumer Staples':       'Staples',
  'Real Estate':            'Real Est.',
}
function shortSector(s: string) { return SHORT_SECTOR[s] ?? s }

// ── debounce ──────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, ms: number): T {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return dv
}

// ── logo ──────────────────────────────────────────────────────────────────────
function Logo({ sym }: { sym: string }) {
  return (
    <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-zinc-800 overflow-hidden">
      <Image
        src={`https://assets.parqet.com/logos/symbol/${sym}?format=png`}
        alt={sym} width={36} height={36} className="object-contain" unoptimized
        onError={(e) => {
          const t = e.target as HTMLImageElement
          t.style.display = 'none'
          if (t.parentElement)
            t.parentElement.innerHTML = `<span class="text-xs font-bold text-zinc-400">${sym.slice(0, 2)}</span>`
        }}
      />
    </div>
  )
}

// ── types ─────────────────────────────────────────────────────────────────────
export interface AssetSuggestion {
  symbol: string
  name: string
  sector?: string
  asset_type?: 'stock' | 'crypto'
  coingeckoId?: string
  image?: string
}

interface Props { onSelect: (asset: AssetSuggestion) => void }

// ── main component ────────────────────────────────────────────────────────────
export function SymbolSearch({ onSelect }: Props) {
  const [query, setQuery]           = useState('')
  const [open, setOpen]             = useState(false)
  const [apiResults, setApiResults] = useState<AssetSuggestion[]>([])
  const [fetching, setFetching]     = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQ = useDebounce(query, 280)

  // Fetch tickers API for queries outside local universe
  useEffect(() => {
    if (debouncedQ.length < 2) { setApiResults([]); return }
    setFetching(true)
    const US_MICS = new Set(['XNAS', 'XNYS', 'XASE', 'BATS'])
    fetch(`/api/tickers?search=${encodeURIComponent(debouncedQ)}&limit=12`)
      .then(r => r.json())
      .then(d => {
        const items = (d.data ?? []) as Array<{
          symbol: string; name: string
          stock_exchange?: { mic?: string; acronym?: string }
        }>
        setApiResults(
          items
            .filter(i => {
              const mic = i.stock_exchange?.mic ?? ''
              const acr = i.stock_exchange?.acronym ?? ''
              return US_MICS.has(mic) || acr.includes('NASDAQ') || acr.includes('NYSE')
            })
            .map(i => ({ symbol: i.symbol, name: i.name }))
        )
      })
      .catch(() => setApiResults([]))
      .finally(() => setFetching(false))
  }, [debouncedQ])

  // Build merged suggestion list
  const q = query.toUpperCase()
  const localFiltered = q.length >= 1
    ? UNIVERSE_FLAT.filter(s =>
        s.symbol.startsWith(q) ||
        s.symbol.includes(q) ||
        s.name.toUpperCase().includes(q)
      )
    : UNIVERSE_FLAT.slice(0, 8)

  const localSymbols = new Set(localFiltered.map(s => s.symbol))
  const apiExtra = apiResults.filter(s => !localSymbols.has(s.symbol)).slice(0, 3)
  const suggestions: AssetSuggestion[] = [...localFiltered, ...apiExtra].slice(0, 8)

  useEffect(() => setHighlighted(0), [suggestions.length])

  const select = useCallback((asset: AssetSuggestion) => {
    onSelect(asset)
    setQuery('')
    setApiResults([])
    setOpen(false)
  }, [onSelect])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && suggestions[highlighted]) { e.preventDefault(); select(suggestions[highlighted]) }
    if (e.key === 'Escape')     { setOpen(false); inputRef.current?.blur() }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* ── input bar ─────────────────────────────────────── */}
      <div className={`flex items-center gap-2 rounded-xl border bg-zinc-800 px-3 py-2.5 transition-all ${
        open ? 'border-emerald-500 ring-1 ring-emerald-500/25' : 'border-zinc-700'
      }`}>
        <Search className="h-4 w-4 shrink-0 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search ticker or company…"
          value={query}
          onChange={e => { setQuery(e.target.value.toUpperCase()); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent text-sm font-medium text-white placeholder-zinc-500 focus:outline-none tracking-wide"
          autoComplete="off"
          spellCheck={false}
        />
        {fetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500 shrink-0" />}
        {query && !fetching && (
          <button
            type="button"
            onMouseDown={e => e.preventDefault()} // prevent blur before click
            onClick={() => { setQuery(''); setApiResults([]); inputRef.current?.focus() }}
          >
            <X className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300 transition-colors" />
          </button>
        )}
      </div>

      {/* ── inline suggestions panel ──────────────────────── */}
      {open && (
        <div className="overflow-hidden rounded-2xl border border-zinc-700/70 bg-zinc-900 shadow-xl shadow-black/40">
          {/* header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {query ? `Results for "${query}"` : 'Popular assets'}
            </p>
            {suggestions.length > 0 && (
              <p className="text-[10px] text-zinc-600">{suggestions.length} result{suggestions.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {/* cards */}
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {suggestions.map((s, i) => {
              const colorCls = s.sector
                ? (SECTOR_COLOR[s.sector] ?? 'text-zinc-400 bg-zinc-700/20')
                : 'text-zinc-400 bg-zinc-700/20'
              const isActive = i === highlighted
              return (
                <button
                  key={`${s.symbol}-${i}`}
                  type="button"
                  onMouseDown={e => e.preventDefault()} // keep input focus during click
                  onClick={() => select(s)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                    isActive ? 'bg-zinc-800' : 'hover:bg-zinc-800/60'
                  }`}
                >
                  <Logo sym={s.symbol} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tracking-wide text-emerald-400">
                        {s.symbol}
                      </span>
                      {s.sector && (
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colorCls}`}>
                          {shortSector(s.sector)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-400 mt-0.5">{s.name}</p>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-zinc-700'
                  }`} />
                </button>
              )
            })}

            {/* empty state */}
            {!fetching && suggestions.length === 0 && query.length >= 2 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-zinc-500">
                  No results for{' '}
                  <span className="font-semibold text-zinc-300">"{query}"</span>
                </p>
                <p className="mt-1 text-xs text-zinc-600">Try the exact ticker (e.g. AAPL, MSFT)</p>
              </div>
            )}
          </div>

          {/* footer */}
          <div className="border-t border-zinc-800 px-4 py-2">
            <p className="text-[10px] text-zinc-600">↑↓ navigate · Enter select · Esc close</p>
          </div>
        </div>
      )}
    </div>
  )
}
