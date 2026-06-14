import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TrendingUp, ArrowRight } from 'lucide-react'

interface ComparisonPair {
  aSymbol: string
  aName: string
  aType: 'stock' | 'crypto'
  bSymbol: string
  bName: string
  bType: 'stock' | 'crypto'
  title: string
  description: string
  intro: string
  dimensions: { label: string; aValue: string; bValue: string; winner: 'a' | 'b' | 'tie'; note: string }[]
  verdict: string
  aFor: string
  bFor: string
}

const PAIRS: Record<string, ComparisonPair> = {
  'nvda-vs-amd': {
    aSymbol: 'NVDA', aName: 'NVIDIA', aType: 'stock',
    bSymbol: 'AMD',  bName: 'AMD',    bType: 'stock',
    title: 'NVIDIA vs AMD: Which GPU Stock Is a Better Buy in 2026?',
    description: 'NVIDIA vs AMD side-by-side: AI chip leadership, P/E valuation, revenue growth, and which semiconductor stock is the better buy for 2026.',
    intro: 'NVIDIA and AMD are the two dominant GPU companies in the AI boom — but they occupy very different positions. NVIDIA controls ~80% of the AI training GPU market with its H100/H200/GB200 lineup and the CUDA software ecosystem that creates massive switching costs. AMD is the challenger, winning AI inference workloads at hyperscalers and aggressively taking server CPU (EPYC) market share from Intel. Here\'s how they compare on every dimension that matters.',
    dimensions: [
      { label: 'AI GPU Market Share', aValue: '~80%', bValue: '~10-15%', winner: 'a', note: 'NVIDIA dominates training; AMD winning inference' },
      { label: 'Revenue Growth (YoY)', aValue: '~100%', bValue: '~30%', winner: 'a', note: 'NVIDIA\'s data center growth is historic' },
      { label: 'Valuation (Forward P/E)', aValue: '~35x', bValue: '~45x', winner: 'a', note: 'NVIDIA is cheaper relative to earnings growth' },
      { label: 'Profit Margin', aValue: '~55%', bValue: '~15%', winner: 'a', note: 'NVIDIA\'s margins are the highest in chip history' },
      { label: 'Software Moat (CUDA)', aValue: 'Dominant', bValue: 'ROCm (improving)', winner: 'a', note: 'CUDA is the biggest switching cost in tech' },
      { label: 'Diversification', aValue: 'GPU-concentrated', bValue: 'GPU + CPU + APU', winner: 'b', note: 'AMD has broader product portfolio' },
      { label: 'Dividend', aValue: '~0.03%', bValue: 'None', winner: 'tie', note: 'Neither is an income stock' },
    ],
    verdict: 'NVIDIA is the stronger buy for investors with a 1-3 year horizon. Its CUDA moat, margin profile, and data center backlog make it the most important semiconductor company of the AI era. AMD is the better bet if you believe in a multi-GPU-vendor future — it\'s the only credible alternative at scale, and enterprises want supply chain diversification.',
    aFor: 'Investors who want the AI infrastructure leader with pricing power and software lock-in',
    bFor: 'Investors who want AI exposure at a slight discount, with CPU optionality and less concentration risk',
  },

  'aapl-vs-msft': {
    aSymbol: 'AAPL', aName: 'Apple',     aType: 'stock',
    bSymbol: 'MSFT', bName: 'Microsoft', bType: 'stock',
    title: 'Apple vs Microsoft: Which Tech Giant Is a Better Investment in 2026?',
    description: 'Apple vs Microsoft: revenue growth, AI integration, valuation, and which of the two $3 trillion tech titans is a better buy for long-term investors.',
    intro: 'Apple and Microsoft have traded the title of world\'s most valuable company for years. Both are exceptional businesses, but their growth drivers in 2026 are fundamentally different. Apple is betting on the device-AI integration layer (Apple Intelligence, Vision Pro) while Microsoft is executing on the enterprise cloud + AI (Copilot, Azure) stack. Here\'s where they diverge.',
    dimensions: [
      { label: 'Revenue Growth (YoY)', aValue: '~5-7%', bValue: '~15%', winner: 'b', note: 'Microsoft growing faster on Azure + Copilot' },
      { label: 'Cloud Business', aValue: 'None at scale', bValue: 'Azure (#2 cloud)', winner: 'b', note: 'Azure is growing 28%+ YoY' },
      { label: 'AI Monetization', aValue: 'Apple Intelligence (device)', bValue: 'Copilot ($30/seat)', winner: 'b', note: 'Microsoft capturing enterprise AI spend now' },
      { label: 'Profit Margin', aValue: '~26%', bValue: '~40%', winner: 'b', note: 'Microsoft\'s software margins are exceptional' },
      { label: 'Valuation (Forward P/E)', aValue: '~28x', bValue: '~30x', winner: 'tie', note: 'Apple slightly cheaper; similar multiples' },
      { label: 'Dividend Yield', aValue: '~0.5%', bValue: '~0.8%', winner: 'b', note: 'Both minimal; Microsoft growing faster' },
      { label: 'Hardware Moat', aValue: 'iPhone + Mac ecosystem', bValue: 'Surface (minor)', winner: 'a', note: 'Apple\'s device ecosystem is unmatched' },
    ],
    verdict: 'Microsoft is the better growth investment in 2026. Azure acceleration and Copilot enterprise monetization are compounding faster than Apple\'s hardware upgrade cycle. Apple remains the superior quality stock for conservative investors — its brand loyalty and services flywheel are world-class — but Microsoft is closer to a traditional tech growth story.',
    aFor: 'Conservative investors who want a hardware + services ecosystem play with predictable upgrade cycles',
    bFor: 'Growth investors who want enterprise cloud + AI exposure with faster-compounding fundamentals',
  },

  'googl-vs-meta': {
    aSymbol: 'GOOGL', aName: 'Alphabet', aType: 'stock',
    bSymbol: 'META',  bName: 'Meta',     bType: 'stock',
    title: 'Google vs Meta: Which Ad Tech Giant Is Better for Your Portfolio?',
    description: 'Alphabet vs Meta Platforms: AI strategy, advertising growth, diversification, and which digital ad giant offers better upside in 2026.',
    intro: 'Alphabet and Meta are the two pillars of digital advertising — together controlling over 50% of global digital ad spend. Both are aggressively deploying AI to improve ad targeting and ROI for advertisers. But they face different risks: Alphabet must defend Search from AI chatbot disruption, while Meta is executing on a hardware bet (AR glasses, Quest) that has absorbed $50B+ of losses so far. Here\'s how they compare.',
    dimensions: [
      { label: 'Revenue Growth (YoY)', aValue: '~12%', bValue: '~20%', winner: 'b', note: 'Meta accelerating faster post-efficiency year' },
      { label: 'AI Search Risk', aValue: 'High (own risk)', bValue: 'Low', winner: 'b', note: 'Alphabet must disrupt its own $200B Search' },
      { label: 'Cloud Business', aValue: 'Google Cloud (~$40B, growing fast)', bValue: 'None', winner: 'a', note: 'Google Cloud #3 but growing 28%+' },
      { label: 'Valuation (Forward P/E)', aValue: '~18x', bValue: '~22x', winner: 'a', note: 'Alphabet is notably cheaper than Meta' },
      { label: 'Profit Margin', aValue: '~27%', bValue: '~38%', winner: 'b', note: 'Meta\'s margins are industry-leading' },
      { label: 'Hardware Bet', aValue: 'Waymo (autonomous vehicles)', bValue: 'Quest + Ray-Ban (AR/VR)', winner: 'tie', note: 'Both have multi-billion moonshots' },
      { label: 'Daily Active Users', aValue: '~2.5B (Search/YouTube)', bValue: '~3B+ (across apps)', winner: 'b', note: 'Meta has more daily touchpoints' },
    ],
    verdict: 'Meta offers better near-term earnings momentum; Alphabet offers better valuation and diversification. Meta\'s AI-driven ad efficiency gains are flowing directly to margins. But Alphabet at ~18x forward P/E is one of the cheapest large-cap tech stocks in the market — Google Cloud and YouTube alone justify the current price. Both are buys; Alphabet offers more margin of safety.',
    aFor: 'Value-conscious investors who want AI + Cloud diversification at a modest P/E multiple',
    bFor: 'Growth investors who want the highest-margin, fastest-growing digital ad platform',
  },

  'jpm-vs-bac': {
    aSymbol: 'JPM', aName: 'JPMorgan Chase',    aType: 'stock',
    bSymbol: 'BAC', bName: 'Bank of America', bType: 'stock',
    title: 'JPMorgan vs Bank of America: Which Bank Stock Should You Buy?',
    description: 'JPMorgan Chase vs Bank of America: balance sheet strength, earnings power, dividend yield, and which major US bank is the better investment in 2026.',
    intro: 'JPMorgan and Bank of America are the two largest US banks by assets and among the most widely held financial stocks. Both have recovered strongly from the 2023 regional banking panic, but their risk profiles differ significantly. JPM is the gold standard of US banking; BAC is more rate-sensitive and traditionally trades at a discount — which can work either for or against investors depending on the rate environment.',
    dimensions: [
      { label: 'Net Income (annual)', aValue: '$50B+', bValue: '$25B+', winner: 'a', note: 'JPM earns roughly twice BAC' },
      { label: 'Forward P/E', aValue: '~12x', bValue: '~11x', winner: 'b', note: 'BAC slightly cheaper on earnings' },
      { label: 'Dividend Yield', aValue: '~2.3%', bValue: '~2.4%', winner: 'tie', note: 'Similar yields; both growing' },
      { label: 'Rate Sensitivity', aValue: 'Moderate', bValue: 'High (NII-sensitive)', winner: 'a', note: 'BAC more volatile with rate moves' },
      { label: 'Investment Banking', aValue: 'Dominant (#1)', bValue: 'Top 5', winner: 'a', note: 'JPM IB is the strongest franchise globally' },
      { label: 'Wealth Management', aValue: 'JPM Private Bank', bValue: 'Merrill Lynch', winner: 'tie', note: 'Both have world-class wealth platforms' },
      { label: 'Balance Sheet Quality', aValue: 'Best-in-class (CET1 13%+)', bValue: 'Strong (CET1 11.9%)', winner: 'a', note: 'JPM carries more capital conservatively' },
    ],
    verdict: 'JPMorgan is the better bank for most investors — it is consistently the best-managed, highest-earning US bank. Bank of America is an attractive buy for investors who believe rate cuts are done and rates stabilize at higher levels; its rate sensitivity becomes a feature, not a bug. If you want the "sleep at night" bank stock, own JPM. If you want higher beta to a strong economy, BAC offers better upside.',
    aFor: 'Conservative investors who want the most resilient US bank with the strongest management team',
    bFor: 'Value investors who want rate sensitivity exposure and a slightly lower entry multiple',
  },

  'bitcoin-vs-ethereum': {
    aSymbol: 'bitcoin',  aName: 'Bitcoin',   aType: 'crypto',
    bSymbol: 'ethereum', bName: 'Ethereum',  bType: 'crypto',
    title: 'Bitcoin vs Ethereum: Which Crypto Is the Better Investment in 2026?',
    description: 'Bitcoin vs Ethereum: store of value vs programmable money, institutional adoption, ETF flows, and which crypto belongs in a diversified portfolio in 2026.',
    intro: 'Bitcoin and Ethereum are the two largest cryptocurrencies by market cap and the only two with spot ETFs approved in the US. But they serve fundamentally different purposes. Bitcoin is increasingly positioned as digital gold — a store of value and inflation hedge adopted by sovereign wealth funds and corporate treasuries. Ethereum is programmable money — the settlement layer for DeFi, stablecoins, and tokenized assets. Here\'s how to think about owning each.',
    dimensions: [
      { label: 'Use Case', aValue: 'Store of value / digital gold', bValue: 'Programmable money / DeFi', winner: 'tie', note: 'Different use cases, not direct competitors' },
      { label: 'Institutional Adoption', aValue: 'High (ETFs, corporate treasuries)', bValue: 'Growing (ETF launched 2024)', winner: 'a', note: 'Bitcoin ETFs have $60B+ in AUM' },
      { label: 'Annual Inflation Rate', aValue: '<1% (post-halving)', bValue: '~0% (EIP-1559 burns)', winner: 'tie', note: 'Both have deflationary mechanics' },
      { label: 'Network Revenue', aValue: 'Low (settlement layer only)', bValue: 'High (fee income for stakers)', winner: 'b', note: 'ETH generates real yield for stakers' },
      { label: 'Regulatory Clarity', aValue: 'Clearer (classified as commodity)', bValue: 'Improving (ETF approved)', winner: 'a', note: 'Bitcoin has stronger regulatory consensus' },
      { label: 'Ecosystem Activity', aValue: 'Limited (Ordinals emerging)', bValue: 'Very active (DeFi, NFTs, L2s)', winner: 'b', note: 'Ethereum has the largest developer ecosystem' },
      { label: 'Volatility', aValue: 'High (but less than ETH)', bValue: 'Higher', winner: 'a', note: 'Bitcoin is typically less volatile than ETH' },
    ],
    verdict: 'Bitcoin is the better first crypto holding — simpler, cleaner institutional narrative, and less regulatory uncertainty. Ethereum is the better second holding for investors who want exposure to the growth of on-chain finance (DeFi, stablecoins, tokenization). A 70/30 or 60/40 BTC/ETH split is a reasonable starting point for crypto allocations.',
    aFor: 'Investors who want digital gold exposure and the cleanest institutional-grade crypto asset',
    bFor: 'Investors who believe on-chain finance (DeFi, stablecoins) will grow and want programmable money exposure',
  },

  'bitcoin-vs-gold': {
    aSymbol: 'bitcoin', aName: 'Bitcoin', aType: 'crypto',
    bSymbol: 'GLD',     bName: 'Gold',    bType: 'stock',
    title: 'Bitcoin vs Gold: Which Is the Better Inflation Hedge in 2026?',
    description: 'Bitcoin vs Gold as inflation hedges: volatility, correlation to CPI, institutional adoption, and which belongs in your portfolio for 2026.',
    intro: 'Bitcoin vs gold is the inflation hedge debate of our era. Gold has 5,000 years of monetary history; Bitcoin has 15 years and $1 trillion+ in market cap. The case for each has never been stronger — gold is near all-time highs driven by central bank buying and geopolitical uncertainty, while Bitcoin spot ETFs have opened the floodgates of institutional demand. Here\'s the honest comparison.',
    dimensions: [
      { label: 'Track Record', aValue: '15 years', bValue: '5,000+ years', winner: 'b', note: 'Gold\'s monetary history is unmatched' },
      { label: 'Volatility', aValue: 'Very high (50-80% annual)', bValue: 'Low (10-15% annual)', winner: 'b', note: 'Gold is far less volatile' },
      { label: 'Annual Return (10yr)', aValue: '~50% CAGR', bValue: '~8% CAGR', winner: 'a', note: 'Bitcoin returns dominate; with much higher risk' },
      { label: 'Institutional Adoption', aValue: 'Growing rapidly (ETFs, sovereigns)', bValue: 'Deep (central banks, ETFs)', winner: 'b', note: 'Gold has broader institutional base' },
      { label: 'Inflation Correlation', aValue: 'Mixed (correlates with risk assets)', bValue: 'Moderate (stronger in high inflation)', winner: 'b', note: 'Gold is more consistent inflation hedge' },
      { label: 'Portability / Divisibility', aValue: 'Perfect (digital, divisible)', bValue: 'Poor (physical is hard to divide)', winner: 'a', note: 'Bitcoin wins on transferability' },
      { label: 'Confiscation Risk', aValue: 'Lower (self-custody possible)', bValue: 'Higher (governments have confiscated)', winner: 'a', note: 'Bitcoin\'s cryptographic security is unique' },
    ],
    verdict: 'Gold is the better inflation hedge for risk-averse investors; Bitcoin is the better bet for those with long time horizons and high volatility tolerance. A 5-10% Bitcoin allocation alongside 5-10% gold gives you exposure to both the traditional and digital monetary systems. Don\'t choose — own both in proportion to your risk tolerance.',
    aFor: 'Investors with 5+ year horizon who want asymmetric upside and can tolerate 50%+ drawdowns',
    bFor: 'Conservative investors who want a time-tested inflation hedge with lower volatility',
  },
}

