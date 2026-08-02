import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { TOP_STOCKS, ALL_SYMBOLS } from '@/lib/stock-universe'
import { GLOSSARY_SLUGS } from '@/lib/glossary'

// The sitemap is backed by the Supabase blog_posts table, which changes daily.
// Left static, the route is prerendered once at build and freezes - and because
// supabase-js runs on fetch (which Next caches) and deploys never clear .next,
// the query result stayed frozen at an old snapshot, so new daily posts never
// entered the sitemap and Google couldn't discover them. force-dynamic makes the
// route run per-request with no-store fetches, so the sitemap is always live.
export const dynamic = 'force-dynamic'

const BASE = 'https://stockmarketroi.com'

const STATIC_ROUTES = [
  { url: '/',                            priority: 1.0,  changeFrequency: 'daily'   },
  { url: '/stocks',                      priority: 0.9,  changeFrequency: 'daily'   },
  { url: '/crypto',                      priority: 0.9,  changeFrequency: 'daily'   },
  { url: '/blog',                        priority: 0.8,  changeFrequency: 'weekly'  },
  { url: '/screener',                    priority: 0.8,  changeFrequency: 'weekly'  },
  { url: '/heatmap',                     priority: 0.7,  changeFrequency: 'daily'   },
  { url: '/rankings',                    priority: 0.7,  changeFrequency: 'daily'   },
  { url: '/dxy',                         priority: 0.75, changeFrequency: 'daily'   },
  { url: '/10-year-treasury-yield',      priority: 0.75, changeFrequency: 'daily'   },
  { url: '/30-year-treasury-yield',      priority: 0.7,  changeFrequency: 'daily'   },
  { url: '/2-year-treasury-yield',       priority: 0.7,  changeFrequency: 'daily'   },
  { url: '/gold-price',                  priority: 0.75, changeFrequency: 'daily'   },
  { url: '/oil-price',                   priority: 0.75, changeFrequency: 'daily'   },
  { url: '/compare',                     priority: 0.6,  changeFrequency: 'weekly'  },
  { url: '/calendar',                    priority: 0.6,  changeFrequency: 'daily'   },
  { url: '/glossary',                    priority: 0.7,  changeFrequency: 'monthly' },
  // Editorial ranking pages
  { url: '/stocks/best-dividend-stocks', priority: 0.85, changeFrequency: 'monthly' },
  { url: '/stocks/undervalued-stocks',   priority: 0.85, changeFrequency: 'monthly' },
  { url: '/stocks/best-growth-stocks',   priority: 0.85, changeFrequency: 'monthly' },
  // Comparison landing pages
  { url: '/compare/nvda-vs-amd',         priority: 0.8,  changeFrequency: 'monthly' },
  { url: '/compare/aapl-vs-msft',        priority: 0.8,  changeFrequency: 'monthly' },
  { url: '/compare/googl-vs-meta',       priority: 0.8,  changeFrequency: 'monthly' },
  { url: '/compare/jpm-vs-bac',          priority: 0.75, changeFrequency: 'monthly' },
  { url: '/compare/bitcoin-vs-ethereum', priority: 0.8,  changeFrequency: 'monthly' },
  { url: '/compare/bitcoin-vs-gold',     priority: 0.8,  changeFrequency: 'monthly' },
  // Calculators
  { url: '/calculators',                        priority: 0.75, changeFrequency: 'monthly' },
  { url: '/calculators/compound-interest',      priority: 0.8,  changeFrequency: 'monthly' },
  { url: '/calculators/dca',                    priority: 0.8,  changeFrequency: 'monthly' },
  { url: '/calculators/roi',                    priority: 0.8,  changeFrequency: 'monthly' },
  { url: '/calculators/first-million',          priority: 0.8,  changeFrequency: 'monthly' },
  { url: '/calculators/simple-interest',        priority: 0.75, changeFrequency: 'monthly' },
  { url: '/calculators/percentage',             priority: 0.75, changeFrequency: 'monthly' },
  { url: '/about',                              priority: 0.4,  changeFrequency: 'monthly' },
  { url: '/contact',                            priority: 0.4,  changeFrequency: 'monthly' },
  { url: '/privacy',                     priority: 0.3,  changeFrequency: 'monthly' },
  { url: '/terms',                       priority: 0.3,  changeFrequency: 'monthly' },
] as const

