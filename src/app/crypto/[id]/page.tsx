import type { Metadata } from 'next'
import { CryptoDetailClient } from './CryptoDetailClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const name   = id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ')
  const symbol = id.slice(0, 4).toUpperCase()
  const year   = new Date().getFullYear()
  return {
    title:       `${name} (${symbol}) Price, Chart & Analysis ${year}`,
    description: `${name} live price, market cap, chart, ROI calculator, exchange listings and in-depth analysis for ${year}.`,
    openGraph: {
      title:       `${name} (${symbol}) Crypto Analysis ${year}`,
      description: `Live ${name} price, market stats, historical ROI and exchange listings.`,
    },
  }
}

export default async function CryptoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CryptoDetailClient id={id} />
}
