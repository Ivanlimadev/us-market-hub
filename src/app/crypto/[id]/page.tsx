import type { Metadata } from 'next'
import { CryptoDetailClient } from './CryptoDetailClient'
import CommentsSection from '@/components/comments/CommentsSection'
import { PageTracker } from '@/components/PageTracker'

// ISR: render on first request, cache and revalidate every 60 seconds
export const revalidate = 60
export const dynamicParams = true

// Only top coins are indexed; obscure ones are noindex to keep the crawlable
// footprint focused (mirrors the stock-page policy for search/AdSense quality).
const INDEXED_CRYPTO = new Set([
  // Top 10
  'bitcoin','ethereum','tether','binancecoin','solana','ripple','usd-coin','cardano','dogecoin','tron',
  // 11-50
  'avalanche-2','chainlink','the-open-network','polkadot','polygon','litecoin','shiba-inu','bitcoin-cash','stellar','near',
  'monero','ethereum-classic','uniswap','cosmos','filecoin','hedera-hashgraph','aptos','arbitrum','optimism','sui',
  'pepe','floki','render-token','fetch-ai','worldcoin-wld','injective-protocol','sei-network','celestia','stacks','mantle',
  'kaspa','immutable-x','blur','bonk','jupiter-exchange-solana','jito-governance-token','pyth-network','wormhole','ethena','ondo-finance',
  // 51-100
  'algorand','eos','decentraland','the-sandbox','axie-infinity',
  'gala','illuvium','stepn','gods-unchained',
  'vechain','iota','neo','qtum','icon',
  'waves','zilliqa','harmony','celo','band-protocol',
  'ocean-protocol','the-graph','livepeer','radicle','arweave',
  'helium','theta-token','ankr','api3',
  'compound-governance-token','aave','maker','curve-dao-token','yearn-finance',
  'convex-finance','frax-share','synthetix-network-token','uma','sushi',
  'balancer','1inch','dydx','gmx','gains-network',
  'lido-dao','rocket-pool','frax-ether','stakewise','stafi',
])

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
    robots: INDEXED_CRYPTO.has(id) ? undefined : { index: false, follow: true },
    openGraph: {
      title:       `${name} (${symbol}) Crypto Analysis ${year}`,
      description: `Live ${name} price, market stats, historical ROI and exchange listings.`,
    },
    twitter: {
      card:        'summary_large_image',
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
      <PageTracker path={`/crypto/${id}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CryptoDetailClient id={id} />
      <div className="mx-auto max-w-screen-xl px-4 pb-8">
        <CommentsSection entityType="crypto" entityId={id} />
      </div>
    </>
  )
}
