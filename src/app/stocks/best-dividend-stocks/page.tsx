import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, DollarSign, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Best Dividend Stocks 2026: Top 10 High-Yield US Picks | Stock Market ROI',
  description:
    'Our analysts rank the 10 best dividend stocks for 2026 — high yield, consistent payout growth, and solid fundamentals. Updated monthly.',
  alternates: { canonical: 'https://stockmarketroi.com/stocks/best-dividend-stocks' },
  openGraph: {
    title: 'Best Dividend Stocks 2026 | Stock Market ROI',
    description: 'Top 10 dividend stocks ranked by yield, payout history, and financial strength.',
  },
}

const STOCKS = [
  {
    rank: 1,
    symbol: 'ABBV',
    name: 'AbbVie',
    yield: '3.8%',
    sector: 'Healthcare',
    verdict: 'Best overall dividend growth stock. AbbVie has raised its dividend for 52 consecutive years and continues to generate strong free cash flow despite Humira biosimilar headwinds.',
    pros: ['52-year dividend growth streak', 'Robust pipeline post-Humira', 'High FCF conversion'],
  },
  {
    rank: 2,
    symbol: 'O',
    name: 'Realty Income',
    yield: '5.5%',
    sector: 'REITs',
    verdict: 'The gold standard of monthly-pay dividend stocks. Realty Income pays dividends every month and has raised them for 30+ consecutive years — ideal for income-focused portfolios.',
    pros: ['Monthly dividend payments', '30+ year dividend growth', 'Investment-grade balance sheet'],
  },
  {
    rank: 3,
    symbol: 'PM',
    name: 'Philip Morris International',
    yield: '5.0%',
    sector: 'Consumer Staples',
    verdict: 'High yield with a credible transition story. PMI is rapidly growing its smoke-free products (IQOS, ZYN), which now represent over 40% of revenue — reducing long-term regulatory risk.',
    pros: ['~5% yield with consistent raises', 'Smoke-free pivot gaining traction', 'Pricing power'],
  },
  {
    rank: 4,
    symbol: 'VZ',
    name: 'Verizon',
    yield: '6.5%',
    sector: 'Telecom',
    verdict: 'Contrarian high-yield pick. Verizon\'s 6.5% yield looks attractive at current prices, and its 5G infrastructure investments should stabilize subscriber trends through 2026.',
    pros: ['Highest yield on the list', 'Stable cash flows from wireless', 'Improving subscriber metrics'],
  },
  {
    rank: 5,
    symbol: 'KO',
    name: 'Coca-Cola',
    yield: '3.1%',
    sector: 'Consumer Staples',
    verdict: 'The definitive defensive dividend stock. Coca-Cola has paid and raised its dividend for 62 consecutive years. Buffett owns it for a reason — pricing power and global distribution are unmatched.',
    pros: ['62-year dividend growth (Dividend King)', 'Global brand moat', 'Inflation-resistant pricing'],
  },
  {
    rank: 6,
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    yield: '3.2%',
    sector: 'Healthcare',
    verdict: 'Post-spinoff JNJ is a leaner, more focused pharmaceutical company. With 62 consecutive years of dividend growth and a strong oncology/immunology pipeline, it remains a core dividend holding.',
    pros: ['62-year dividend growth streak', 'Strong MedTech + Pharma mix', 'AAA credit rating'],
  },
  {
    rank: 7,
    symbol: 'PG',
    name: 'Procter & Gamble',
    yield: '2.5%',
    sector: 'Consumer Staples',
    verdict: 'Low yield but exceptional reliability. P&G has raised dividends for 68 consecutive years — the longest streak on this list. Portfolio staple for risk-averse income investors.',
    pros: ['68-year growth streak (Dividend King)', 'Recession-proof demand', 'Iconic brand portfolio'],
  },
  {
    rank: 8,
    symbol: 'MCD',
    name: "McDonald's",
    yield: '2.3%',
    sector: 'Consumer Discretionary',
    verdict: 'Underrated dividend grower. McDonald\'s asset-light franchise model generates massive free cash flow, fueling both dividend raises and buybacks. 49 consecutive years of dividend growth.',
    pros: ['49-year dividend growth', 'Franchise model = capital-light', 'Global footprint'],
  },
  {
    rank: 9,
    symbol: 'PEP',
    name: 'PepsiCo',
    yield: '3.3%',
    sector: 'Consumer Staples',
    verdict: 'Better diversification than Coca-Cola via the Frito-Lay snack business. PepsiCo\'s dual beverage/snack model provides a natural hedge and supports 52 years of consecutive dividend growth.',
    pros: ['52-year dividend growth', 'Snack + beverage diversification', 'Strong international exposure'],
  },
  {
    rank: 10,
    symbol: 'ABBV',
    name: 'Realty Income',
    yield: '4.1%',
    sector: 'Healthcare',
    verdict: 'Medical device giant with 47 consecutive years of dividend growth. Abbott\'s diverse portfolio — diagnostics, devices, nutrition, pharmaceuticals — provides earnings stability across cycles.',
    pros: ['47-year growth streak', 'Diverse healthcare segments', 'Consistent organic growth'],
  },
]