export function generateStaticParams() {
  return Object.keys(PAIRS).map((pair) => ({ pair }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>
}): Promise<Metadata> {
  const { pair } = await params
  const data = PAIRS[pair]
  if (!data) return {}
  return {
    title: `${data.title} | Stock Market ROI`,
    description: data.description,
    alternates: { canonical: `https://stockmarketroi.com/compare/${pair}` },
    openGraph: {
      title: data.title,
      description: data.description,
    },
  }
}

export default async function ComparisonPairPage({
  params,
}: {
  params: Promise<{ pair: string }>
}) {
  const { pair } = await params
  const data = PAIRS[pair]
  if (!data) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        url: `https://stockmarketroi.com/compare/${pair}`,
        author: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
        publisher: { '@type': 'Organization', name: 'Stock Market ROI', url: 'https://stockmarketroi.com' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stockmarketroi.com' },
          { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://stockmarketroi.com/compare' },
          { '@type': 'ListItem', position: 3, name: data.title, item: `https://stockmarketroi.com/compare/${pair}` },
        ],
      },
    ],
  }

  const aHref = data.aType === 'crypto'
    ? `/crypto/${data.aSymbol}`
    : `/stocks/${data.aSymbol}`
  const bHref = data.bType === 'crypto'
    ? `/crypto/${data.bSymbol}`
    : `/stocks/${data.bSymbol}`

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/compare" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
        ← Compare
      </Link>

      <span className="mb-3 block text-sm font-medium text-emerald-400">Comparison</span>
      <h1 className="mb-3 text-3xl font-bold leading-tight text-zinc-100">{data.title}</h1>
      <p className="mb-8 text-zinc-400 leading-relaxed">{data.intro}</p>

      {/* Quick links to live pages */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href={aHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {data.aName} live data
        </Link>
        <Link
          href={bHref}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {data.bName} live data
        </Link>
        <Link
          href="/compare"
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Side-by-side comparison tool
        </Link>
      </div>

      {/* Comparison table */}
      <div className="mb-8 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] bg-zinc-900 border-b border-zinc-800">
          <div className="p-3 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Metric</div>
          <div className="p-3 text-xs font-semibold text-zinc-200 text-center min-w-[90px]">{data.aSymbol}</div>
          <div className="p-3 text-xs font-semibold text-zinc-200 text-center min-w-[90px]">{data.bSymbol}</div>
          <div className="p-3 text-xs font-semibold text-zinc-500 uppercase tracking-widest text-center min-w-[70px]">Edge</div>
        </div>
        {data.dimensions.map((dim, i) => (
          <div key={dim.label} className={`grid grid-cols-[1fr_auto_auto_auto] border-b border-zinc-800 last:border-0 ${i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/40'}`}>
            <div className="p-3">
              <p className="text-sm font-medium text-zinc-300">{dim.label}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{dim.note}</p>
            </div>
            <div className={`p-3 flex items-center justify-center min-w-[90px] ${dim.winner === 'a' ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}`}>
              <span className="text-sm text-center">{dim.aValue}</span>
            </div>
            <div className={`p-3 flex items-center justify-center min-w-[90px] ${dim.winner === 'b' ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}`}>
              <span className="text-sm text-center">{dim.bValue}</span>
            </div>
            <div className="p-3 flex items-center justify-center min-w-[70px]">
              {dim.winner === 'tie' ? (
                <span className="text-xs text-zinc-600">Tie</span>
              ) : (
                <span className="text-xs font-semibold text-emerald-400">
                  {dim.winner === 'a' ? data.aSymbol : data.bSymbol}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Verdict */}
      <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900 p-5">
        <h2 className="mb-3 text-base font-bold text-zinc-100">Our Verdict</h2>
        <p className="text-sm leading-relaxed text-zinc-300">{data.verdict}</p>
      </div>

      {/* Who should buy each */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-200">{data.aSymbol} is better for...</span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">{data.aFor}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-200">{data.bSymbol} is better for...</span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">{data.bFor}</p>
        </div>
      </div>

      {/* Related comparisons */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-zinc-400">More Comparisons</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PAIRS)
            .filter(([k]) => k !== pair)
            .slice(0, 4)
            .map(([key, p]) => (
              <Link
                key={key}
                href={`/compare/${key}`}
                className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
              >
                {p.aSymbol} vs {p.bSymbol}
              </Link>
            ))}
        </div>
      </div>

      {/* Author box */}
      <div className="mb-6 flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <span className="text-sm font-bold text-emerald-400">SMR</span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-200">Editorial Team · Stock Market ROI</p>
          <p className="text-xs leading-relaxed text-zinc-500">
            Our editorial team consists of financial analysts with experience in US equities, macro
            research, and portfolio strategy. All comparisons are updated quarterly and fact-checked
            against public market data.
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        For informational purposes only. Not financial advice. Data is approximate and subject to change.
      </p>
    </main>
  )
}
