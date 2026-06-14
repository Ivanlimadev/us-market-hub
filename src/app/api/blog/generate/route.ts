import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const TOPICS = [
  // Investing fundamentals
  { title: 'Best Brokerage Accounts for Beginners in {year}', category: 'Investing' },
  { title: 'How to Invest in S&P 500 Index Funds: A Complete Guide', category: 'Investing' },
  { title: 'Dividend Investing Strategy: Build Passive Income with Stocks', category: 'Investing' },
  { title: 'ETF vs Mutual Fund: Which Is Better for Long-Term Investors?', category: 'Investing' },
  { title: 'What Is a P/E Ratio and Why Does It Matter?', category: 'Investing' },
  { title: 'How to Build a $1,000/Month Dividend Portfolio', category: 'Investing' },
  { title: 'Dollar-Cost Averaging vs Lump Sum Investing: Which Wins?', category: 'Investing' },
  { title: 'How to Build a Portfolio With Just 3 ETFs', category: 'Investing' },
  { title: 'Roth IRA vs 401k: Where to Put Your Money First in {year}', category: 'Investing' },
  { title: 'What Is an Index Fund and How Does It Work?', category: 'Investing' },
  { title: 'How to Start Investing with $500', category: 'Investing' },
  { title: 'Asset Allocation by Age: How to Rebalance Your Portfolio', category: 'Investing' },
  // Stocks & markets
  { title: 'Growth vs Value Stocks: Which Should You Buy in {year}?', category: 'Stocks' },
  { title: 'Recession-Proof Stocks: Sectors That Hold Up in Downturns', category: 'Stocks' },
  { title: 'How to Read a Stock Chart for Beginners', category: 'Stocks' },
  { title: 'NVIDIA Stock Analysis {year}: Is It Still a Buy?', category: 'Stocks' },
  { title: 'Apple vs Microsoft: Which Tech Giant Is the Better Investment?', category: 'Stocks' },
  { title: 'Best Dividend Stocks for Passive Income in {year}', category: 'Stocks' },
  { title: 'How to Pick Stocks: A Framework for Individual Investors', category: 'Stocks' },
  { title: 'Small-Cap vs Large-Cap Stocks: Risk and Reward Compared', category: 'Stocks' },
  { title: 'Defensive Stocks vs Cyclical Stocks Explained', category: 'Stocks' },
  { title: 'US Stock Market Hours, Holidays and Trading Sessions Explained', category: 'Markets' },
  { title: 'What Happens to Stocks During a Recession?', category: 'Markets' },
  { title: 'How to Read an Earnings Report: A Step-by-Step Guide', category: 'Markets' },
  { title: 'Bull Market vs Bear Market: How to Invest in Both', category: 'Markets' },
  { title: 'Stock Market Volatility: How to Stay Calm and Profit', category: 'Markets' },
  // Economics & macro
  { title: 'How the Federal Reserve Affects Your Investments', category: 'Economics' },
  { title: 'How Interest Rate Changes Impact Stock Prices', category: 'Economics' },
  { title: 'What Is Inflation and How Does It Affect Stocks?', category: 'Economics' },
  { title: 'What Is GDP and Why Stock Investors Should Care', category: 'Economics' },
  { title: 'How to Invest During High Inflation: Stocks, Bonds and Real Assets', category: 'Economics' },
  { title: 'US Dollar Strength and What It Means for Your Portfolio', category: 'Economics' },
  // Technology & AI
  { title: 'AI Stocks to Watch: The Best Artificial Intelligence Investments', category: 'Technology' },
  { title: 'Semiconductor Stocks: Why Chips Are the New Oil', category: 'Technology' },
  { title: 'Cloud Computing Stocks: AWS vs Azure vs Google Cloud in {year}', category: 'Technology' },
  { title: 'How AI Is Changing the Stock Market — and How to Profit From It', category: 'Technology' },
  { title: 'Best Technology ETFs to Buy in {year}', category: 'Technology' },
  { title: 'Cybersecurity Stocks: Why This Sector Keeps Growing', category: 'Technology' },
  // Crypto & digital assets
  { title: 'Bitcoin vs Gold: Which Is the Better Inflation Hedge?', category: 'Crypto' },
  { title: 'Bitcoin ETF vs Buying Bitcoin Directly: Pros and Cons', category: 'Crypto' },
  { title: 'Ethereum vs Bitcoin: Key Differences for Investors', category: 'Crypto' },
  { title: 'How Much of Your Portfolio Should Be in Crypto?', category: 'Crypto' },
  { title: 'Crypto vs Stocks: Which Is the Better Long-Term Investment?', category: 'Crypto' },
  // Finance & personal wealth
  { title: 'Options Trading for Beginners: Covered Calls Explained', category: 'Finance' },
  { title: 'How to Use a Health Savings Account (HSA) as an Investment Tool', category: 'Finance' },
  { title: 'Tax-Loss Harvesting: How to Turn Losing Stocks Into Tax Savings', category: 'Finance' },
  { title: 'How to Retire Early: The FIRE Strategy Explained', category: 'Finance' },
  { title: 'Real Estate vs Stocks: Which Builds More Wealth Over Time?', category: 'Finance' },
]

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\{year\}/g, String(new Date().getFullYear()))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function run(req: NextRequest, requireAuth: boolean): Promise<NextResponse> {
  if (requireAuth) {
    const cronSecret = process.env.CRON_SECRET
    const auth = req.headers.get('authorization') ?? ''
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

  // Pick a topic not yet published this month
  const { data: recent } = await supabase
    .from('blog_posts')
    .select('title')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const usedTitles = new Set((recent ?? []).map((r: { title: string }) => r.title))
  const available = TOPICS.filter(
    (t) => !usedTitles.has(t.title.replace('{year}', String(year))),
  )
  if (!available.length) {
    return NextResponse.json({ message: 'No new topics available' })
  }

  const topic = available[Math.floor(Math.random() * available.length)]
  const title = topic.title.replace('{year}', String(year))
  const postSlug = slug(topic.title)

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a senior financial analyst and editor at stockmarketroi.com, a US-focused investing and markets publication. Your readers are serious investors — they want your opinion, not just facts they can find anywhere.

Write a complete, SEO-optimized blog post in English with the title: "${title}"

Requirements:
- Length: 1,000–1,200 words
- Use H2 and H3 headers (Markdown format)
- **Take a clear position.** Don't hedge everything. If dividend investing is good for retirees, say so. If a strategy has a serious flaw, name it. Your readers trust your judgment.
- Open with a hook that frames *why this matters now* — a recent data point, a common mistake investors make, or a counterintuitive insight.
- Include specific numbers: P/E ratios, yields, historical returns, dates, company names. Vague generalities destroy credibility.
- Compare and contrast: give readers a framework to decide for themselves (e.g., "growth investors should prefer X, income investors should prefer Y")
- Write for a US audience — USD, US tax context (401k, Roth IRA where relevant), US brokers/exchanges
- Natural, authoritative tone — avoid AI clichés ("In today's fast-paced digital world", "In conclusion", "navigating the landscape")
- End with a "Bottom Line" H2 section: a direct 2-3 sentence verdict on what the reader should take away and do next
- DO NOT include the title as an H1 — start directly with an intro paragraph
- Format: plain Markdown only
- When mentioning specific US stocks (e.g. Apple, NVIDIA, Microsoft), link to their page: [Apple (AAPL)](https://stockmarketroi.com/stocks/AAPL). Only link each stock once.
- When mentioning Bitcoin or other major crypto, link to their page: [Bitcoin](https://stockmarketroi.com/crypto/bitcoin). Only link each crypto once.

Also provide at the very end, separated by "---META---":
- excerpt: one sentence (max 160 chars) summarizing the post
- seo_title: SEO-optimized title (max 60 chars)
- seo_description: meta description (max 155 chars)
- image_query: 2-3 word Pexels search term for a relevant photo`,
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
    excerpt: meta.excerpt ?? content.slice(0, 155),
    content,
    category: topic.category,
    image_url,
    image_alt,
    status: 'published',
    published_at: new Date().toISOString(),
    seo_title: meta.seo_title ?? title,
    seo_description: meta.seo_description ?? meta.excerpt ?? '',
  }).select('id, slug').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, slug: data.slug, title })
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
