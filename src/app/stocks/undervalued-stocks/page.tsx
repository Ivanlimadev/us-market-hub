import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Target, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Most Undervalued Stocks 2026: Cheap US Stocks Worth Buying | Stock Market ROI',
  description:
    'Our analysts identify the most undervalued US stocks in 2026 - trading below intrinsic value with strong fundamentals and catalysts ahead.',
  alternates: { canonical: 'https://stockmarketroi.com/stocks/undervalued-stocks' },
  openGraph: {
    title: 'Most Undervalued Stocks 2026 | Stock Market ROI',
    description: 'Stocks trading below intrinsic value with strong fundamentals - our 2026 undervalued picks.',
  },
}

const STOCKS = [
  {
    rank: 1,
    symbol: 'BRK-B',
    name: 'Berkshire Hathaway',
    pe: '~13x',
    sector: 'Financials',
    upside: 'High',
    verdict: 'The most undervalued blue chip on the market. Berkshire trades at ~1.4x book value with a $180B+ cash hoard - historically a signal that Buffett sees few attractive options and is building dry powder for a downturn opportunity.',
    catalysts: ['$180B+ cash deployment catalyst', 'Insurance float advantage', 'Succession clarity building'],
  },
  {
    rank: 2,
    symbol: 'JPM',
    name: 'JPMorgan Chase',
    pe: '~12x',
    sector: 'Banking',
    upside: 'Medium-High',
    verdict: 'The best bank in the world, consistently trading at a discount to its franchise value. JPMorgan generates $50B+ in annual net income and has the strongest balance sheet in US banking. Rate normalization is a tailwind.',
    catalysts: ['Best-in-class deposit franchise', 'Investment banking recovery', 'AI-driven cost efficiency'],
  },
  {
    rank: 3,
    symbol: 'GOOGL',
    name: 'Alphabet',
    pe: '~18x forward',
    sector: 'Technology',
    upside: 'High',
    verdict: 'Trading at a discount to peers despite owning the dominant search engine, YouTube, and Google Cloud. The market is pricing in AI search disruption risk - but Gemini integration and Cloud growth suggest Alphabet is adapting faster than feared.',
    catalysts: ['Gemini AI integration in Search', 'Google Cloud growth acceleration', 'Waymo monetization optionality'],
  },
  {
    rank: 4,
    symbol: 'BAC',
    name: 'Bank of America',
    pe: '~11x',
    sector: 'Banking',
    upside: 'Medium',
    verdict: 'More interest-rate-sensitive than JPM, which made 2023-24 painful. That same rate sensitivity is now a tailwind as rates normalize. BAC\'s massive consumer deposit base and Merrill Lynch wealth platform are underappreciated assets.',
    catalysts: ['Rate sensitivity turning positive', 'Wealth management scale', 'Consumer spending resilience'],
  },
  {
    rank: 5,
    symbol: 'XOM',
    name: 'Exxon Mobil',
    pe: '~14x',
    sector: 'Energy',
    upside: 'Medium',
    verdict: 'Energy majors are still trading as if the energy transition has already ended oil demand. ExxonMobil\'s Pioneer acquisition added Permian Basin scale that competes with shale growth at ~$35/barrel breakeven.',
    catalysts: ['Pioneer assets integration', 'LNG demand growth', 'Carbon capture optionality'],
  },
  {
    rank: 6,
    symbol: 'CVX',
    name: 'Chevron',
    pe: '~15x',
    sector: 'Energy',
    upside: 'Medium',
    verdict: 'Chevron\'s balance sheet is one of the strongest in Big Oil - net debt is minimal and the buyback program is aggressive. The Hess acquisition adds significant deepwater Guyana exposure, a world-class low-cost asset.',
    catalysts: ['Hess/Guyana deepwater production', 'Dividend + buyback returns', 'Low breakeven cost structure'],
  },
  {
    rank: 7,
    symbol: 'INTC',
    name: 'Intel',
    pe: 'Recovering',
    sector: 'Semiconductors',
    upside: 'High (speculative)',
    verdict: 'The highest-risk pick on this list, but the potential upside is significant. Intel\'s foundry business is years behind TSMC, but the US government\'s CHIPS Act incentives and data center AI chip roadmap (Gaudi) give it a realistic path to relevance.',
    catalysts: ['CHIPS Act $8.5B funding', 'Foundry customers diversifying from TSMC', 'Gaudi AI accelerator traction'],
  },
  {
    rank: 8,
    symbol: 'MRK',
    name: 'Merck',
    pe: '~12x forward',
    sector: 'Healthcare',
    upside: 'Medium-High',
    verdict: 'Keytruda (pembrolizumab) is the world\'s best-selling oncology drug, yet Merck trades at a meaningful discount to pharma peers. The market is overly fixated on Keytruda\'s 2028 patent cliff - Merck has a deep pipeline to offset it.',
    catalysts: ['Keytruda subcutaneous formulation (patent extension)', 'WINREVAIR (pulmonary arterial hypertension)', 'Multiple Phase 3 readouts in 2026'],
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Most Undervalued Stocks 2026: Cheap US Stocks Worth Buying',
      description: 'Our analysts identify the most undervalued US stocks in 2026.',
      url: 'https://stockmarketroi.com/stocks/undervalued-stocks',
      author: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
      publisher: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stockmarketroi.com' },
        { '@type': 'ListItem', position: 2, name: 'Stocks', item: 'https://stockmarketroi.com/stocks' },
        { '@type': 'ListItem', position: 3, name: 'Undervalued Stocks', item: 'https://stockmarketroi.com/stocks/undervalued-stocks' },
      ],
    },
  ],
}

export default function UndervaluedStocksPage() {
  const year = new Date().getFullYear()
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/stocks" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        ← Stocks
      </Link>

      <span className="mb-3 block text-sm font-medium text-emerald-400">Editorial Ranking</span>
      <h1 className="mb-3 text-3xl font-bold leading-tight text-zinc-100">
        Most Undervalued Stocks {year}
      </h1>
      <p className="mb-2 text-zinc-400 leading-relaxed">
        Stocks trading below their intrinsic value with clear catalysts ahead. Our analysts focus
        on quality businesses at reasonable prices - not just low P/E stocks.
      </p>
      <p className="mb-8 text-xs text-zinc-600">
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·
        For informational purposes only. Not financial advice.
      </p>

      {/* Methodology note */}
      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-200">How We Identify Undervaluation</span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          We screen for stocks trading below their 5-year average P/E multiple, with at least one
          identifiable near-term catalyst and a balance sheet strong enough to survive a downturn.
          We deliberately exclude "value traps" - companies that are cheap because the business is
          in permanent decline.
        </p>
      </div>

      <div className="space-y-4">
        {STOCKS.map((stock) => (
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
                  <div className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-0.5">
                    <Target className="h-3 w-3 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-400">P/E {stock.pe}</span>
                  </div>
                  <span className="text-xs text-zinc-600">{stock.sector}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">{stock.verdict}</p>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Catalysts</p>
                  <div className="flex flex-wrap gap-2">
                    {stock.catalysts.map((cat) => (
                      <span key={cat} className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-[11px] text-zinc-400">
                        {cat}
                      </span>
                    ))}
                  </div>
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
        <p className="mb-3 text-zinc-300">Screen stocks by P/E, growth, and fundamentals</p>
        <Link
          href="/screener"
          className="inline-block rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          Open Stock Screener →
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-zinc-600">
        Valuations change daily. These rankings represent our editorial view at the time of publication.
      </p>
    </main>
  )
}
