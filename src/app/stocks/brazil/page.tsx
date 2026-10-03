import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, CheckCircle, Globe } from 'lucide-react'
import { STOCK_UNIVERSE, STOCK_NAMES } from '@/lib/stock-universe'

export const metadata: Metadata = {
  title: 'Best Brazilian Stocks 2026: Investing in the B3 (Bovespa)',
  description:
    'A complete guide to Brazilian stocks on the B3 (Bovespa) for 2026: Petrobras, Vale, Itaú, Nubank and 190+ more, with live prices in R$, plus how US investors can buy them via ADRs and the EWZ ETF.',
  alternates: { canonical: 'https://stockmarketroi.com/stocks/brazil' },
  openGraph: {
    title: 'Best Brazilian Stocks 2026 | Stock Market ROI',
    description: 'Petrobras, Vale, Itaú, Nubank and 190+ B3 stocks with live prices in R$, plus how to invest from the US.',
  },
}

const BR = STOCK_UNIVERSE.Brazil
const label = (t: string) => STOCK_NAMES[t] ?? t.replace('.SA', '')

const FEATURED = [
  { symbol: 'PETR4.SA', name: 'Petrobras',            blurb: 'State-controlled oil major and the market\'s bellwether; a high-dividend, high-political-risk name.' },
  { symbol: 'VALE3.SA', name: 'Vale',                 blurb: 'One of the world\'s largest iron-ore miners; a direct play on global commodity demand, especially China.' },
  { symbol: 'ITUB4.SA', name: 'Itaú Unibanco',        blurb: 'Latin America\'s largest bank by market value; the anchor of Brazil\'s finance-heavy index.' },
  { symbol: 'BBDC4.SA', name: 'Banco Bradesco',       blurb: 'One of the big private Brazilian banks, a core holding for income and exposure to domestic credit.' },
  { symbol: 'BBAS3.SA', name: 'Banco do Brasil',      blurb: 'State-controlled bank that pays a high dividend yield and trades at a persistent valuation discount.' },
  { symbol: 'ABEV3.SA', name: 'Ambev',                blurb: 'The AB InBev-controlled beverage giant; a defensive consumer-staples anchor of the Ibovespa.' },
  { symbol: 'WEGE3.SA', name: 'WEG',                  blurb: 'Global electric-motor and automation maker; Brazil\'s premier industrial quality-compounder.' },
  { symbol: 'B3SA3.SA', name: 'B3',                   blurb: 'Operator of the Brazilian stock exchange itself, a toll-booth on the market\'s trading volume.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Best Brazilian Stocks 2026: Investing in the B3 (Bovespa)',
      description: 'A complete guide to Brazilian stocks on the B3 for 2026, with live prices in R$ and how US investors can buy them.',
      url: 'https://stockmarketroi.com/stocks/brazil',
      author: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
      publisher: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stockmarketroi.com' },
        { '@type': 'ListItem', position: 2, name: 'Stocks', item: 'https://stockmarketroi.com/stocks' },
        { '@type': 'ListItem', position: 3, name: 'Brazilian Stocks', item: 'https://stockmarketroi.com/stocks/brazil' },
      ],
    },
  ],
}

export default function BrazilStocksPage() {
  const year = new Date().getFullYear()
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/stocks" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        ← Stocks
      </Link>

      <span className="mb-3 block text-sm font-medium text-emerald-400">🇧🇷 Brazilian Market</span>
      <h1 className="mb-3 text-3xl font-bold leading-tight text-zinc-100">
        Best Brazilian Stocks {year}: Investing in the B3
      </h1>
      <p className="mb-2 text-zinc-400 leading-relaxed">
        Brazil&apos;s B3 (formerly Bovespa) is Latin America&apos;s largest stock exchange, home to global
        commodity giants, high-yielding banks, and fast-growing consumer names. Below are {BR.length}{' '}
        of the most liquid Brazilian stocks, with live prices in Brazilian reais (R$), fundamentals, and charts.
      </p>
      <p className="mb-8 text-xs text-zinc-600">
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·
        For informational purposes only. Not financial advice.
      </p>

      {/* How US investors access Brazil */}
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-200">How to invest in Brazil from the US</span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          B3-listed shares trade in Brazilian reais. US investors usually get exposure through the{' '}
          <Link href="/stocks/ewz" className="text-emerald-400 hover:text-emerald-300">iShares MSCI Brazil ETF (EWZ)</Link>{' '}
          or US-listed ADRs such as{' '}
          <Link href="/stocks/pbr" className="text-emerald-400 hover:text-emerald-300">Petrobras (PBR)</Link>,{' '}
          <Link href="/stocks/vale" className="text-emerald-400 hover:text-emerald-300">Vale (VALE)</Link>,{' '}
          <Link href="/stocks/itub" className="text-emerald-400 hover:text-emerald-300">Itaú (ITUB)</Link> and{' '}
          <Link href="/stocks/nu" className="text-emerald-400 hover:text-emerald-300">Nubank (NU)</Link>. See our full guide on{' '}
          <Link href="/blog/how-to-invest-in-brazil-from-us-etfs-adrs-ewz-pbr" className="text-emerald-400 hover:text-emerald-300">how to invest in Brazil from the US</Link>.
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
                {stock.name} ({stock.symbol.replace('.SA', '')})
              </Link>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">B3</span>
            </div>
            <p className="mb-3 text-sm text-zinc-400 leading-relaxed">{stock.blurb}</p>
            <Link
              href={`/stocks/${stock.symbol.toLowerCase()}`}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <TrendingUp className="h-3 w-3" />
              View {stock.symbol.replace('.SA', '')} →
            </Link>
          </div>
        ))}
      </div>

      {/* Full universe */}
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-emerald-400" />
        <h2 className="text-xl font-bold text-zinc-100">All Brazilian stocks ({BR.length})</h2>
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        Every B3 name we track, each with a live page (price in R$, fundamentals, dividends, chart, and the Ibovespa benchmark).
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BR.map((t) => (
          <Link
            key={t}
            href={`/stocks/${t.toLowerCase()}`}
            className="truncate rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
            title={label(t)}
          >
            <span className="font-semibold">{t.replace('.SA', '')}</span>
            <span className="ml-1.5 text-xs text-zinc-600">{label(t)}</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="mb-3 text-zinc-300">Track Brazilian and global markets in real time</p>
        <Link
          href="/stocks"
          className="inline-block rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          Browse All Stocks →
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-zinc-600">
        B3 prices are shown in Brazilian reais (R$) and may be delayed. For informational purposes only; not financial advice.
      </p>
    </main>
  )
}
