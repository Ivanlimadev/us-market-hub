import type { Metadata } from 'next'
import { StockDetailClient } from './StockDetailClient'
import { fetchStockData } from '@/lib/stock-server'
import { isTopStock, isEtf, isInUniverse } from '@/lib/stock-universe'
import { buildStockIntro, buildStockFaqs, hasSeoData } from '@/lib/stock-seo'
import { StockSeoIntro, StockFaqSection } from '@/components/stock/StockFaq'

// ISR: render on first request, cache and revalidate every 60 seconds
export const revalidate = 60
export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>
}): Promise<Metadata> {
  const { symbol } = await params
  const upper = symbol.toUpperCase()
  const year  = new Date().getFullYear()

  // Index policy (content-gated): a page is indexable when it's a curated ticker
  // AND actually has real data on it. TOP_STOCKS are always indexable; any other
  // ticker in our curated universe is indexable only if it has real data
  // (hasSeoData). Everything else stays noindex,follow — so obscure/dataless
  // tickers never become "scaled content". The fetch is deduped with the page
  // body's fetchStockData via Next's request-scoped fetch cache.
  let indexable = isTopStock(upper)
  if (!indexable && isInUniverse(upper)) {
    const data = await fetchStockData(upper)
    indexable = data ? hasSeoData(data) : false
  }

  return {
    title:       `${upper} Stock Analysis ${year}: Is It a Buy or Overvalued?`,
    description: `${upper} stock analysis for ${year}: bull case, bear case, fair value, key financials and our buy/hold/avoid verdict — updated daily.`,
    alternates:  { canonical: `https://stockmarketroi.com/stocks/${symbol.toLowerCase()}` },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title:       `${upper} Stock Analysis ${year} — Bull Case, Bear Case & Verdict`,
      description: `Fundamental analysis of ${upper}: growth, valuation, profitability, and whether it's a buy or avoid in ${year}.`,
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${upper} Stock Analysis ${year} — Bull Case, Bear Case & Verdict`,
      description: `Fundamental analysis of ${upper}: growth, valuation, profitability, and whether it's a buy or avoid in ${year}.`,
    },
  }
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const upper = symbol.toUpperCase()
  const year  = new Date().getFullYear()

  // Fetch server-side for SSR — passes as initialData to React Query on client
  const initialData = await fetchStockData(upper)

  // Unique, data-derived SEO content (intro + FAQ) — only when we have real data.
  const fund = isEtf(upper)
  const hasData = initialData ? hasSeoData(initialData) : false
  const intro = hasData ? buildStockIntro(initialData!, year, fund) : null
  const faqs = hasData ? buildStockFaqs(initialData!, year) : []

  const companyId = `https://stockmarketroi.com/stocks/${upper}#company`

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      '@id':   `https://stockmarketroi.com/stocks/${upper}`,
      url:     `https://stockmarketroi.com/stocks/${upper}`,
      name:    `${upper} Stock Analysis ${year}`,
      description: `In-depth ${upper} stock analysis for ${year} — fundamentals, valuation and verdict.`,
      isPartOf: { '@id': 'https://stockmarketroi.com' },
      ...(hasData ? { about: { '@id': companyId }, mainEntity: { '@id': companyId } } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',   item: 'https://stockmarketroi.com' },
        { '@type': 'ListItem', position: 2, name: 'Stocks', item: 'https://stockmarketroi.com/stocks' },
        { '@type': 'ListItem', position: 3, name: upper,    item: `https://stockmarketroi.com/stocks/${upper}` },
      ],
    },
  ]

  // Entity schema — tells Google this page is about a specific public company
  // (ticker), not an empty blog page. Corporation + tickerSymbol is the
  // accurate, warning-free type for an individual equity.
  if (hasData && initialData) {
    const info = initialData.info
    const ticker = initialData.exchange ? `${initialData.exchange}:${upper}` : upper
    if (fund) {
      // ETF → InvestmentFund (tickerSymbol isn't valid here, so use identifier).
      const etf: Record<string, unknown> = {
        '@type': 'InvestmentFund',
        '@id': companyId,
        name: initialData.name || upper,
        identifier: { '@type': 'PropertyValue', propertyID: 'tickerSymbol', value: ticker },
      }
      if (info?.website) {
        etf.url = info.website
        etf.sameAs = info.website
      }
      if (info?.description) etf.description = info.description
      graph.push(etf)
    } else {
      const company: Record<string, unknown> = {
        '@type': 'Corporation',
        '@id': companyId,
        name: initialData.name || upper,
        tickerSymbol: ticker,
      }
      if (info?.website) {
        company.url = info.website
        company.sameAs = info.website
      }
      if (info?.description) company.description = info.description
      if (info?.employees) company.numberOfEmployees = info.employees
      graph.push(company)
    }
  }

  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    })
  }

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StockDetailClient
        symbol={upper}
        initialData={initialData ?? undefined}
        seoIntro={intro ? <StockSeoIntro text={intro} /> : null}
        seoFaq={faqs.length ? <StockFaqSection faqs={faqs} symbol={upper} /> : null}
      />
    </>
  )
}
