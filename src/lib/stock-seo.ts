import type { StockDetailData } from '@/lib/hooks/useStockDetail'

/**
 * Server-side SEO content for stock pages — a unique prose intro and a set of
 * FAQs, both derived entirely from real market data (no AI, no fabrication).
 * Used to (a) render crawlable long-tail content and (b) emit FAQPage JSON-LD.
 */

export interface StockFaq {
  question: string
  answer: string
}

function fmtCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)} trillion`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)} billion`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)} million`
  return `$${n.toLocaleString()}`
}

function capTier(n: number): string {
  if (n >= 2e11) return 'mega-cap'
  if (n >= 1e10) return 'large-cap'
  if (n >= 2e9) return 'mid-cap'
  if (n >= 3e8) return 'small-cap'
  return 'micro-cap'
}

function fmtPrice(n: number): string {
  return `$${n.toFixed(2)}`
}

function prettyDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** True when the page has enough real data to be worth adding SEO copy/schema. */
export function hasSeoData(data: StockDetailData): boolean {
  return data.currentPrice > 0 || (data.info?.marketCap ?? 0) > 0
}

/** A unique, keyword-rich opening paragraph built from the live numbers. */
export function buildStockIntro(data: StockDetailData, year: number, isFund = false): string {
  const { info, currentPrice, name, symbol, changePct } = data
  const noun = isFund ? 'ETF' : 'stock'
  const parts: string[] = []

  const priceClause =
    currentPrice > 0
      ? `${name} (${symbol}) ${noun} trades at ${fmtPrice(currentPrice)}` +
        (Number.isFinite(changePct) && changePct !== 0
          ? `, ${changePct >= 0 ? 'up' : 'down'} ${Math.abs(changePct).toFixed(2)}% on the day`
          : '')
      : `${name} (${symbol})`
  parts.push(`${priceClause}.`)

  if (isFund) {
    parts.push(
      `${symbol} is an exchange-traded fund (ETF) — a single, diversified holding that trades like a stock.`,
    )
  } else if (info?.marketCap) {
    const tier = capTier(info.marketCap)
    const sector = info.sector ? ` ${info.sector.toLowerCase()}` : ''
    parts.push(
      `With a market capitalization of ${fmtCap(info.marketCap)}, ${symbol} is a ${tier}${sector} stock.`,
    )
  }

  const valueBits: string[] = []
  if (info?.pe != null && info.pe > 0) valueBits.push(`a price-to-earnings (P/E) ratio of ${info.pe.toFixed(1)}`)
  if (info?.forwardPE != null && info.forwardPE > 0) valueBits.push(`a forward P/E of ${info.forwardPE.toFixed(1)}`)
  if (info?.eps != null) valueBits.push(`earnings per share (EPS) of ${fmtPrice(info.eps)}`)
  if (valueBits.length) parts.push(`It trades at ${joinList(valueBits)}.`)

  const perfBits: string[] = []
  if (info?.revenueGrowth != null) {
    const g = info.revenueGrowth * 100
    perfBits.push(
      g >= 0
        ? `${g.toFixed(0)}% year-over-year revenue growth`
        : `a ${Math.abs(g).toFixed(0)}% year-over-year revenue decline`,
    )
  }
  if (info?.profitMargin != null) {
    perfBits.push(`a net profit margin of ${(info.profitMargin * 100).toFixed(1)}%`)
  }
  if (perfBits.length) parts.push(`Over the most recent period the company reported ${joinList(perfBits)}.`)

  parts.push(
    `Below you'll find ${symbol}'s full fundamentals, fair-value estimates, dividend history, earnings and our buy, hold or avoid verdict for ${year}.`,
  )

  return parts.join(' ')
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** FAQs answered from real data — feeds both visible <details> and FAQPage schema. */
export function buildStockFaqs(data: StockDetailData, year: number): StockFaq[] {
  const { info, currentPrice, name, symbol } = data
  const faqs: StockFaq[] = []

  // 1. Should I buy — synthesised from strengths vs. risks (with disclaimer).
  const strengths: string[] = []
  const risks: string[] = []
  if (info?.revenueGrowth != null) {
    const g = info.revenueGrowth * 100
    if (g >= 10) strengths.push(`revenue growth of ${g.toFixed(0)}%`)
    else if (g < 0) risks.push(`declining revenue (${g.toFixed(0)}%)`)
  }
  if (info?.profitMargin != null) {
    const m = info.profitMargin * 100
    if (m >= 15) strengths.push(`a strong ${m.toFixed(0)}% net margin`)
    else if (m < 0) risks.push(`negative profit margins`)
  }
  if (info?.roe != null && info.roe * 100 >= 15) strengths.push(`a ${(info.roe * 100).toFixed(0)}% return on equity`)
  if (info?.pe != null && info.pe > 40) risks.push(`a rich P/E of ${info.pe.toFixed(0)}×`)
  if (info?.debtToEquity != null && info.debtToEquity > 2) risks.push(`high leverage (debt/equity of ${info.debtToEquity.toFixed(1)})`)

  if (strengths.length || risks.length) {
    let answer = `${name} (${symbol}) shows `
    if (strengths.length) answer += `strengths such as ${joinList(strengths)}`
    if (strengths.length && risks.length) answer += `, while risks include ${joinList(risks)}`
    else if (risks.length) answer += `risks such as ${joinList(risks)}`
    answer += `. Whether ${symbol} is a good buy in ${year} depends on your time horizon and risk tolerance — review the full bull case, bear case and fair-value estimates above. This is informational analysis, not financial advice.`
    faqs.push({ question: `Is ${name} (${symbol}) a good stock to buy in ${year}?`, answer })
  }

  // 2. Price today.
  if (currentPrice > 0) {
    const d = prettyDate(data.latestEod?.date)
    faqs.push({
      question: `What is ${symbol}'s stock price today?`,
      answer:
        `${name} (${symbol}) trades at ${fmtPrice(currentPrice)}` +
        (d ? ` as of ${d}` : '') +
        (Number.isFinite(data.changePct) && data.changePct !== 0
          ? `, ${data.changePct >= 0 ? 'up' : 'down'} ${Math.abs(data.changePct).toFixed(2)}% on the session`
          : '') +
        `. Prices on this page update throughout the trading day.`,
    })
  }

  // 3. Dividend.
  if (info) {
    if ((info.dividendYield ?? 0) > 0) {
      const y = (info.dividendYield! * 100).toFixed(2)
      const rate = info.dividendRate != null ? ` of ${fmtPrice(info.dividendRate)} per share` : ''
      const ex = prettyDate(info.exDividendDate)
      faqs.push({
        question: `Does ${symbol} pay a dividend?`,
        answer:
          `Yes. ${name} pays an annual dividend${rate}, a dividend yield of ${y}%.` +
          (ex ? ` The most recent ex-dividend date was ${ex}.` : '') +
          (info.payoutRatio != null ? ` Its payout ratio is about ${(info.payoutRatio * 100).toFixed(0)}% of earnings.` : ''),
      })
    } else {
      faqs.push({
        question: `Does ${symbol} pay a dividend?`,
        answer: `No. ${name} (${symbol}) does not currently pay a dividend, so the return comes entirely from share-price appreciation.`,
      })
    }
  }

  // 4. Overvalued?
  if (info?.pe != null && info.pe > 0) {
    let verdict: string
    if (info.pe > 40) verdict = `trades at a premium valuation`
    else if (info.pe > 25) verdict = `is valued above the broad-market average`
    else if (info.pe < 15) verdict = `trades at a relatively modest valuation`
    else verdict = `trades at a roughly market-average valuation`
    const peg = info.pegRatio != null && info.pegRatio > 0 ? ` Its PEG ratio is ${info.pegRatio.toFixed(2)}${info.pegRatio < 1 ? ' (below 1, which can signal growth at a reasonable price)' : ''}.` : ''
    faqs.push({
      question: `Is ${symbol} overvalued?`,
      answer: `With a P/E ratio of ${info.pe.toFixed(1)}×, ${symbol} ${verdict} for the ${info.sector ? info.sector.toLowerCase() + ' ' : ''}sector.${peg} See the Fair Value Estimates section above for Graham Number and dividend-based price targets.`,
    })
  }

  // 5. Market cap / size.
  if (info?.marketCap) {
    faqs.push({
      question: `What is ${symbol}'s market cap?`,
      answer: `${name} (${symbol}) has a market capitalization of ${fmtCap(info.marketCap)}, classifying it as a ${capTier(info.marketCap)} stock${info.sector ? ` in the ${info.sector} sector` : ''}.`,
    })
  }

  return faqs
}
