import type { Metadata } from 'next'
import { StockDetailClient } from './StockDetailClient'
import { ALL_SYMBOLS } from '@/lib/stock-universe'
import { fetchStockData } from '@/lib/stock-server'

// ISR: revalidate every 60 seconds
export const revalidate = 60

export function generateStaticParams() {
  return ALL_SYMBOLS.map((symbol) => ({ symbol: symbol.toLowerCase() }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>
}): Promise<Metadata> {
  const { symbol } = await params
  const upper = symbol.toUpperCase()
  const year  = new Date().getFullYear()
  return {
    title:       `${upper} Stock Analysis ${year}: Is It a Buy or Overvalued? | Stock Market ROI`,
    description: `In-depth ${upper} stock analysis for ${year}. Bull case, bear case, fair value estimates, key financials, and our verdict — updated daily.`,
    alternates:  { canonical: `https://stockmarketroi.com/stocks/${symbol.toLowerCase()}` },
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
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
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StockDetailClient symbol={upper} initialData={initialData ?? undefined} />
    </>
  )
}
