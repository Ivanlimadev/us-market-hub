'use client'
import { useMemo } from 'react'
import { TrendingUp, TrendingDown, CheckCircle2, XCircle } from 'lucide-react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

interface Point { text: string }

function fmtCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

function buildPoints(data: StockDetailData) {
  const { info, currentPrice, dividends } = data
  if (!info) return null

  const bull: Point[] = []
  const bear: Point[] = []

  // Valuation
  const pe = info.pe
  const forwardPE = info.forwardPE
  if (pe !== null) {
    if (pe < 15)      bull.push({ text: `Low P/E of ${pe.toFixed(1)}× suggests the stock may be undervalued relative to earnings` })
    else if (pe > 40) bear.push({ text: `High P/E of ${pe.toFixed(1)}× implies high expectations already priced in - leaves little room for disappointment` })
    else if (pe > 25) bear.push({ text: `P/E of ${pe.toFixed(1)}× is above average - valuation requires continued strong growth to justify` })
  }
  if (forwardPE !== null && pe !== null && forwardPE < pe) {
    bull.push({ text: `Forward P/E (${forwardPE.toFixed(1)}×) is lower than trailing P/E (${pe.toFixed(1)}×) - analysts expect earnings to improve` })
  }

  // Growth
  const revGrowth = info.revenueGrowth !== null ? info.revenueGrowth * 100 : null
  const epsGrowth = info.earningsGrowth !== null ? info.earningsGrowth * 100 : null
  if (revGrowth !== null) {
    if (revGrowth >= 20)     bull.push({ text: `Revenue grew ${revGrowth.toFixed(0)}% year-over-year - exceptional top-line expansion` })
    else if (revGrowth >= 5) bull.push({ text: `Revenue growth of ${revGrowth.toFixed(0)}% YoY shows solid business momentum` })
    else if (revGrowth < 0)  bear.push({ text: `Revenue declined ${Math.abs(revGrowth).toFixed(0)}% YoY - warning sign for business momentum` })
  }
  if (epsGrowth !== null) {
    if (epsGrowth >= 20)    bull.push({ text: `Earnings grew ${epsGrowth.toFixed(0)}% YoY - bottom-line is expanding fast` })
    else if (epsGrowth < 0) bear.push({ text: `Earnings fell ${Math.abs(epsGrowth).toFixed(0)}% YoY - profitability is under pressure` })
  }

  // Profitability
  const margin = info.profitMargin !== null ? info.profitMargin * 100 : null
  const roe    = info.roe !== null ? info.roe * 100 : null
  if (margin !== null) {
    if (margin >= 20)       bull.push({ text: `Exceptional profit margin of ${margin.toFixed(1)}% - the business retains a large share of each dollar earned` })
    else if (margin >= 10)  bull.push({ text: `Healthy profit margin of ${margin.toFixed(1)}%` })
    else if (margin < 0)    bear.push({ text: `Negative profit margin of ${margin.toFixed(1)}% - company is currently unprofitable` })
    else if (margin < 5)    bear.push({ text: `Thin profit margin of ${margin.toFixed(1)}% - little buffer against cost increases` })
  }
  if (roe !== null) {
    if (roe >= 15)  bull.push({ text: `ROE of ${roe.toFixed(1)}% shows management efficiently converts equity into profit` })
    else if (roe < 0) bear.push({ text: `Negative ROE of ${roe.toFixed(1)}% - shareholder equity is being eroded` })
  }

  // Financial health
  const de = info.debtToEquity
  const cr = info.currentRatio
  if (de !== null) {
    if (de <= 0.5) bull.push({ text: `Low debt-to-equity of ${de.toFixed(2)}× - strong balance sheet with minimal leverage` })
    else if (de > 2) bear.push({ text: `High debt-to-equity of ${de.toFixed(2)}× increases financial risk, especially with elevated interest rates` })
  }
  if (cr !== null) {
    if (cr >= 2)   bull.push({ text: `Current ratio of ${cr.toFixed(1)}× - ample short-term liquidity` })
    else if (cr < 1) bear.push({ text: `Current ratio below 1 (${cr.toFixed(2)}×) - short-term liabilities exceed current assets` })
  }

  // Income
  const dy = info.dividendYield !== null ? info.dividendYield * 100 : null
  if (dy !== null && dy >= 2) {
    bull.push({ text: `Dividend yield of ${dy.toFixed(2)}% provides consistent income on top of price appreciation` })
  } else if (!dividends?.length) {
    bear.push({ text: `No dividend history - total return depends entirely on price appreciation` })
  }

  // 52-week position
  const w52h = info.week52High
  const w52l = info.week52Low
  if (w52h !== null && w52l !== null && currentPrice > 0) {
    const range = w52h - w52l
    const pos   = range > 0 ? (currentPrice - w52l) / range : 0.5
    if (pos <= 0.25)  bull.push({ text: `Price is near its 52-week low - potential entry point with asymmetric upside` })
    else if (pos >= 0.85) bear.push({ text: `Price is near its 52-week high - limited near-term upside, higher pullback risk` })
  }

  // Volatility
  const beta = info.beta
  if (beta !== null) {
    if (beta > 1.5) bear.push({ text: `High beta of ${beta.toFixed(2)} - this stock is significantly more volatile than the broader market` })
    else if (beta > 0 && beta < 0.7) bull.push({ text: `Low beta of ${beta.toFixed(2)} - less volatile than the market, suitable for conservative portfolios` })
  }

  return { bull, bear }
}

