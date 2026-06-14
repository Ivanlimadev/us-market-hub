import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { ALL_SYMBOLS, STOCK_NAMES } from '@/lib/stock-universe'

export const maxDuration = 60

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Stock-specific topic templates — robot picks a stock and writes about it with real data
const STOCK_TEMPLATES = [
  { t: '{name} Stock Analysis {year}: Buy, Hold, or Sell?', cat: 'Stocks' },
  { t: 'Is {name} ({symbol}) Overvalued? A Deep Dive Into the Numbers', cat: 'Stocks' },
  { t: '{name} Fair Value {year}: Bull Case vs. Bear Case', cat: 'Stocks' },
  { t: 'Why {name} Could Be the Best {sector} Stock to Buy in {year}', cat: 'Stocks' },
  { t: 'The Bull Case for {name} in {year} — and Why Bears Are Wrong', cat: 'Stocks' },
  { t: 'The Bear Case for {name}: Red Flags Every Investor Should Know', cat: 'Stocks' },
  { t: '{name} Earnings Preview: What the Numbers Say About {symbol}', cat: 'Stocks' },
  { t: '{name} Dividend Analysis: Is {symbol} Worth Buying for Income?', cat: 'Investing' },
  { t: '{name} vs the S&P 500: Has {symbol} Been Worth the Risk?', cat: 'Stocks' },
  { t: '{name} Growth Story: Can {symbol} Keep Delivering in {year}?', cat: 'Stocks' },
  { t: 'Should You Buy {name} Stock Right Now? An Honest Look', cat: 'Stocks' },
  { t: '{name} Price Target {year}: Where Analysts Think {symbol} Is Headed', cat: 'Stocks' },
  { t: 'What Insiders Are Saying About {name} ({symbol}) in {year}', cat: 'Stocks' },
  { t: '{name} in a Recession: How {symbol} Holds Up When Markets Fall', cat: 'Stocks' },
  { t: '{name} ({symbol}): Hidden Risks Most Investors Are Ignoring', cat: 'Stocks' },
]

// Macro/sector topics that may reference multiple stocks
const MACRO_TOPICS = [
  { title: 'How the Federal Reserve Affects Your Investments', category: 'Economics', tickers: [] },
  { title: 'How Interest Rate Changes Impact Stock Prices', category: 'Economics', tickers: [] },
  { title: 'ETF vs Mutual Fund: Which Is Better for Long-Term Investors?', category: 'Investing', tickers: [] },
  { title: 'Dollar-Cost Averaging vs Lump Sum Investing: Which Wins?', category: 'Investing', tickers: [] },
  { title: 'Roth IRA vs 401k: Where to Put Your Money First in {year}', category: 'Investing', tickers: [] },
  { title: 'AI Stocks to Watch: The Best Artificial Intelligence Investments', category: 'Technology', tickers: ['NVDA', 'MSFT', 'GOOGL', 'META', 'PLTR'] },
  { title: 'Semiconductor Stocks: Why Chips Are the New Oil', category: 'Technology', tickers: ['NVDA', 'AMD', 'INTC', 'AVGO', 'QCOM'] },
  { title: 'Best Dividend Stocks for Passive Income in {year}', category: 'Investing', tickers: ['JNJ', 'KO', 'PG', 'VZ', 'T'] },
  { title: 'Bitcoin vs Gold: Which Is the Better Inflation Hedge?', category: 'Crypto', tickers: ['GLD'] },
  { title: 'How to Build a Portfolio With Just 3 ETFs', category: 'Investing', tickers: ['SPY', 'QQQ', 'VTI'] },
  { title: 'What Is Inflation and How Does It Affect Stocks?', category: 'Economics', tickers: [] },
  { title: 'US Dollar Strength and What It Means for Your Portfolio', category: 'Economics', tickers: [] },
  { title: 'How to Retire Early: The FIRE Strategy Explained', category: 'Finance', tickers: [] },
  { title: 'Stock Market Volatility: How to Stay Calm and Profit', category: 'Markets', tickers: [] },
  { title: 'Tax-Loss Harvesting: How to Turn Losing Stocks Into Tax Savings', category: 'Finance', tickers: [] },
  { title: 'Cloud Computing Stocks: AWS vs Azure vs Google Cloud', category: 'Technology', tickers: ['AMZN', 'MSFT', 'GOOGL'] },
  { title: 'Cybersecurity Stocks: Why This Sector Keeps Growing', category: 'Technology', tickers: ['CRWD', 'PANW', 'FTNT', 'ZS'] },
  { title: 'How to Pick Stocks: A Framework for Individual Investors', category: 'Stocks', tickers: [] },
  { title: 'Bull Market vs Bear Market: How to Invest in Both', category: 'Markets', tickers: [] },
  { title: 'Options Trading for Beginners: Covered Calls Explained', category: 'Finance', tickers: [] },
]

