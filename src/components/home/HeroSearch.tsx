'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { UNIVERSE_FLAT } from '@/lib/stock-universe'

// Investidor10-style hero: a big centred search that funnels visitors straight
// into an asset page. Autocomplete covers BOTH stocks (local UNIVERSE_FLAT, no
// fetch) and crypto (shared /api/crypto/markets cache, same as GlobalSearch).
const POPULAR = [
  { label: 'Apple', href: '/stocks/AAPL' },
  { label: 'Nvidia', href: '/stocks/NVDA' },
  { label: 'Tesla', href: '/stocks/TSLA' },
  { label: 'Microsoft', href: '/stocks/MSFT' },
  { label: 'Bitcoin', href: '/crypto/bitcoin' },
]

// Popular brand names that differ from the legal company name, so searching the
// brand still works (e.g. "google" → Alphabet/GOOGL, "facebook" → Meta/META).
const ALIASES: Record<string, string> = {
  GOOGL: 'GOOGLE',
  GOOG: 'GOOGLE',
  META: 'FACEBOOK INSTAGRAM WHATSAPP',
  BRK: 'BERKSHIRE HATHAWAY',
  'BRK.B': 'BERKSHIRE HATHAWAY',
  'BRK.A': 'BERKSHIRE HATHAWAY',
}

type Match = { symbol: string; name: string; href: string; kind: 'stock' | 'crypto' }
type CryptoMarket = { id: string; symbol: string; name: string; image?: string }