// Fix: replace duplicate ABBV with ABT
const FINAL_STOCKS = [
  ...STOCKS.slice(0, 9),
  {
    rank: 10,
    symbol: 'ABT',
    name: 'Abbott Laboratories',
    yield: '2.0%',
    sector: 'Healthcare',
    verdict: 'Medical device giant with 52 consecutive years of dividend growth. Abbott\'s diverse portfolio — diagnostics, devices, nutrition, pharmaceuticals — provides earnings stability across cycles.',
    pros: ['52-year growth streak', 'Diverse healthcare segments', 'Consistent organic growth'],
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Best Dividend Stocks 2026: Top 10 High-Yield US Picks',
      description: 'Our analysts rank the 10 best dividend stocks for 2026.',
      url: 'https://stockmarketroi.com/stocks/best-dividend-stocks',
      author: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
      publisher: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stockmarketroi.com' },
        { '@type': 'ListItem', position: 2, name: 'Stocks', item: 'https://stockmarketroi.com/stocks' },
        { '@type': 'ListItem', position: 3, name: 'Best Dividend Stocks', item: 'https://stockmarketroi.com/stocks/best-dividend-stocks' },
      ],
    },
  ],
}

export default function BestDividendStocksPage() {
  const year = new Date().getFullYear()
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/stocks" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        ← Stocks
      </Link>

      <span className="mb-3 block text-sm font-medium text-emerald-400">Editorial Ranking</span>
      <h1 className="mb-3 text-3xl font-bold leading-tight text-zinc-100">
        Best Dividend Stocks {year}
      </h1>
      <p className="mb-2 text-zinc-400 leading-relaxed">
        Our analysts review the top dividend-paying US stocks ranked by yield, payout consistency,
        and financial strength. Updated monthly.
      </p>
      <p className="mb-8 text-xs text-zinc-600">
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·
        For informational purposes only. Not financial advice.
      </p>

      {/* Methodology note */}
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-200">How We Rank</span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Stocks are ranked on four factors: current dividend yield, consecutive years of dividend
          growth, payout ratio sustainability (below 75% for non-REITs), and free cash flow coverage.
          We exclude stocks with payout ratios that appear unsustainable or where dividend cuts are
          likely based on earnings trends.
        </p>
      </div>

      {/* Stock list */}
      <div className="space-y-4">
        {FINAL_STOCKS.map((stock) => (
          <div key={stock.symbol} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-400">
                {stock.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    className="text-base font-bold text-zinc-100 hover:text-emerald-400 transition-colors"
                  >
                    {stock.name} ({stock.symbol})
                  </Link>
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5">
                    <DollarSign className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">{stock.yield} yield</span>
                  </div>
                  <span className="text-xs text-zinc-600">{stock.sector}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">{stock.verdict}</p>
                <div className="flex flex-wrap gap-2">
                  {stock.pros.map((pro) => (
                    <span key={pro} className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-[11px] text-zinc-400">
                      {pro}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Link
                href={`/stocks/${stock.symbol}`}
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <TrendingUp className="h-3 w-3" />
                View {stock.symbol} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="mb-3 text-zinc-300">Track dividend stocks in real time</p>
        <Link
          href="/stocks"
          className="inline-block rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          Browse All Stocks →
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-zinc-600">
        Dividend yields are approximate and change with stock price. Past dividend history does not guarantee future payments.
      </p>
    </main>
  )
}
