import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, CheckCircle, Globe } from 'lucide-react'
import { STOCK_UNIVERSE, STOCK_NAMES } from '@/lib/stock-universe'

export const metadata: Metadata = {
  title: 'All US Stocks List 2026: Every Ticker Symbol We Track by Sector',
  description:
    'A complete list of every US stock ticker we track, organized by sector: technology, healthcare, financials, energy and more. Click any ticker symbol for a free live quote, fundamentals, dividends and charts.',
  alternates: { canonical: 'https://stockmarketroi.com/stocks/all' },
  openGraph: {
    title: 'All US Stocks List 2026 | Stock Market ROI',
    description: 'Every US stock ticker symbol we track, by sector, each with a free live quote and full analysis.',
  },
}

// US-market directory: every sector except the Brazil/Canada buckets, which
// have their own dedicated hub pages linked below.
const SECTORS = Object.entries(STOCK_UNIVERSE).filter(
  ([name]) => name !== 'Brazil' && name !== 'Canada',
)
const dedup = (a: string[]) => Array.from(new Set(a))
const label = (t: string) => STOCK_NAMES[t] ?? t
const TOTAL = dedup(SECTORS.flatMap(([, syms]) => syms)).length

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      name: 'All US Stocks List 2026: Every Ticker We Track by Sector',
      description: `A complete directory of ${TOTAL}+ US stock ticker symbols organized by sector, each with a free live quote, fundamentals, dividends and charts.`,
      url: 'https://stockmarketroi.com/stocks/all',
      publisher: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stockmarketroi.com' },
        { '@type': 'ListItem', position: 2, name: 'Stocks', item: 'https://stockmarketroi.com/stocks' },
        { '@type': 'ListItem', position: 3, name: 'All Stocks', item: 'https://stockmarketroi.com/stocks/all' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How many stocks can I look up here?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `We track ${TOTAL}+ US stocks across every major sector, plus hundreds more Brazilian and Canadian names on their own hub pages. Each ticker has a free live quote, fundamentals, dividends and charts.`,
          },
        },
        {
          '@type': 'Question',
          name: 'What is a stock ticker symbol?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A ticker symbol is the short code that identifies a stock on an exchange, such as AAPL for Apple or MSFT for Microsoft. You use it to look up a quote or place a trade.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are the stock quotes free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Every stock page on Stock Market ROI shows a free quote with price, fundamentals, dividends and charts. Prices may be delayed and are for informational purposes only.',
          },
        },
      ],
    },
  ],
}

export default function AllStocksPage() {
  const year = new Date().getFullYear()
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/stocks" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        ← Stocks
      </Link>

      <h1 className="mb-3 text-3xl font-bold leading-tight text-zinc-100">
        All US Stocks List {year}: Every Ticker Symbol by Sector
      </h1>
      <p className="mb-2 text-zinc-400 leading-relaxed">
        A complete directory of the {TOTAL}+ US stock ticker symbols we track, grouped by sector. Click any
        ticker for a free live quote with price, fundamentals, dividends and charts. Looking for a specific
        name? Use the <Link href="/screener" className="text-emerald-400 hover:text-emerald-300">stock screener</Link>{' '}
        to filter and sort the whole list.
      </p>
      <p className="mb-8 text-xs text-zinc-600">
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·
        Quotes may be delayed. For informational purposes only. Not financial advice.
      </p>

      {/* International hubs */}
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-200">Looking beyond the US?</span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          We also track hundreds of international names. Browse the{' '}
          <Link href="/stocks/brazil" className="text-emerald-400 hover:text-emerald-300">Brazilian stocks (B3)</Link>{' '}
          and{' '}
          <Link href="/stocks/canada" className="text-emerald-400 hover:text-emerald-300">Canadian stocks (TSX)</Link>{' '}
          directories, each with local-currency prices and the right benchmark.
        </p>
      </div>

      {/* Full directory by sector */}
      <div className="mb-4 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-emerald-400" />
        <h2 className="text-xl font-bold text-zinc-100">Every US stock we track ({TOTAL})</h2>
      </div>

      <div className="space-y-8">
        {SECTORS.map(([sector, syms]) => {
          const list = dedup(syms)
          return (
            <section key={sector}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                {sector} ({list.length})
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {list.map((t) => (
                  <Link
                    key={t}
                    href={`/stocks/${t.toLowerCase()}`}
                    className="truncate rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                    title={label(t)}
                  >
                    <span className="font-semibold">{t}</span>
                    <span className="ml-1.5 text-xs text-zinc-600">{label(t)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="mb-3 text-zinc-300">Filter and sort every stock by fundamentals</p>
        <Link
          href="/screener"
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          Open the stock screener →
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Quotes may be delayed and are for informational purposes only; not financial advice.
      </p>
    </main>
  )
}
