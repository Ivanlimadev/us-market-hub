import type { Metadata } from 'next'
import { StockDetailClient } from './StockDetailClient'

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
    openGraph: {
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
  return <StockDetailClient symbol={symbol.toUpperCase()} />
}
