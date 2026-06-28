import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { ALL_SYMBOLS, STOCK_NAMES } from '@/lib/stock-universe'

export const maxDuration = 60

// Writes (insert posts) require the service role — blog_posts RLS grants the
// anon role SELECT only. This route is server-only and CRON_SECRET-protected.
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

// Company-specific Pexels queries — product/brand imagery is far more engaging than generic "stock market"
const COMPANY_IMAGE_QUERIES: Record<string, string[]> = {
  AAPL: ['Apple iPhone MacBook desk', 'Apple store interior'],
  MSFT: ['Microsoft Surface laptop office', 'Windows computer workspace'],
  NVDA: ['Nvidia GPU graphics card', 'AI chip semiconductor circuit'],
  AMZN: ['Amazon warehouse delivery logistics', 'Amazon package boxes'],
  GOOGL: ['Google headquarters campus', 'Google search technology'],
  GOOG:  ['Google headquarters campus', 'Google search technology'],
  META:  ['virtual reality headset metaverse', 'social media smartphone app'],
  TSLA:  ['Tesla electric car charging', 'Tesla Model 3 road'],
  JPM:   ['JPMorgan Chase bank building', 'Wall Street financial district'],
  V:     ['Visa card contactless payment', 'digital payment terminal'],
  MA:    ['Mastercard credit card payment', 'contactless payment checkout'],
  AMD:   ['AMD Ryzen processor chip', 'CPU computer hardware'],
  PLTR:  ['big data analytics screen', 'data visualization dashboard'],
  COIN:  ['Bitcoin cryptocurrency trading', 'crypto coin exchange chart'],
  HOOD:  ['stock trading smartphone app', 'retail investor mobile'],
  UBER:  ['Uber rideshare city car', 'ride hailing urban transport'],
  ABNB:  ['Airbnb cozy vacation rental', 'travel accommodation home'],
  CRWD:  ['cybersecurity data protection', 'network security shield server'],
  SNOW:  ['cloud computing data center', 'snowflake data warehouse server'],
  NET:   ['internet network server room', 'cloud infrastructure cables'],
  DDOG:  ['DevOps monitoring dashboard', 'software engineering code screen'],
  LLY:   ['pharmaceutical laboratory research', 'drug discovery scientist'],
  UNH:   ['hospital healthcare medical', 'health insurance doctor'],
  JNJ:   ['medicine pharmaceutical pills', 'medical research laboratory'],
  PFE:   ['Pfizer vaccine pharmaceutical lab', 'medicine drug research'],
  MRNA:  ['mRNA biotech vaccine research', 'laboratory scientist microscope'],
  ABBV:  ['pharmaceutical biotech research', 'drug laboratory medicine'],
  MRK:   ['Merck pharmaceutical medicine', 'medical drug laboratory'],
  XOM:   ['oil refinery petroleum production', 'ExxonMobil energy plant'],
  CVX:   ['Chevron oil gas refinery', 'petroleum energy production'],
  COP:   ['oil drilling energy production', 'petroleum refinery plant'],
  MPC:   ['oil refinery fuel energy', 'petroleum processing plant'],
  VLO:   ['Valero oil refinery energy', 'fuel petroleum production'],
  BAC:   ['Bank of America branch building', 'banking finance office'],
  GS:    ['Goldman Sachs trading floor', 'Wall Street investment bank'],
  MS:    ['Morgan Stanley investment bank', 'financial trading office'],
  SCHW:  ['Charles Schwab brokerage investing', 'financial advisor office'],
  COF:   ['Capital One credit card bank', 'financial services'],
  SPGI:  ['S&P Global ratings finance', 'financial analytics data'],
  GE:    ['General Electric industrial turbine', 'manufacturing aerospace engine'],
  CAT:   ['Caterpillar excavator construction site', 'heavy yellow machinery'],
  HON:   ['Honeywell industrial manufacturing', 'aerospace technology plant'],
  BA:    ['Boeing commercial airplane aircraft', 'jet aviation factory'],
  LMT:   ['Lockheed Martin F-35 fighter jet', 'military aircraft defense'],
  RTX:   ['Raytheon defense aerospace missile', 'military technology aircraft'],
  NEE:   ['wind turbine renewable energy farm', 'solar panel electricity'],
  DUK:   ['power plant electricity grid utility', 'energy infrastructure'],
  SO:    ['Southern Company power plant', 'electricity utility energy'],
  SPY:   ['stock market bull trading floor', 'S&P 500 investment growth'],
  QQQ:   ['Nasdaq technology stock growth', 'tech stocks bull market'],
  ARKK:  ['innovation technology startup', 'disruptive tech future'],
  SOXX:  ['semiconductor chip factory clean room', 'microchip circuit wafer'],
}

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

  const supabase = serviceClient()
  const year = new Date().getFullYear()
  // Use the internal URL on the VPS to avoid an SSL loopback failure when the
  // app fetches its own /api over the public HTTPS host.
  const base = process.env.INTERNAL_API_URL ?? req.nextUrl.origin

  // Enforce max 3 posts per calendar day (UTC) — prevents AdSense spam signals
  const MAX_PER_DAY = 3
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const { count: todayCount } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
  if ((todayCount ?? 0) >= MAX_PER_DAY) {
    return NextResponse.json({ message: `Daily limit reached (${MAX_PER_DAY} posts/day)` })
  }

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
    // ?symbol=AAPL forces a specific stock
    const symbolParam = req.nextUrl.searchParams.get('symbol')?.toUpperCase()

    if (symbolParam && (ALL_SYMBOLS.includes(symbolParam) || PRIORITY_STOCKS.includes(symbolParam))) {
      chosenSymbol = symbolParam
    } else {
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
    }
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

  // Fetch recent news from Tavily
  async function searchTavily(query: string): Promise<string> {
    const key = process.env.TAVILY_API_KEY
    if (!key) return ''
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: key,
          query,
          search_depth: 'basic',
          max_results: 5,
          include_answer: false,
        }),
      })
      if (!res.ok) return ''
      const data = await res.json()
      const results = (data.results ?? []) as Array<{ title: string; content: string; url: string; published_date?: string }>
      if (!results.length) return ''
      return results
        .map((r, i) => `${i + 1}. ${r.title}\n   ${r.content.slice(0, 200).replace(/\n/g, ' ')}`)
        .join('\n')
    } catch { return '' }
  }

  const searchQuery = chosenSymbol
    ? `${chosenName} ${chosenSymbol} stock news 2026`
    : title

  const newsResults = await searchTavily(searchQuery)
  const newsBlock = newsResults ? `
RECENT NEWS (use these to make the article timely and specific — cite facts from here):
${newsResults}
` : ''

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
Revenue Growth (annual): ${fmt(stockInfo.revenueGrowth)}
Earnings Growth (annual): ${fmt(stockInfo.earningsGrowth)}
Profit Margin: ${fmt(stockInfo.profitMargin)}
ROE: ${fmt(stockInfo.roe)}
Debt/Equity: ${stockInfo.debtToEquity ?? 'N/A'}
Beta: ${stockInfo.beta ?? 'N/A'}
Dividend Yield: ${stockInfo.dividendYield != null ? fmt(stockInfo.dividendYield) : 'None'}
Analyst Consensus: ${stockInfo.recommendationKey ? (stockInfo.recommendationKey as string).toUpperCase() : 'N/A'} (${stockInfo.numberOfAnalystOpinions ?? 'N/A'} analysts)
Price Target: Mean $${(stockInfo.targetMeanPrice as number)?.toFixed(2) ?? 'N/A'} · Low $${(stockInfo.targetLowPrice as number)?.toFixed(2) ?? 'N/A'} · High $${(stockInfo.targetHighPrice as number)?.toFixed(2) ?? 'N/A'}
` : ''

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 5000,
    messages: [
      {
        role: 'user',
        content: `You are a senior financial analyst at stockmarketroi.com, a US-focused investing publication. Write a complete, SEO-optimized blog post in English.

