'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Search, X, ChevronRight, Loader2 } from 'lucide-react'
import { UNIVERSE_FLAT } from '@/lib/stock-universe'
import type { CryptoMarket } from '@/types/crypto'

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

function useDebounce<T>(value: T, ms: number): T {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return dv
}

interface Result {
  symbol: string
  name: string
  sector?: string
  asset_type: 'stock' | 'crypto'
  coingeckoId?: string
  image?: string
  href: string
}

function StockLogo({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-zinc-800 overflow-hidden">
      {failed ? (
        <span className="text-xs font-bold text-zinc-400">{symbol.slice(0, 2)}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
          alt={symbol}
          width={36}
          height={36}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}

function CryptoLogo({ image, symbol }: { image: string; symbol: string }) {
  return (
    <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-zinc-800 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={symbol} width={36} height={36} className="rounded-full object-contain" />
    </div>
  )
}

export function GlobalSearch() {
  const [open, setOpen]             = useState(false)
  const [mounted, setMounted]       = useState(false)
  const [query, setQuery]           = useState('')
  const [apiResults, setApiResults] = useState<Result[]>([])
  const [fetching, setFetching]     = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()
  const debouncedQ = useDebounce(query, 260)

  useEffect(() => { setMounted(true) }, [])

  // Always keep crypto cache warm (used by search on any page)
  const { data: cryptoCache = [] } = useQuery<CryptoMarket[]>({
    queryKey: ['crypto-markets'],
    queryFn: () => fetch('/api/crypto/markets?limit=250').then((r) => r.json()),
    staleTime: 60_000,
    refetchInterval: false,
  })

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setApiResults([])
    }
  }, [open])

  // Fetch stocks API fallback for queries not in local universe
  useEffect(() => {
    if (debouncedQ.length < 2) { setApiResults([]); return }
    setFetching(true)
    const US_MICS = new Set(['XNAS', 'XNYS', 'XASE', 'BATS'])
    fetch(`/api/tickers?search=${encodeURIComponent(debouncedQ)}&limit=10`)
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
            .map(i => ({ symbol: i.symbol, name: i.name, asset_type: 'stock' as const, href: `/stocks/${i.symbol}` }))
        )
      })
      .catch(() => setApiResults([]))
      .finally(() => setFetching(false))
  }, [debouncedQ])

  // Build results list: stocks first, then crypto
  const q = query.toUpperCase().trim()

  const stockResults: Result[] = q.length >= 1
    ? UNIVERSE_FLAT
        .filter(s => s.symbol.startsWith(q) || s.symbol.includes(q) || s.name.toUpperCase().includes(q))
        .slice(0, 6)
        .map(s => ({ ...s, asset_type: 'stock' as const, href: `/stocks/${s.symbol}` }))
    : UNIVERSE_FLAT.slice(0, 4).map(s => ({ ...s, asset_type: 'stock' as const, href: `/stocks/${s.symbol}` }))

  const cryptoResults: Result[] = q.length >= 1
    ? cryptoCache
        .filter(c =>
          c.symbol.toUpperCase().includes(q) ||
          c.name.toUpperCase().includes(q)
        )
        .slice(0, 3)
        .map(c => ({
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          asset_type: 'crypto' as const,
          coingeckoId: c.id,
          image: c.image,
          href: `/crypto/${c.id}`,
        }))
    : cryptoCache.slice(0, 2).map(c => ({
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        asset_type: 'crypto' as const,
        coingeckoId: c.id,
        image: c.image,
        href: `/crypto/${c.id}`,
      }))

  const stockSymbols = new Set(stockResults.map(s => s.symbol))
  const apiExtra = apiResults.filter(s => !stockSymbols.has(s.symbol)).slice(0, 2)

  const results: Result[] = [...stockResults, ...cryptoResults, ...apiExtra].slice(0, 10)

  useEffect(() => setHighlighted(0), [results.length])

  const go = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && results[highlighted]) { e.preventDefault(); go(results[highlighted].href) }
    if (e.key === 'Escape')     { setOpen(false) }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
        title="Search (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search</span>
      </button>

      {/* Modal overlay — rendered via portal so backdrop-filter on Navbar header doesn't trap fixed positioning */}
      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-4 sm:pt-[12vh] px-4">
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/60 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close search"
            tabIndex={-1}
          />

          {/* Panel */}
          <div className="relative w-full max-w-xl rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/60 overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3.5">
              <Search className="h-4 w-4 shrink-0 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search stocks and crypto…"
                value={query}
                onChange={e => setQuery(e.target.value.toUpperCase())}
                onKeyDown={onKeyDown}
                className="flex-1 bg-transparent text-sm font-medium text-white placeholder-zinc-500 focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {fetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-500 shrink-0" />
              ) : (
                <button
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors sm:hidden"
                  aria-label="Close"
                >
                  Cancel
                </button>
              )}
              {!fetching && (
                <button
                  onClick={() => query ? setQuery('') : setOpen(false)}
                  className="shrink-0 hidden sm:block"
                  aria-label="Clear or close"
                >
                  <X className="h-4 w-4 text-zinc-500 hover:text-zinc-300 transition-colors" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[420px] overflow-y-auto overscroll-contain">
              {results.length > 0 ? (
                <>
                  {/* Stock section */}
                  {results.some(r => r.asset_type === 'stock') && (
                    <div className="px-4 pt-2.5 pb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Stocks</p>
                    </div>
                  )}
                  {results.filter(r => r.asset_type === 'stock').map((r, i) => {
                    const idx = results.indexOf(r)
                    const colorCls = r.sector
                      ? (SECTOR_COLOR[r.sector] ?? 'text-zinc-400 bg-zinc-700/20')
                      : 'text-zinc-400 bg-zinc-700/20'
                    return (
                      <button
                        key={`s-${r.symbol}-${i}`}
                        onClick={() => go(r.href)}
                        onMouseEnter={() => setHighlighted(idx)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                          highlighted === idx ? 'bg-zinc-800' : 'hover:bg-zinc-800/60'
                        }`}
                      >
                        <StockLogo symbol={r.symbol} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold tracking-wide text-emerald-400">{r.symbol}</span>
                            {r.sector && (
                              <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${colorCls}`}>
                                {shortSector(r.sector)}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-zinc-400 mt-0.5">{r.name}</p>
                        </div>
                        <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-colors ${highlighted === idx ? 'text-emerald-400' : 'text-zinc-700'}`} />
                      </button>
                    )
                  })}

                  {/* Crypto section */}
                  {results.some(r => r.asset_type === 'crypto') && (
                    <div className="px-4 pt-2.5 pb-1 border-t border-zinc-800/60 mt-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Crypto</p>
                    </div>
                  )}
                  {results.filter(r => r.asset_type === 'crypto').map((r, i) => {
                    const idx = results.indexOf(r)
                    return (
                      <button
                        key={`c-${r.symbol}-${i}`}
                        onClick={() => go(r.href)}
                        onMouseEnter={() => setHighlighted(idx)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                          highlighted === idx ? 'bg-zinc-800' : 'hover:bg-zinc-800/60'
                        }`}
                      >
                        {r.image
                          ? <CryptoLogo image={r.image} symbol={r.symbol} />
                          : <StockLogo symbol={r.symbol} />
                        }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold tracking-wide text-orange-400">{r.symbol}</span>
                            <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/15">Crypto</span>
                          </div>
                          <p className="truncate text-xs text-zinc-400 mt-0.5">{r.name}</p>
                        </div>
                        <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-colors ${highlighted === idx ? 'text-orange-400' : 'text-zinc-700'}`} />
                      </button>
                    )
                  })}
                </>
              ) : (
                query.length >= 2 && !fetching && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-zinc-500">
                      No results for <span className="font-semibold text-zinc-300">"{query}"</span>
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">Try the exact ticker (e.g. AAPL, BTC)</p>
                  </div>
                )
              )}
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  )
}
