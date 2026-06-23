import type { Metadata } from 'next'
import { StockDetailClient } from './StockDetailClient'
import { fetchStockData } from '@/lib/stock-server'
import { isTopStock } from '@/lib/stock-universe'
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
  return {
    title:       `${upper} Stock Analysis ${year}: Is It a Buy or Overvalued?`,
    description: `${upper} stock analysis for ${year}: bull case, bear case, fair value, key financials and our buy/hold/avoid verdict — updated daily.`,
    alternates:  { canonical: `https://stockmarketroi.com/stocks/${symbol.toLowerCase()}` },
    // Only curated tickers are indexed; the rest are noindex,follow to keep the
    // crawlable footprint focused on high-value pages (avoids "scaled content").
    robots: isTopStock(upper) ? undefined : { index: false, follow: true },
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
  const hasData = initialData ? hasSeoData(initialData) : false
  const intro = hasData ? buildStockIntro(initialData!, year) : null
  const faqs = hasData ? buildStockFaqs(initialData!, year) : []

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      '@id':   `https://stockmarketroi.com/stocks/${upper}`,
      url:     `https://stockmarketroi.com/stocks/${upper}`,
      name:    `${upper} Stock Analysis ${year}`,
      description: `In-depth ${upper} stock analysis for ${year} — fundamentals, valuation and verdict.`,
      isPartOf: { '@id': 'https://stockmarketroi.com' },
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
