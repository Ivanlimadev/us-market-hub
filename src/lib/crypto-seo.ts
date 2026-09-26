import type { CryptoDetail } from '@/types/crypto'

/**
 * Server-side SEO content for crypto pages: a unique prose intro and a set of
 * FAQs, both built entirely from real market data (no AI, no fabrication).
 * Mirrors stock-seo.ts so crypto pages get crawlable long-tail content and
 * FAQPage structured data. Reuses the StockFaq shape (question + answer).
 */

export interface CryptoFaq {
  question: string
  answer: string
}

function fmtUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)} trillion`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)} billion`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)} million`
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function fmtPrice(n: number): string {
  if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 6 })}`
}

function fmtCount(n: number | null): string {
  if (n == null) return 'an uncapped number of'
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function prettyDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** True when the page has enough real data to be worth adding SEO copy/schema. */
export function hasCryptoSeoData(c: CryptoDetail): boolean {
  const md = c.market_data
  return (md?.current_price ?? 0) > 0 || (md?.market_cap ?? 0) > 0
}

/** A unique, keyword-rich opening paragraph built from the live numbers. */
export function buildCryptoIntro(c: CryptoDetail): string {
  const md = c.market_data
  const sym = c.symbol.toUpperCase()
  const parts: string[] = []

  const chg = md.price_change_percentage_24h
  parts.push(
    `${c.name} (${sym}) is trading at ${fmtPrice(md.current_price)}` +
      (Number.isFinite(chg) && chg !== 0
        ? `, ${chg >= 0 ? 'up' : 'down'} ${Math.abs(chg).toFixed(2)}% over the past 24 hours`
        : '') +
      '.',
  )

  if (md.market_cap > 0) {
    const rank = md.market_cap_rank
      ? ` the ${ordinal(md.market_cap_rank)}-largest cryptocurrency by market value`
      : ' one of the larger cryptocurrencies'
    parts.push(`With a market capitalization of ${fmtUsd(md.market_cap)}, it is${rank}.`)
  }

  if (md.circulating_supply) {
    const cap = md.max_supply
      ? ` out of a capped maximum supply of ${fmtCount(md.max_supply)}`
      : ', and it has no fixed maximum supply'
    parts.push(`Around ${fmtCount(md.circulating_supply)} ${sym} are in circulation${cap}.`)
  }

  if (md.ath > 0) {
    const below = md.ath_change_percentage
    const clause = Number.isFinite(below)
      ? `, about ${Math.abs(below).toFixed(0)}% ${below < 0 ? 'below' : 'above'} today's price`
      : ''
    parts.push(`Its all-time high is ${fmtPrice(md.ath)}${clause}.`)
  }

  parts.push(
    `This page tracks the live ${c.name} price, market data and historical returns. It is for informational purposes only and is not investment advice.`,
  )
  return parts.join(' ')
}

/** FAQs derived entirely from real data; used for on-page content + FAQPage schema. */
export function buildCryptoFaqs(c: CryptoDetail): CryptoFaq[] {
  const md = c.market_data
  const sym = c.symbol.toUpperCase()
  const faqs: CryptoFaq[] = []

  const desc = (c.description || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const shortDesc = desc ? desc.split('. ').slice(0, 2).join('. ') : ''
  faqs.push({
    question: `What is ${c.name} (${sym})?`,
    answer: shortDesc
      ? shortDesc.endsWith('.')
        ? shortDesc
        : `${shortDesc}.`
      : `${c.name} is a cryptocurrency that trades under the symbol ${sym}. You can see its live price, market cap and full history on this page.`,
  })

  faqs.push({
    question: `How much is ${c.name} worth today?`,
    answer:
      `${c.name} is currently trading at about ${fmtPrice(md.current_price)}` +
      (md.market_cap > 0
        ? `, with a market capitalization of ${fmtUsd(md.market_cap)}` +
          (md.market_cap_rank ? ` (ranked #${md.market_cap_rank} among all cryptocurrencies)` : '')
        : '') +
      `. Crypto prices change constantly, so check the live chart above for the current figure.`,
  })

  if (md.circulating_supply) {
    faqs.push({
      question: `How many ${sym} are there?`,
      answer: md.max_supply
        ? `About ${fmtCount(md.circulating_supply)} ${sym} are in circulation, out of a capped maximum of ${fmtCount(md.max_supply)}. That fixed cap means no more than ${fmtCount(md.max_supply)} ${sym} will ever exist, which makes it a scarce, deflationary-style asset.`
        : `About ${fmtCount(md.circulating_supply)} ${sym} are in circulation. Unlike Bitcoin, ${c.name} does not have a fixed maximum supply.`,
    })
  }

  if (md.ath > 0) {
    const below = md.ath_change_percentage
    const date = prettyDate(md.ath_date)
    faqs.push({
      question: `What is the all-time high of ${c.name}?`,
      answer:
        `${c.name}'s all-time high is ${fmtPrice(md.ath)}` +
        (date ? `, reached on ${date}` : '') +
        (Number.isFinite(below)
          ? `. It currently trades about ${Math.abs(below).toFixed(0)}% ${below < 0 ? 'below' : 'above'} that peak.`
          : '.'),
    })
  }

  faqs.push({
    question: `Is ${c.name} a good investment?`,
    answer: `No one can answer that for you, and this page is not investment advice. ${c.name} is a volatile asset that can rise or fall sharply and could lose value quickly. What you can do is study the facts, the price history, market cap, supply and the ROI calculator on this page, understand the risks, and decide based on your own goals and risk tolerance. Never invest more than you can afford to lose.`,
  })

  return faqs
}