function useDebounce<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)

  // Shared with the Navbar's GlobalSearch (same queryKey) — no duplicate fetch.
  const { data: cryptoData } = useQuery<CryptoMarket[]>({
    queryKey: ['crypto-markets'],
    queryFn: () => fetch('/api/crypto/markets?limit=250').then((r) => r.json()),
    staleTime: 60_000,
    refetchInterval: false,
  })
  const cryptoCache = Array.isArray(cryptoData) ? cryptoData : []

  // Live ticker fallback (same source as GlobalSearch) so US-listed names that
  // aren't in the curated universe still autocomplete (e.g. PBR, NU).
  const [apiResults, setApiResults] = useState<Match[]>([])
  const debouncedQ = useDebounce(query.trim(), 250)
  useEffect(() => {
    if (debouncedQ.length < 2) {
      setApiResults([])
      return
    }
    const US = new Set(['XNAS', 'XNYS', 'XASE', 'BATS'])
    fetch(`/api/tickers?search=${encodeURIComponent(debouncedQ)}&limit=10`)
      .then((r) => r.json())
      .then((d) => {
        const items = (d.data ?? []) as Array<{
          symbol: string
          name: string
          stock_exchange?: { mic?: string; acronym?: string }
        }>
        setApiResults(
          items
            .filter((i) => {
              const mic = i.stock_exchange?.mic ?? ''
              const acr = i.stock_exchange?.acronym ?? ''
              return US.has(mic) || acr.includes('NASDAQ') || acr.includes('NYSE')
            })
            .map((i) => ({
              symbol: i.symbol.toUpperCase(),
              name: i.name,
              href: `/stocks/${i.symbol.toUpperCase()}`,
              kind: 'stock' as const,
            })),
        )
      })
      .catch(() => setApiResults([]))
  }, [debouncedQ])

  const q = query.toUpperCase().trim()
  const matches = useMemo<Match[]>(() => {
    if (q.length < 1) return []
    // Relevance: exact symbol > symbol prefix > name prefix > any contains.
    // Applied across stocks AND crypto so "bitcoin" surfaces the coin above ETFs.
    const score = (sym: string, name: string): number => {
      const S = sym.toUpperCase()
      const N = name.toUpperCase()
      if (S === q) return 0
      if (S.startsWith(q)) return 1 // typing the start of the ticker
      if (N.startsWith(q)) return 2 // typing the start of the company name
      // Typing PAST the ticker (e.g. "GOOGLE" → GOOGL). Ranked below a real name
      // match so "apple" keeps AAPL above APP. Length guard avoids 1–2 char noise.
      if (q.startsWith(S) && S.length >= 3) return 3
      if (S.includes(q) || N.includes(q)) return 4
      return 99
    }

    const stocks = UNIVERSE_FLAT.map((s) => {
      // Fold brand aliases into the searchable name so the popular name works too.
      const searchName = ALIASES[s.symbol] ? `${s.name} ${ALIASES[s.symbol]}` : s.name
      return {
        symbol: s.symbol,
        name: s.name,
        href: `/stocks/${s.symbol}`,
        kind: 'stock' as const,
        s: score(s.symbol, searchName),
      }
    })
    const crypto = cryptoCache.map((c) => ({
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      href: `/crypto/${c.id}`,
      kind: 'crypto' as const,
      s: score(c.symbol, c.name),
    }))

    const local: Match[] = [...stocks, ...crypto]
      .filter((m) => m.s < 99)
      .sort((a, b) => a.s - b.s)
      .slice(0, 6)
      .map(({ s: _s, ...m }) => m)

    // Fold in live US tickers not already covered by the local universe (PBR…).
    const seen = new Set(local.map((m) => m.symbol))
    const apiExtra = apiResults.filter((m) => !seen.has(m.symbol)).slice(0, 3)
    apiExtra.forEach((m) => seen.add(m.symbol))

    // Direct-open fallback: keep any valid-looking ticker reachable even if
    // nothing matched it exactly. Kept LAST so it never outranks real matches.
    const isTicker = /^[A-Z]{1,6}(\.[A-Z]{1,2})?$/.test(q)
    const direct: Match[] =
      q.length >= 2 && isTicker && !seen.has(q)
        ? [{ symbol: q, name: `Open ${q} page →`, href: `/stocks/${q}`, kind: 'stock' }]
        : []

    return [...local, ...apiExtra, ...direct].slice(0, 8)
  }, [q, cryptoCache, apiResults])

  function go(href: string) {
    router.push(href)
  }

  // Enter / button: open the highlighted match, else best-effort the raw ticker.
  function submit() {
    if (matches[hi]) return go(matches[hi].href)
    if (q) return go(`/stocks/${q}`)
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 py-12 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.10),transparent_60%)]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <h1 className="text-2xl font-bold leading-tight text-white sm:text-4xl">
          Search any stock for{' '}
          <span className="text-emerald-400">quotes, fundamentals &amp; charts</span>
        </h1>

        <div className="relative mx-auto mt-8 max-w-2xl">
          <div className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white p-1.5 shadow-xl focus-within:border-emerald-500">
            <Search className="ml-3 h-5 w-5 shrink-0 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
                setHi(0)
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setHi((h) => Math.min(h + 1, matches.length - 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setHi((h) => Math.max(h - 1, 0))
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder="Search a stock or crypto (e.g. AAPL, Tesla, Bitcoin)…"
              aria-label="Search stocks"
              className="h-11 w-full bg-transparent text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
            <button
              onClick={submit}
              className="shrink-0 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 sm:px-7"
            >
              Search
            </button>
          </div>

          {open && matches.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white text-left shadow-2xl">
              {matches.map((m, i) => (
                <li key={`${m.kind}-${m.symbol}`}>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      go(m.href)
                    }}
                    onMouseEnter={() => setHi(i)}
                    className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      i === hi ? 'bg-emerald-50' : 'hover:bg-neutral-50'
                    } active:bg-emerald-100`}
                  >
                    <span className="font-bold text-neutral-900">{m.symbol}</span>
                    <span className="truncate text-neutral-500">{m.name}</span>
                    <span
                      className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        m.kind === 'crypto'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {m.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-zinc-400">Most searched:</span>
          {POPULAR.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              {p.label}
            </Link>
          ))}
          <Link
            href="/screener"
            className="ml-1 font-medium text-emerald-400 hover:text-emerald-300"
          >
            Advanced Search →
          </Link>
        </div>
      </div>
    </section>
  )
}
