import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
}

const TOPICS = [
  { title: 'Best Brokerage Accounts for Beginners in {year}', category: 'Investing' },
  { title: 'How to Invest in S&P 500 Index Funds: A Complete Guide', category: 'Investing' },
  { title: 'Dividend Investing Strategy: Build Passive Income with Stocks', category: 'Investing' },
  { title: 'Growth vs Value Stocks: Which Should You Buy in {year}?', category: 'Stocks' },
  { title: 'How the Federal Reserve Affects Your Investments', category: 'Economics' },
  { title: 'Recession-Proof Stocks: Sectors That Hold Up in Downturns', category: 'Stocks' },
  { title: 'ETF vs Mutual Fund: Which Is Better for Long-Term Investors?', category: 'Investing' },
  { title: 'AI Stocks to Watch: The Best Artificial Intelligence Investments', category: 'Technology' },
  { title: 'How to Read a Stock Chart for Beginners', category: 'Stocks' },
  { title: 'Bitcoin vs Gold: Which Is the Better Inflation Hedge?', category: 'Crypto' },
  { title: 'What Is a P/E Ratio and Why Does It Matter?', category: 'Investing' },
  { title: 'How to Build a $1,000/Month Dividend Portfolio', category: 'Investing' },
  { title: 'US Stock Market Hours, Holidays and Trading Sessions Explained', category: 'Markets' },
  { title: 'NVIDIA Stock Analysis {year}: Is It Still a Buy?', category: 'Stocks' },
  { title: 'How Interest Rate Changes Impact Stock Prices', category: 'Economics' },
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

  const supabase = serviceClient()
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
        content: `You are an expert American financial journalist writing for stockmarketroi.com, a US-focused investing and markets site.

Write a complete, SEO-optimized blog post in English with the title: "${title}"

Requirements:
- Length: 900–1,100 words
- Use H2 and H3 headers (Markdown format)
- Write for a US audience, use USD, reference US brokers/exchanges when relevant
- Include specific data points and examples where possible
- Natural, human tone — avoid AI clichés like "In today's fast-paced digital world" or "In conclusion"
- End with a short, natural call-to-action paragraph (no hard sell)
- DO NOT include the title as an H1 — start directly with an intro paragraph
- Format: plain Markdown only

Also provide at the very end, separated by "---META---":
- excerpt: one sentence (max 160 chars) summarizing the post
- seo_title: SEO-optimized title (max 60 chars)
- seo_description: meta description (max 155 chars)
- image_query: 2-3 word Unsplash search term for a relevant photo`,
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
    status: 'draft',
    seo_title: meta.seo_title ?? title,
    seo_description: meta.seo_description ?? meta.excerpt ?? '',
  }).select('id, slug').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, slug: data.slug, title })
}

export const GET  = (req: NextRequest) => run(req, false) // Vercel cron — no auth needed
export const POST = (req: NextRequest) => run(req, true)  // manual trigger — requires CRON_SECRET
