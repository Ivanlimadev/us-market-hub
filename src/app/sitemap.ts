import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://stockmarketroi.com'

const STATIC_ROUTES = [
  { url: '/',                            priority: 1.0,  changeFrequency: 'daily'   },
  { url: '/stocks',                      priority: 0.9,  changeFrequency: 'daily'   },
  { url: '/crypto',                      priority: 0.9,  changeFrequency: 'daily'   },
  { url: '/blog',                        priority: 0.8,  changeFrequency: 'weekly'  },
  { url: '/screener',                    priority: 0.8,  changeFrequency: 'weekly'  },
  { url: '/heatmap',                     priority: 0.7,  changeFrequency: 'daily'   },
  { url: '/rankings',                    priority: 0.7,  changeFrequency: 'daily'   },
  { url: '/compare',                     priority: 0.6,  changeFrequency: 'weekly'  },
  { url: '/calendar',                    priority: 0.6,  changeFrequency: 'daily'   },
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
  { url: '/about',                       priority: 0.4,  changeFrequency: 'monthly' },
  { url: '/privacy',                     priority: 0.3,  changeFrequency: 'monthly' },
  { url: '/terms',                       priority: 0.3,  changeFrequency: 'monthly' },
] as const

const TOP_STOCKS = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','BRK-B','AVGO','JPM',
  'LLY','V','UNH','XOM','MA','JNJ','PG','HD','COST','ABBV',
  'NFLX','BAC','KO','CRM','CVX','MRK','AMD','PEP','TMO','ORCL',
  'ACN','ADBE','WMT','LIN','MCD','CSCO','ABT','TXN','DHR','PM',
]

const TOP_CRYPTO = [
  'bitcoin','ethereum','tether','binancecoin','solana','ripple',
  'usd-coin','cardano','dogecoin','tron','avalanche-2','chainlink',
  'the-open-network','polkadot','polygon','litecoin','shiba-inu',
  'bitcoin-cash','stellar','near',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticUrls: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ url, priority, changeFrequency }) => ({
    url: `${BASE}${url}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  const stockUrls: MetadataRoute.Sitemap = TOP_STOCKS.map((symbol) => ({
    url: `${BASE}/stocks/${symbol}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const cryptoUrls: MetadataRoute.Sitemap = TOP_CRYPTO.map((id) => ({
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

  return [...staticUrls, ...stockUrls, ...cryptoUrls, ...blogUrls]
}
