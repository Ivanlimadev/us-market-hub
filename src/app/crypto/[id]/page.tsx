import type { Metadata } from 'next'
import { CryptoDetailClient } from './CryptoDetailClient'

const TOP_CRYPTO = [
  'bitcoin','ethereum','tether','binancecoin','solana','ripple',
  'usd-coin','cardano','dogecoin','tron','avalanche-2','chainlink',
  'the-open-network','polkadot','polygon','litecoin','shiba-inu',
  'bitcoin-cash','stellar','near',
]

export function generateStaticParams() {
  return TOP_CRYPTO.map((id) => ({ id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id }  = await params
  const name    = id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ')
  const symbol  = id.slice(0, 4).toUpperCase()
  const year    = new Date().getFullYear()
  return {
    title:      `${name} (${symbol}) Price, Chart & Analysis ${year}`,
    description:`${name} live price, market cap, chart, ROI calculator, exchange listings and in-depth analysis for ${year}.`,
    alternates: { canonical: `https://stockmarketroi.com/crypto/${id}` },
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
  const name   = id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ')
  const symbol = id.slice(0, 4).toUpperCase()
  const year   = new Date().getFullYear()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id':   `https://stockmarketroi.com/crypto/${id}`,
        url:     `https://stockmarketroi.com/crypto/${id}`,
        name:    `${name} (${symbol}) Price & Analysis ${year}`,
        description: `Live ${name} price, market cap, ROI calculator and in-depth analysis.`,
        isPartOf: { '@id': 'https://stockmarketroi.com' },
      },
      {
        '@type':           'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',   item: 'https://stockmarketroi.com' },
          { '@type': 'ListItem', position: 2, name: 'Crypto', item: 'https://stockmarketroi.com/crypto' },
          { '@type': 'ListItem', position: 3, name: name,     item: `https://stockmarketroi.com/crypto/${id}` },
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
      <CryptoDetailClient id={id} />
    </>
  )
}
