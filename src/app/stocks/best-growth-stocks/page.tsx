import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Zap, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Best Growth Stocks 2026: Top US Stocks for Long-Term Investors | Stock Market ROI',
  description:
    'Top growth stocks to buy in 2026. Our analysts rank the best high-growth US companies by revenue growth, market opportunity, and competitive positioning.',
  alternates: { canonical: 'https://stockmarketroi.com/stocks/best-growth-stocks' },
  openGraph: {
    title: 'Best Growth Stocks 2026 | Stock Market ROI',
    description: 'Top US growth stocks ranked by revenue growth, TAM, and competitive moat - our 2026 picks.',
  },
}

const STOCKS = [
  {
    rank: 1,
    symbol: 'NVDA',
    name: 'NVIDIA',
    growth: '~100% YoY',
    sector: 'Semiconductors',
    verdict: 'The defining growth stock of the AI era. NVIDIA\'s H100/H200/GB200 GPUs are the infrastructure backbone of every major AI training cluster. Data center revenue has compounded at triple-digit rates and there is no credible GPU competitor at scale in 2026.',
    moat: ['CUDA software ecosystem lock-in', 'Only at-scale AI GPU supplier', 'Supply constrained through 2026+'],
  },
  {
    rank: 2,
    symbol: 'META',
    name: 'Meta Platforms',
    growth: '~20% YoY',
    sector: 'Technology',
    verdict: 'The most underrated AI story in tech. Meta\'s ad business is accelerating because Llama-powered recommendation algorithms dramatically improved ad targeting ROI. Meanwhile, Ray-Ban smart glasses and Quest 3 are building early leads in the hardware layer of the next computing platform.',
    moat: ['3B+ daily active users across apps', 'Llama open-source builds AI ecosystem', 'Self-service ad platform scale'],
  },
  {
    rank: 3,
    symbol: 'AMZN',
    name: 'Amazon',
    growth: '~15% YoY',
    sector: 'Technology / E-Commerce',
    verdict: 'AWS is the profit engine financing Amazon\'s everything-else strategy. AWS continues growing 17%+ annually and now competes in AI inference at scale. The advertising business (now $50B+ annually) is one of the fastest-growing and highest-margin businesses in tech.',
    moat: ['AWS cloud infrastructure leadership', '$50B+ advertising business', 'Prime ecosystem flywheel'],
  },
  {
    rank: 4,
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    growth: '~30% YoY',
    sector: 'Semiconductors',
    verdict: 'The best NVIDIA alternative trade. AMD\'s MI300X GPU is winning AI inference workloads at hyperscalers who want supply chain diversification from NVIDIA. The server CPU business (EPYC) is taking market share from Intel quarter after quarter.',
    moat: ['MI300X winning inference deals', 'EPYC taking Intel datacenter share', 'x86 + GPU unified roadmap'],
  },
  {
    rank: 5,
    symbol: 'MSFT',
    name: 'Microsoft',
    growth: '~15% YoY',
    sector: 'Technology',
    verdict: 'The safest high-quality growth stock in the market. Azure cloud is growing 28%+ annually. Copilot AI is being embedded across Office 365 (1.5B users) and enterprise software at $30/user/month uplift. GitHub Copilot has 1.8M paid subscribers.',
    moat: ['Office 365 enterprise lock-in', 'Azure + OpenAI integration', 'Gaming (Xbox + Activision)'],
  },
  {
    rank: 6,
    symbol: 'TSLA',
    name: 'Tesla',
    growth: 'Recovering',
    sector: 'Automotive / AI',
    verdict: 'The most controversial stock on this list. Tesla\'s EV margins have compressed under price war pressure, but the FSD (Full Self-Driving) software business and Optimus humanoid robot could be trillion-dollar opportunities - if they deliver. The next 18 months are pivotal.',
    moat: ['Largest real-world autonomous driving dataset', 'Vertical integration (cells, motors, software)', 'Supercharger network'],
  },
  {
    rank: 7,
    symbol: 'PLTR',
    name: 'Palantir Technologies',
    growth: '~40% YoY',
    sector: 'AI / Software',
    verdict: 'The sleeper AI software winner. Palantir\'s AIP (Artificial Intelligence Platform) has gone from zero to $1B+ ARR in under two years. Commercial revenue is growing 55%+ YoY. Government contracts provide a durable base. The S&P 500 inclusion added institutional legitimacy.',
    moat: ['AIP with deep enterprise integration', 'US government data access moat', 'Bootcamp sales model creates rapid adoption'],
  },
  {
    rank: 8,
    symbol: 'SHOP',
    name: 'Shopify',
    growth: '~25% YoY',
    sector: 'E-Commerce',
    verdict: 'The operating system for commerce. After spinning off its logistics business, Shopify is leaner and more profitable. Its Merchant Solutions segment (payments, capital, shipping) is growing fast and creating a financial services layer that ties merchants into the ecosystem.',
    moat: ['Merchant ecosystem lock-in', 'Payments + capital cross-sell', 'Offline POS expansion'],
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Best Growth Stocks 2026: Top US Stocks for Long-Term Investors',
      description: 'Our analysts rank the best high-growth US companies for 2026.',
      url: 'https://stockmarketroi.com/stocks/best-growth-stocks',
      author: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
      publisher: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stockmarketroi.com' },
        { '@type': 'ListItem', position: 2, name: 'Stocks', item: 'https://stockmarketroi.com/stocks' },
        { '@type': 'ListItem', position: 3, name: 'Best Growth Stocks', item: 'https://stockmarketroi.com/stocks/best-growth-stocks' },
      ],
    },
  ],
}

export default function BestGrowthStocksPage() {
  const year = new Date().getFullYear()
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/stocks" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        ← Stocks
      </Link>

      <span className="mb-3 block text-sm font-medium text-emerald-400">Editorial Ranking</span>
      <h1 className="mb-3 text-3xl font-bold leading-tight text-zinc-100">
        Best Growth Stocks {year}
      </h1>
      <p className="mb-2 text-zinc-400 leading-relaxed">
        Companies with durable competitive advantages, large addressable markets, and
        double-digit revenue growth - ranked by our analysts for long-term investors.
      </p>
      <p className="mb-8 text-xs text-zinc-600">
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·
        For informational purposes only. Not financial advice.
      </p>

      <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-200">Our Criteria</span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Growth stocks are ranked on: revenue growth rate (minimum 15% YoY), total addressable
          market size, competitive moat durability, and management track record. We exclude
          companies without a clear path to profitability or with unsustainable burn rates.
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
                  <div className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5">
                    <Zap className="h-3 w-3 text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400">{stock.growth}</span>
                  </div>
                  <span className="text-xs text-zinc-600">{stock.sector}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">{stock.verdict}</p>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Competitive Moat</p>
                  <div className="flex flex-wrap gap-2">
                    {stock.moat.map((m) => (
                      <span key={m} className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-[11px] text-zinc-400">
                        {m}
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
        <p className="mb-3 text-zinc-300">Compare these stocks side by side</p>
        <Link
          href="/compare"
          className="inline-block rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
        >
          Compare Stocks →
        </Link>
      </div>
      <p className="mt-6 text-center text-xs text-zinc-600">
        Growth rates and metrics are trailing twelve months unless stated otherwise. Past growth does not guarantee future results.
      </p>
    </main>
  )
}
