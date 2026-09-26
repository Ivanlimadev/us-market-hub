import type { Metadata } from 'next'
import { StockDetailClient } from './StockDetailClient'
import { fetchStockData } from '@/lib/stock-server'
import { PageTracker } from '@/components/PageTracker'
import { isTopStock, isEtf, isDelisted } from '@/lib/stock-universe'
import { buildStockIntro, buildStockFaqs, hasSeoData } from '@/lib/stock-seo'
import { StockSeoIntro, StockFaqSection } from '@/components/stock/StockFaq'
import { RelatedStocksLinks } from '@/components/stock/RelatedStocksLinks'

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

  // Fetch once (deduped with the page body via Next's request-scoped fetch
  // cache) so the title and description can be built from the real company name
  // and sector, instead of one template repeated across every ticker.
  const data = await fetchStockData(upper)

  // Index policy (content-gated): TOP_STOCKS are always indexable; any other
  // ticker is indexable only when it has real data (hasSeoData). Delisted or
  // dataless tickers stay noindex,follow so they never become "scaled" thin
  // content.
  const indexable =
    !isDelisted(upper) && (isTopStock(upper) || (data ? hasSeoData(data) : false))

  const isFund = isEtf(upper)
  const name   = data?.name && data.name.toUpperCase() !== upper ? data.name : null
  const label  = name ? `${name} (${upper})` : upper
  const sector = data?.info?.sector ? `${data.info.sector} ` : ''

  // Rotate the descriptive tail deterministically by ticker so titles are not a
  // single duplicated template across the whole universe.
  const hooks = isFund
    ? ['ETF Price & Analysis', 'ETF Price & Holdings', 'ETF Overview & Holdings']
    : ['Stock Forecast & Analysis', 'Stock Price & Forecast', 'Stock Analysis & Fair Value', 'Stock Price Target & Outlook']
  let hh = 0
  for (let i = 0; i < upper.length; i++) hh = (hh * 31 + upper.charCodeAt(i)) >>> 0
  const hook = hooks[hh % hooks.length]

  const title = `${label} ${hook} (${year})`
  const description = isFund
    ? `${label} ETF analysis for ${year}: price, holdings, performance and whether it fits your portfolio. Updated daily.`
    : `${label} ${sector}stock analysis for ${year}: valuation, fundamentals, dividend, bull vs bear case and our buy, hold or avoid verdict. Updated daily.`
  const social = `${label}: fundamentals, bull and bear case, and our verdict for ${year}.`

  return {
    title,
    description,
    alternates:  { canonical: `https://stockmarketroi.com/stocks/${symbol.toLowerCase()}` },
    // Explicit robots (not `undefined`): an undefined value suppresses the root
    // layout's robots tag, which would drop max-image-preview:large and make the
    // page ineligible for Google Discover. Dataless tickers stay noindex,follow.
    robots: indexable
      ? { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 }
      : { index: false, follow: true },
    openGraph: { title, description: social },
    twitter:   { card: 'summary_large_image', title, description: social },
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

  // Fetch server-side for SSR - passes as initialData to React Query on client
  const initialData = await fetchStockData(upper)

  // Unique, data-derived SEO content (intro + FAQ) - only when we have real data.
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
      description: `In-depth ${upper} stock analysis for ${year} - fundamentals, valuation and verdict.`,
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

  // Entity schema - tells Google this page is about a specific public company
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
      <PageTracker path={`/stocks/${upper.toLowerCase()}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StockDetailClient
        symbol={upper}
        initialData={initialData ?? undefined}
        seoIntro={intro ? <StockSeoIntro text={intro} /> : null}
        seoFaq={faqs.length ? <StockFaqSection faqs={faqs} symbol={upper} /> : null}
        relatedLinks={<RelatedStocksLinks symbol={upper} />}
      />
    </>
  )
}
