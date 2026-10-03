import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, CheckCircle, Globe } from 'lucide-react'
import { STOCK_UNIVERSE, STOCK_NAMES } from '@/lib/stock-universe'

export const metadata: Metadata = {
  title: 'Best Canadian Stocks 2026: Investing in the TSX',
  description:
    'A complete guide to Canadian stocks on the TSX for 2026: Royal Bank, Shopify, Enbridge, Canadian Natural and 100+ more, with live prices in C$, plus how US investors can buy them.',
  alternates: { canonical: 'https://stockmarketroi.com/stocks/canada' },
  openGraph: {
    title: 'Best Canadian Stocks 2026 | Stock Market ROI',
    description: 'Royal Bank, Shopify, Enbridge and 100+ TSX stocks with live prices in C$, plus how to invest from the US.',
  },
}

const CA = STOCK_UNIVERSE.Canada
const label = (t: string) => STOCK_NAMES[t] ?? t.replace('.TO', '')

const FEATURED = [
  { symbol: 'RY.TO',  name: 'Royal Bank of Canada',       blurb: 'Canada\'s largest company and bank, the anchor of the finance-heavy TSX and a long-standing dividend payer.' },
  { symbol: 'SHOP.TO', name: 'Shopify',                    blurb: 'The e-commerce software giant, Canada\'s premier growth-tech name and a rival in scale to the big banks.' },
  { symbol: 'ENB.TO',  name: 'Enbridge',                   blurb: 'North America\'s pipeline backbone and a classic high-yield income stock, around 6% in dividends.' },
  { symbol: 'CNQ.TO',  name: 'Canadian Natural Resources', blurb: 'One of Canada\'s biggest oil and gas producers, a direct play on crude prices and the oil-sands economy.' },
  { symbol: 'TD.TO',   name: 'Toronto-Dominion Bank',      blurb: 'A top-five Canadian bank with a large US retail footprint, a core income and value holding.' },
  { symbol: 'CNR.TO',  name: 'Canadian National Railway',  blurb: 'A transcontinental railway and a wide-moat industrial that moves the Canadian economy coast to coast.' },
  { symbol: 'BAM.TO',  name: 'Brookfield Asset Management', blurb: 'A global alternative-asset manager in infrastructure, real estate and renewables, run out of Toronto.' },
  { symbol: 'ABX.TO',  name: 'Barrick Gold',               blurb: 'One of the world\'s largest gold miners, a leveraged play on the gold price from the TSX.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Best Canadian Stocks 2026: Investing in the TSX',
      description: 'A complete guide to Canadian stocks on the TSX for 2026, with live prices in C$ and how US investors can buy them.',
      url: 'https://stockmarketroi.com/stocks/canada',
      author: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
      publisher: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stockmarketroi.com' },
        { '@type': 'ListItem', position: 2, name: 'Stocks', item: 'https://stockmarketroi.com/stocks' },
        { '@type': 'ListItem', position: 3, name: 'Canadian Stocks', item: 'https://stockmarketroi.com/stocks/canada' },
      ],
    },
  ],
}

export default function CanadaStocksPage() {
  const year = new Date().getFullYear()
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/stocks" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        ← Stocks
      </Link>

      <span className="mb-3 block text-sm font-medium text-emerald-400">🇨🇦 Canadian Market</span>
      <h1 className="mb-3 text-3xl font-bold leading-tight text-zinc-100">
        Best Canadian Stocks {year}: Investing in the TSX
      </h1>
      <p className="mb-2 text-zinc-400 leading-relaxed">
        The Toronto Stock Exchange (TSX) is home to Canada&apos;s banks, pipelines, miners and a world-class
        tech name in Shopify. Below are {CA.length} of the most liquid Canadian stocks, with live prices in
        Canadian dollars (C$), fundamentals, and charts.
      </p>
      <p className="mb-8 text-xs text-zinc-600">
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·
        For informational purposes only. Not financial advice.
      </p>

      {/* How US investors access Canada */}
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-200">How to invest in Canada from the US</span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Many Canadian blue chips are dual-listed in New York, so US investors can often buy them directly.
          For example <Link href="/stocks/ry" className="text-emerald-400 hover:text-emerald-300">Royal Bank (RY)</Link>,{' '}
          <Link href="/stocks/td" className="text-emerald-400 hover:text-emerald-300">Toronto-Dominion (TD)</Link>,{' '}
          <Link href="/stocks/enb" className="text-emerald-400 hover:text-emerald-300">Enbridge (ENB)</Link> and{' '}
          <Link href="/stocks/shop" className="text-emerald-400 hover:text-emerald-300">Shopify (SHOP)</Link> all trade on
          both the TSX and a US exchange. For broad exposure, the iShares MSCI Canada ETF (EWC) holds a basket of
          large Canadian companies. The pages below track the TSX (.TO) listings in Canadian dollars.
        </p>
      </div>

      {/* Featured heavyweights */}
      <h2 className="mb-4 text-xl font-bold text-zinc-100">The heavyweights</h2>
      <div className="mb-10 space-y-4">
        {FEATURED.map((stock) => (
          <div key={stock.symbol} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-1 flex items-center gap-3 flex-wrap">
              <Link
                href={`/stocks/${stock.symbol.toLowerCase()}`}
                className="text-base font-bold text-zinc-100 hover:text-emerald-400 transition-colors"
              >
                {stock.name} ({stock.symbol.replace('.TO', '')})
              </Link>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">TSX</span>
            </div>
            <p className="mb-3 text-sm text-zinc-400 leading-relaxed">{stock.blurb}</p>
            <Link
              href={`/stocks/${stock.symbol.toLowerCase()}`}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <TrendingUp className="h-3 w-3" />
              View {stock.symbol.replace('.TO', '')} →
            </Link>
          </div>
        ))}
      </div>

      {/* Full universe */}
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-emerald-400" />
        <h2 className="text-xl font-bold text-zinc-100">All Canadian stocks ({CA.length})</h2>
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        Every TSX name we track, each with a live page (price in C$, fundamentals, dividends, chart, and the S&amp;P/TSX benchmark).
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CA.map((t) => (
          <Link
            key={t}
            href={`/stocks/${t.toLowerCase()}`}
            className="truncate rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
            title={label(t)}
          >
            <span className="font-semibold">{t.replace('.TO', '')}</span>
            <span className="ml-1.5 text-xs text-zinc-600">{label(t)}</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="mb-3 text-zinc-300">Track Canadian and global markets in real time</p>
        <Link
          href="/stocks"
          className="inline-block rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          Browse All Stocks →
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-zinc-600">
        TSX prices are shown in Canadian dollars (C$) and may be delayed. For informational purposes only; not financial advice.
      </p>
    </main>
  )
}