// Top stocks to prioritize for stock-specific posts (by relevance/search volume)
const PRIORITY_STOCKS = [
  'AAPL','MSFT','NVDA','AMZN','GOOGL','META','TSLA','JPM','V','MA',
  'AMD','PLTR','COIN','HOOD','UBER','ABNB','CRWD','SNOW','NET','DDOG',
  'LLY','UNH','JNJ','PFE','MRNA','ABBV','MRK',
  'XOM','CVX','COP','MPC','VLO',
  'JPM','BAC','GS','MS','SCHW','COF','SPGI',
  'GE','CAT','HON','BA','LMT','RTX',
  'NEE','DUK','SO',
  'SPY','QQQ','ARKK','SOXX',
]

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\{year\}/g, String(new Date().getFullYear()))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function fillTemplate(t: string, symbol: string, name: string, sector: string, year: number): string {
  return t
    .replace(/\{symbol\}/g, symbol)
    .replace(/\{name\}/g, name)
    .replace(/\{sector\}/g, sector)
    .replace(/\{year\}/g, String(year))
}

async function run(req: NextRequest, requireAuth: boolean): Promise<NextResponse> {
  if (requireAuth) {
    const cronSecret = process.env.CRON_SECRET
    const auth   = req.headers.get('authorization') ?? ''
    const header = req.headers.get('x-cron-secret') ?? ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : auth
    if (!cronSecret || (header !== cronSecret && bearer !== cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const supabase = anonClient()
  const year = new Date().getFullYear()
  const base = req.nextUrl.origin

  // Check recently published titles (last 45 days)
  const { data: recent } = await supabase
    .from('blog_posts')
    .select('title, tickers')
    .gte('created_at', new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString())

  const usedTitles = new Set((recent ?? []).map((r: { title: string }) => r.title))
  const recentTickers = new Set(
    (recent ?? []).flatMap((r: { tickers?: string[] }) => r.tickers ?? [])
  )

  // ?type=stock forces a stock post, ?type=macro forces macro, otherwise 65/35 random
  const typeParam = req.nextUrl.searchParams.get('type')
  const doStockPost = typeParam === 'stock' ? true : typeParam === 'macro' ? false : Math.random() < 0.65

  let title = ''
  let category = ''
  let tickers: string[] = []
  let stockData: Record<string, unknown> | null = null
  let stockInfo: Record<string, unknown> = {}
  let chosenSymbol = ''
  let chosenName = ''
  let chosenSector = ''

  if (doStockPost) {
    // Pick a stock not recently covered, prioritising popular ones
    const candidates = [
      ...PRIORITY_STOCKS.filter(s => !recentTickers.has(s)),
      ...ALL_SYMBOLS.filter(s => !recentTickers.has(s) && !PRIORITY_STOCKS.includes(s)),
    ]
    if (!candidates.length) {
      // All stocks covered recently — fall back to macro
      return NextResponse.json({ message: 'All stocks covered recently, try macro topics' })
    }
    chosenSymbol = candidates[Math.floor(Math.random() * Math.min(candidates.length, 20))]
    chosenName   = STOCK_NAMES[chosenSymbol] ?? chosenSymbol

    // Fetch real stock data
    try {
      const stockRes = await fetch(`${base}/api/stocks/${chosenSymbol}`, {
        headers: { 'x-internal': '1' },
        cache: 'no-store',
      })
      if (stockRes.ok) {
        stockData = await stockRes.json()
        stockInfo = (stockData?.info as Record<string, unknown>) ?? {}
        chosenSector = (stockInfo.sector as string) ?? 'Markets'
      }
    } catch {}

    // Pick a template not recently used for this stock
    const availableTemplates = STOCK_TEMPLATES.filter(tmpl => {
      const t = fillTemplate(tmpl.t, chosenSymbol, chosenName, chosenSector, year)
      return !usedTitles.has(t)
    })
    if (!availableTemplates.length) {
      return NextResponse.json({ message: `All templates used for ${chosenSymbol}` })
    }
    const tmpl = availableTemplates[Math.floor(Math.random() * availableTemplates.length)]
    title    = fillTemplate(tmpl.t, chosenSymbol, chosenName, chosenSector, year)
    category = tmpl.cat
    tickers  = [chosenSymbol]

  } else {
    // Macro post
    const available = MACRO_TOPICS.filter(t => !usedTitles.has(t.title.replace('{year}', String(year))))
    if (!available.length) {
      return NextResponse.json({ message: 'No new macro topics available' })
    }
    const topic = available[Math.floor(Math.random() * available.length)]
    title    = topic.title.replace('{year}', String(year))
    category = topic.category
    tickers  = topic.tickers
  }

  const postSlug = slug(title)

  // Build real data context for the prompt
  const fmt = (n: unknown, mult = 1, suffix = '%') =>
    n != null && typeof n === 'number' ? `${(n * mult).toFixed(1)}${suffix}` : 'N/A'

  const realDataBlock = stockData && chosenSymbol ? `
REAL MARKET DATA FOR ${chosenSymbol} (use these exact numbers — do not invent others):
Company: ${chosenName}
Sector: ${(stockInfo.sector as string) ?? 'N/A'} | Industry: ${(stockInfo.industry as string) ?? 'N/A'}
Current Price: $${(stockData.currentPrice as number)?.toFixed(2) ?? 'N/A'}
52-Week Range: $${(stockInfo.week52Low as number) ?? 'N/A'} – $${(stockInfo.week52High as number) ?? 'N/A'}
Market Cap: ${stockInfo.marketCap ? `$${((stockInfo.marketCap as number) / 1e9).toFixed(1)}B` : 'N/A'}
P/E Ratio: ${stockInfo.pe ?? 'N/A'} | Forward P/E: ${stockInfo.forwardPE ?? 'N/A'} | PEG: ${stockInfo.pegRatio ?? 'N/A'}
Revenue Growth (YoY): ${fmt(stockInfo.revenueGrowth)}
Earnings Growth (YoY): ${fmt(stockInfo.earningsGrowth)}
Profit Margin: ${fmt(stockInfo.profitMargin)}
ROE: ${fmt(stockInfo.roe)}
Debt/Equity: ${stockInfo.debtToEquity ?? 'N/A'}
Beta: ${stockInfo.beta ?? 'N/A'}
Dividend Yield: ${stockInfo.dividendYield != null ? fmt(stockInfo.dividendYield) : 'None'}
` : ''

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a senior financial analyst at stockmarketroi.com, a US-focused investing publication. Write a complete, SEO-optimized blog post in English.

Title: "${title}"
${realDataBlock}
CRITICAL RULES:
- If real market data is provided above, use ONLY those exact numbers. Never invent prices, P/E ratios, revenue figures, or percentages that aren't in the data block.
- If a metric shows "N/A", acknowledge it's not available rather than inventing a number.
- Take a clear, opinionated position — don't hedge everything.
- Length: 1,000–1,200 words
- Use H2 and H3 headers (Markdown)
- Open with a hook: a specific data point, counterintuitive insight, or current event angle
- Include a "Bottom Line" H2 at the end: a direct 2-3 sentence verdict
- When mentioning ${chosenSymbol || 'stocks'}, link to the page: [${chosenName || 'stock name'}](https://stockmarketroi.com/stocks/${chosenSymbol || 'SYMBOL'}). Only link each stock once.
- Write for US investors (USD, 401k/Roth IRA context where relevant)
- Avoid AI clichés ("In today's fast-paced world", "navigating the landscape", "In conclusion")
- DO NOT include the title as H1 — start directly with the intro paragraph
- Format: plain Markdown only

At the very end, separated by "---META---":
- excerpt: one sentence (max 160 chars)
- seo_title: SEO title (max 60 chars)
- seo_description: meta description (max 155 chars)
- image_query: 2-3 word Pexels search term`,
      },
    ],
  })

  const raw = (message.content[0] as { type: string; text: string }).text
  const [body, metaBlock] = raw.split('---META---')
  const content = body.trim()

  const meta: Record<string, string> = {}
  for (const line of (metaBlock ?? '').split('\n')) {
    const m = line.match(/^(\w+(?:_\w+)*):\s*(.+)/)
    if (m) meta[m[1]] = m[2].trim()
  }

  // Fetch image from Pexels
  let image_url: string | null = null
  let image_alt: string | null = null
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey && meta.image_query) {
    const imgRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(meta.image_query)}&orientation=landscape&per_page=5`,
      { headers: { Authorization: pexelsKey } },
    )
    if (imgRes.ok) {
      const data = await imgRes.json()
      const photo = data.photos?.[0]
      image_url = photo?.src?.large ?? null
      image_alt = photo?.alt ?? meta.image_query
    }
  }

  const { data, error } = await supabase.from('blog_posts').insert({
    slug: postSlug,
    title,
    excerpt:         meta.excerpt ?? content.slice(0, 155),
    content,
    category,
    image_url,
    image_alt,
    status:          'published',
    published_at:    new Date().toISOString(),
    seo_title:       meta.seo_title ?? title,
    seo_description: meta.seo_description ?? meta.excerpt ?? '',
    tickers,
  }).select('id, slug').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, slug: data.slug, title, tickers })
}

async function safe(req: NextRequest, requireAuth: boolean) {
  try {
    return await run(req, requireAuth)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export const GET  = (req: NextRequest) => safe(req, false)
export const POST = (req: NextRequest) => safe(req, true)