const TOP_CRYPTO = [
  // Top 10
  'bitcoin','ethereum','tether','binancecoin','solana','ripple',
  'usd-coin','cardano','dogecoin','tron',
  // 11-50
  'avalanche-2','chainlink','the-open-network','polkadot','polygon',
  'litecoin','shiba-inu','bitcoin-cash','stellar','near',
  'monero','ethereum-classic','uniswap','cosmos','filecoin',
  'hedera-hashgraph','aptos','arbitrum','optimism','sui',
  'pepe','floki','render-token','fetch-ai','worldcoin-wld',
  'injective-protocol','sei-network','celestia','stacks',
  'mantle','kaspa','immutable-x','blur','bonk',
  'jupiter-exchange-solana','jito-governance-token','pyth-network',
  'wormhole','ethena','ondo-finance',
  // 51-100
  'algorand','eos','decentraland','the-sandbox','axie-infinity',
  'gala','illuvium','stepn','gods-unchained','immutable-x',
  'vechain','iota','neo','qtum','icon',
  'waves','zilliqa','harmony','celo','band-protocol',
  'ocean-protocol','the-graph','livepeer','radicle','arweave',
  'helium','theta-token','ankr','api3','band-protocol',
  'compound-governance-token','aave','maker','curve-dao-token','yearn-finance',
  'convex-finance','frax-share','synthetix-network-token','uma','sushi',
  'balancer','1inch','dydx','gmx','gains-network',
  'lido-dao','rocket-pool','frax-ether','stakewise','stafi',
  // 101-150
  'bitcoin-sv','bitcoin-gold','dash','zcash','horizen',
  'decred','ravencoin','digibyte','vertcoin','namecoin',
  'fantom','cronos','kucoin-shares','gate','mexc-token',
  'okb','huobi-token','bitkub-coin','woo-network','dexe',
  'flow','chiliz','enjincoin','ultra','myneighboralice',
  'smooth-love-potion','darkquest','merit-circle','yield-guild-games','planetix',
  'chaingpt','cookie3','aioz-network','singularitynet','numeraire',
  'oasis-network','secret','nucypher','keep-network','alchemy-pay',
  'wax','hive','steem','golem','basic-attention-token',
  'civic','selfkey','bloom','power-ledger','energi',
  // 151-200
  'nervos-network','icon','ontology','nuls','aelf',
  'wanchain','ark','lisk','stratis','komodo',
  'terra-luna-classic','terra-luna-2-0','mirror-protocol','anchor-protocol','astroport',
  'osmosis','evmos','axelar','stride','quickswap',
  'pancakeswap-token','baby-doge-coin','safepal','biswap','alpaca-finance',
  'belt-finance','autofarm','bunny-token','ellipsis','acryptos',
  'manta-network','scroll','linea','base','zksync',
  'polygon-ecosystem-token','matic-network','hermez-network','loopring','starknet',
  'fuel-network','taiko','blast-bridged-eth-blast','mode','zeta-chain',
  // 201-250
  'ren','tornado-cash','railgun','aztec','dusk-network',
  'pivx','beam','firo','grin','mimblewimble-coin',
  'oasis-network','platon-network','aleph-zero','phala-network','ternoa',
  'nomic','persistence','umee','mars-protocol','nolus',
  'thorchain','terra-luna-classic','kujira','white-whale','comdex',
  'creditcoin-2','moonbeam','astar','phala-network','interlay',
  'calamari-network','karura','bifrost-native-coin','zeitgeist','mangata-x',
  'acala','subsocial','centrifuge','kilt-protocol','t3rn',
  'dogwifcoin','book-of-meme','cat-in-a-dogs-world','mog-coin','brett',
  'mother-iggy','andy-on-base','toshi','degen-base','normie',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticUrls: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ url, priority, changeFrequency }) => ({
    url: `${BASE}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  // Curated universe (real companies, organized by sector). TOP_STOCKS get the
  // highest priority; the rest are indexed only when their page has real data
  // (content-gated in generateMetadata), so listing them here just aids
  // discovery of the newly-indexable pages without creating "scaled content".
  const topSet = new Set(TOP_STOCKS)
  const stockUrls: MetadataRoute.Sitemap = ALL_SYMBOLS.map((symbol) => ({
    // Lowercase to match the canonical URL on each stock page
    // (page.tsx uses symbol.toLowerCase()). Emitting uppercase here made Google
    // treat the sitemap URL as a non-canonical "alternate" and skip indexing.
    url: `${BASE}/stocks/${symbol.toLowerCase()}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: topSet.has(symbol) ? 0.8 : 0.6,
  }))

  // Glossary term pages (evergreen definitions).
  const glossaryUrls: MetadataRoute.Sitemap = GLOSSARY_SLUGS.map((slug) => ({
    url: `${BASE}/glossary/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // Only the top coins are listed; obscure ones are noindex to stay focused.
  const cryptoUrls: MetadataRoute.Sitemap = TOP_CRYPTO.slice(0, 100).map((id) => ({
    url: `${BASE}/crypto/${id}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  // Blog posts from Supabase
  let blogUrls: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    blogUrls = (posts ?? []).map((post: { slug: string; updated_at: string }) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {
    // silently skip if Supabase unavailable
  }

  return [...staticUrls, ...stockUrls, ...cryptoUrls, ...glossaryUrls, ...blogUrls]
}
