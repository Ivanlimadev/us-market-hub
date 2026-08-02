import Link from 'next/link'
import { getSector, STOCK_UNIVERSE, STOCK_NAMES, isDelisted } from '@/lib/stock-universe'

/**
 * Server-rendered internal links to sector peers.
 *
 * Unlike <RelatedAssets> (client component, live prices, links only appear after
 * a React Query fetch), these anchors are in the initial SSR HTML - so Googlebot
 * sees them on first crawl. That gives every ticker page real inbound/outbound
 * internal links and lets Google discover + prioritize the long-tail pages
 * instead of leaving them as sitemap-only orphans ("Discovered - not indexed").
 *
 * Peers are a rotating window of the sector *around* the current symbol (not the
 * first N), so link equity spreads across the whole sector - every ticker, incl.
 * the long tail, gets inbound links from its neighbours. Lowercase paths match
 * each page's canonical, avoiding a 301 hop that wastes crawl budget.
 */
export function RelatedStocksLinks({ symbol }: { symbol: string }) {
  const upper = symbol.toUpperCase()
  const sector = getSector(upper)
  if (!sector) return null

  const arr = (STOCK_UNIVERSE[sector] ?? []).filter((s) => !isDelisted(s))
  if (arr.length < 2) return null

  // Rotating window of up to 14 peers starting just after the current symbol.
  const idx = Math.max(0, arr.indexOf(upper))
  const peers: string[] = []
  for (let i = 1; i <= arr.length && peers.length < 14; i++) {
    const s = arr[(idx + i) % arr.length]
    if (s !== upper && !peers.includes(s)) peers.push(s)
  }
  if (peers.length === 0) return null

  return (
    <nav
      aria-label={`More ${sector} stocks`}
      className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
    >
      <h3 className="mb-2 text-sm font-semibold text-zinc-300">More {sector} stocks</h3>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {peers.map((s) => (
          <Link
            key={s}
            href={`/stocks/${s.toLowerCase()}`}
            className="text-xs text-zinc-400 underline-offset-2 hover:text-[#c8a45d] hover:underline"
          >
            {STOCK_NAMES[s] ?? s} <span className="text-zinc-600">({s})</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