function buildVerdict(bull: Point[], bear: Point[]): { label: string; color: string; bg: string; description: string } {
  const score = bull.length - bear.length
  if (score >= 3)  return { label: 'Strong Buy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', description: 'Multiple fundamental strengths with few red flags. Long-term buyers may find this compelling.' }
  if (score >= 1)  return { label: 'Buy / Hold', color: 'text-emerald-400', bg: 'bg-emerald-500/10', description: 'More positives than negatives. Fundamentals support holding while monitoring key risks.' }
  if (score === 0) return { label: 'Hold',       color: 'text-amber-400',   bg: 'bg-amber-500/10',   description: 'Mixed signals - strengths and risks roughly balance. Wait for a clearer catalyst.' }
  if (score === -1) return { label: 'Caution',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   description: 'More risks than strengths. Consider waiting for fundamentals to improve before adding.' }
  return { label: 'Avoid',  color: 'text-red-400', bg: 'bg-red-500/10', description: 'Significant fundamental concerns outweigh positives. High risk at current levels.' }
}

function buildIntro(data: StockDetailData): string {
  const { info, name, symbol } = data
  if (!info) return ''

  const parts: string[] = []

  if (info.sector && info.industry) {
    parts.push(`${name} (${symbol}) operates in the ${info.industry} space within the ${info.sector} sector.`)
  } else {
    parts.push(`${name} (${symbol}) is a publicly traded company on the US stock market.`)
  }

  if (info.marketCap) {
    const size = info.marketCap >= 200e9 ? 'large-cap' : info.marketCap >= 10e9 ? 'mid-cap' : 'small-cap'
    parts.push(`With a market cap of ${fmtCap(info.marketCap)}, it qualifies as a ${size} company.`)
  }

  const revG   = info.revenueGrowth   !== null ? info.revenueGrowth   * 100 : null
  const margin = info.profitMargin    !== null ? info.profitMargin    * 100 : null

  if (revG !== null && margin !== null) {
    if (revG >= 10 && margin >= 10) {
      parts.push(`The company is growing revenue strongly while maintaining healthy profitability - a combination that investors typically reward with a premium valuation.`)
    } else if (revG >= 10 && margin < 0) {
      parts.push(`Revenue is expanding quickly, but the company has yet to translate that growth into consistent profits - a common risk in high-growth early-stage businesses.`)
    } else if (revG < 0 && margin < 0) {
      parts.push(`Both revenue and profitability are declining, which raises questions about the durability of the current business model.`)
    } else if (revG < 0) {
      parts.push(`Revenue has been contracting year-over-year, a headwind that investors will watch closely in upcoming earnings.`)
    } else {
      parts.push(`Growth is moderate and the business remains profitable, offering a balanced risk/reward profile compared to high-multiple peers.`)
    }
  }

  return parts.join(' ')
}

export function StockAnalysisSummary({ data }: { data: StockDetailData }) {
  const year     = new Date().getFullYear()
  const points   = useMemo(() => buildPoints(data), [data])
  const intro    = useMemo(() => buildIntro(data), [data])

  if (!points || !data.info) return null
  const { bull, bear } = points
  if (bull.length === 0 && bear.length === 0) return null

  const verdict = buildVerdict(bull, bear)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="border-b border-zinc-800 px-5 py-4">
        <h2 className="text-base font-bold text-white">
          {data.name} ({data.symbol}) Stock Analysis {year}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">Rule-based · Updated daily · Not financial advice</p>
      </div>

      {intro && (
        <div className="border-b border-zinc-800 px-5 py-4">
          <p className="text-sm leading-relaxed text-zinc-300">{intro}</p>
        </div>
      )}

      <div className="grid grid-cols-1 divide-y divide-zinc-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Bull Case</span>
            <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
              {bull.length}
            </span>
          </div>
          {bull.length === 0 ? (
            <p className="text-xs text-zinc-600">No strong bullish signals found</p>
          ) : (
            <ul className="space-y-2.5">
              {bull.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span className="text-xs leading-relaxed text-zinc-300">{p.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Bear Case</span>
            <span className="ml-auto rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-400">
              {bear.length}
            </span>
          </div>
          {bear.length === 0 ? (
            <p className="text-xs text-zinc-600">No significant bearish signals found</p>
          ) : (
            <ul className="space-y-2.5">
              {bear.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  <span className="text-xs leading-relaxed text-zinc-300">{p.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={`border-t border-zinc-800 px-5 py-4 ${verdict.bg}`}>
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Verdict</p>
            <p className={`text-lg font-extrabold ${verdict.color}`}>{verdict.label}</p>
          </div>
          <div className="h-8 w-px shrink-0 bg-zinc-700" />
          <p className="text-xs leading-relaxed text-zinc-400">{verdict.description}</p>
        </div>
      </div>
    </div>
  )
}
