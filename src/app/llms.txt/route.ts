import { createClient } from '@supabase/supabase-js'

// Serves /llms.txt (https://llmstxt.org): a concise, curated map of the site for
// large language models and AI search engines (ChatGPT, Perplexity, Gemini,
// Claude, Google AI Overviews). It points them at our best, most citable pages
// so we get surfaced and cited in AI answers. Kept dynamic so the "latest posts"
// section stays fresh (same reasoning as sitemap.ts).
export const dynamic = 'force-dynamic'

const BASE = 'https://stockmarketroi.com'

const STATIC = `# Stock Market ROI

> Free US stock market and crypto data, analysis and tools. Real, verified numbers turned into plain-English breakdowns, with honest takes that show the downside as well as the upside. Not financial advice.

Stock Market ROI (${BASE}) covers US stocks, crypto, and the macro forces that move them. Every page is built from live market data. Founded and written by Ivan Lima, a US market investor since 2018. Content is educational and not financial advice.

## Tools
- [Backtest Calculator](${BASE}/calculators/backtest): test any US stock or ETF against a real strategy (buy & hold, DCA, moving-average, and more) using historical data, and see how it compares to simply holding
- [Compound Interest Calculator](${BASE}/calculators/compound-interest): project growth with an initial amount plus monthly contributions
- [Dollar-Cost Averaging (DCA) Calculator](${BASE}/calculators/dca): model recurring investments over time
- [ROI Calculator](${BASE}/calculators/roi): return on investment between two values
- [First Million Calculator](${BASE}/calculators/first-million): how long to reach \$1,000,000
- [Stock Screener](${BASE}/screener): filter US stocks by valuation, growth and profitability
- [Rankings](${BASE}/rankings): top and worst performers
- [Heatmap](${BASE}/heatmap): the market at a glance

## Stocks and crypto
- [Stocks](${BASE}/stocks): price, valuation, fundamentals, dividends and a buy/hold/avoid verdict for hundreds of US stocks and ETFs. Examples: [Apple (AAPL)](${BASE}/stocks/aapl), [Nvidia (NVDA)](${BASE}/stocks/nvda), [Microsoft (MSFT)](${BASE}/stocks/msft)
- [Crypto](${BASE}/crypto): live prices, supply data and ROI calculators. Examples: [Bitcoin](${BASE}/crypto/bitcoin), [Ethereum](${BASE}/crypto/ethereum)
- [Compare](${BASE}/compare): head-to-head comparisons, e.g. [NVDA vs AMD](${BASE}/compare/nvda-vs-amd), [Bitcoin vs Gold](${BASE}/compare/bitcoin-vs-gold)

## Macro
- [US Dollar Index (DXY)](${BASE}/dxy)
- [10-Year Treasury Yield](${BASE}/10-year-treasury-yield)
- [30-Year Treasury Yield](${BASE}/30-year-treasury-yield)
- [2-Year Treasury Yield](${BASE}/2-year-treasury-yield)
- [Gold Price](${BASE}/gold-price)
- [Oil Price](${BASE}/oil-price)
- [Economic Calendar](${BASE}/calendar)

## Education
- [Glossary](${BASE}/glossary): plain-English definitions of investing terms (P/E ratio, dividend yield, market cap, PEG, and more)
- [Blog](${BASE}/blog): daily market analysis, company deep-dives and explainers`

const FOOTER = `\n## Full index\n- [Sitemap](${BASE}/sitemap.xml): every indexable page on the site\n`

export async function GET() {
  let recent = ''
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(40)

    if (posts?.length) {
      const lines = posts.map((p: { slug: string; title: string; excerpt: string | null }) => {
        const desc = (p.excerpt ?? '').replace(/\s+/g, ' ').trim().slice(0, 160)
        return `- [${p.title}](${BASE}/blog/${p.slug})${desc ? `: ${desc}` : ''}`
      })
      recent = `\n\n## Latest articles\n${lines.join('\n')}`
    }
  } catch {
    // If Supabase is unavailable, still serve the static map.
  }

  const body = STATIC + recent + '\n' + FOOTER
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