Title: "${title}"
${realDataBlock}${newsBlock}
━━━ LAYER 1 — DATA INTEGRITY ━━━
- Use ONLY the exact numbers from the real market data block. Never invent prices, ratios, or percentages.
- If a metric shows "N/A", say it's not available — never fabricate a number.
- When citing numbers from the data block, attribute naturally: "according to Yahoo Finance data", "per SEC filings", "analysts tracked by Yahoo Finance". Only attribute when data came from the block above.
- Reference specific facts from recent news to make the article timely. Weave them into narrative — never list news as bullets.

━━━ LAYER 2 — SEO STRUCTURE ━━━
- Identify the primary keyword from the title (the most searched form, e.g. "Apple stock forecast 2026" or "Is AAPL a buy right now").
- Place the primary keyword naturally in: the opening paragraph, at least one H2, and the seo_title.
- H2 subheadings must be keyword-rich, not just editorial labels. Instead of "The AI Problem", write "Apple AI Strategy 2026: Real Concern or Overreaction?".
- Use 3–4 secondary keywords in H2/H3 titles (e.g. "${chosenSymbol} valuation", "${chosenSymbol} analyst target", "${chosenName} earnings ${year}").

━━━ LAYER 3 — INTERNAL CTAs (mandatory, 2 total) ━━━
- Mid-article (after the second H2), insert one contextual CTA as a Markdown link:
  [Track ${chosenName || 'this stock'} live on Stock Market ROI →](https://stockmarketroi.com/stocks/${chosenSymbol || 'SYMBOL'})
- Near the end (just before the Bottom Line H2), insert one tool CTA:
  [Compare top stocks with our free screener →](https://stockmarketroi.com/screener)
- These are REQUIRED and are in addition to any other stock links in the body.

━━━ LAYER 4 — STRONG OPINION + EXPERIENCE (E-E-A-T) ━━━
- Take a clear, opinionated position. Don't present both sides without a verdict.
- Write with the lived-in voice of an investor who has tracked US markets since 2018. In the Bottom Line, use first person ("In my view…", "What I'd watch…") to convey real reasoning and conviction — but NEVER fabricate specific personal trades, entry prices, or returns.

━━━ STRUCTURE (mandatory blocks, in this exact order) ━━━
1. Intro hook (2-3 short paragraphs) — no H1, no title.
2. "## Key Takeaways" — 3 to 5 bullet points with the thesis, the key numbers, and the verdict.
${chosenSymbol ? `3. A Markdown data table under an H3 like "### ${chosenSymbol} at a Glance" comparing the REAL metrics from the data block (Price, P/E, Forward P/E, PEG, Profit Margin, ROE, Dividend Yield, 52-Week Range, Mean Analyst Target). Use GitHub table syntax: a header row, a |---|---| separator row, then data rows. Use ONLY the real numbers above; write "N/A" where missing.` : '3. (No data table — this is a non-stock topic.)'}
4. 4-6 in-depth H2 sections with H3 sub-points: real analysis, comparisons, and scenarios.
5. The two internal CTAs from LAYER 3.
6. "## Frequently Asked Questions" — 4 to 5 entries, each formatted as "### <long-tail question>" on its own line followed by a 2-3 sentence answer. Questions must match real search queries.
7. "## Bottom Line" — the verdict (**BUY**/**HOLD**/**AVOID**) + one specific 12-month prediction (price level or % range with reasoning) + one risk scenario that breaks the thesis. First person.
8. "## Sources" — a short bullet list of the data sources used (e.g. Yahoo Finance, SEC filings, recent financial news). Generic outlet names only.

━━━ FORMATTING ━━━
- Length: 1,800–2,200 words (be thorough — depth and specificity over filler)
- Open with a hook: a specific data point, counterintuitive insight, or current event angle
- Write for US investors (USD, ${year} context)
- Avoid AI clichés: "In today's fast-paced world", "navigating the landscape", "In conclusion", "the picture is nuanced", "it's worth noting"
- DO NOT include the title as H1 — start directly with the intro paragraph
- Format: plain Markdown only

At the very end, separated by "---META---":
- excerpt: 2-3 sentences that hook the reader — open with a specific data point or tension, state the core argument, tease the verdict. Between 220–340 chars. Example: "Lockheed Martin has surged 30% in 2026 on record defense budgets and a $160B backlog. The bull case rests on F-35 production ramp-up and NATO rearmament cycles — but there are two risks every investor must watch. Here's our verdict."
- seo_title: SEO title with primary keyword (max 60 chars)
- seo_description: meta description (max 155 chars)
- image_query: 4-6 word Pexels photo search. MUST be specific to the company/topic — include the company name, product, or industry. Examples: "Apple iPhone MacBook desk", "Tesla electric car charging", "Goldman Sachs trading floor", "pharmaceutical laboratory scientist", "oil refinery petroleum plant". NEVER use generic phrases like "stock market", "financial growth", "business meeting".`,
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

  // Safety: never publish a refusal, truncated, or malformed generation.
  if (content.length < 3000 || !/##\s+Bottom Line/i.test(content) || !meta.excerpt) {
    return NextResponse.json(
      { error: 'Generation failed quality check (too short, missing Bottom Line, or missing meta) — nothing published', length: content.length },
      { status: 422 },
    )
  }

  // Fetch image from Pexels — try company-specific queries first, then Claude's suggestion
  let image_url: string | null = null
  let image_alt: string | null = null
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    // Build query priority list: branded lookup → Claude's suggestion → sector → fallback
    const queryList: string[] = []
    if (chosenSymbol && COMPANY_IMAGE_QUERIES[chosenSymbol]) {
      queryList.push(...COMPANY_IMAGE_QUERIES[chosenSymbol])
    }
    if (meta.image_query) queryList.push(meta.image_query)
    if (chosenSector && chosenSector !== 'Markets') queryList.push(chosenSector)
    queryList.push('investing finance stock market')

    for (const q of queryList) {
      const imgRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&per_page=10`,
        { headers: { Authorization: pexelsKey } },
      )
      if (!imgRes.ok) continue
      const data = await imgRes.json()
      const photo = data.photos?.[0]
      if (photo) {
        image_url = photo.src?.large ?? null
        image_alt = photo.alt ?? q
        break
      }
    }
  }

  // All posts are attributed to Ivan Lima (real, accountable author) for
  // E-E-A-T / AdSense. The multi-author registry in lib/authors.ts is kept so
  // the byline rotation can be reintroduced later if desired.
  const authorSlug = 'ivan-lima'

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
    author_slug:     authorSlug,
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

export const GET  = (req: NextRequest) => safe(req, true)
export const POST = (req: NextRequest) => safe(req, true)
