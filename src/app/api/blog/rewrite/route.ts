// POST /api/blog/rewrite?id=N  — rewrites an existing post with current real data + Tavily
// Preserves slug, ID and SEO links; only updates content, excerpt, seo fields and image.
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

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
        max_results: 6,
        include_answer: false,
      }),
    })
    if (!res.ok) return ''
    const data = await res.json()
    const results = (data.results ?? []) as Array<{ title: string; content: string; published_date?: string }>
    return results
      .map((r, i) => `${i + 1}. ${r.title}${r.published_date ? ` (${r.published_date.slice(0, 10)})` : ''}\n   ${r.content.slice(0, 250).replace(/\n/g, ' ')}`)
      .join('\n')
  } catch { return '' }
}

export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

  const supabase = anonClient()
  const base = req.nextUrl.origin

  // Fetch existing post
  const { data: post, error: fetchErr } = await supabase
    .from('blog_posts')
    .select('id, slug, title, tickers, category')
    .eq('id', id)
    .single()

  if (fetchErr || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const { title, tickers, category, slug } = post as {
    id: number; slug: string; title: string; tickers: string[]; category: string
  }

  // Fetch real stock data if post has a ticker
  let realDataBlock = ''
  let chosenSymbol = tickers?.[0] ?? ''
  let chosenName = chosenSymbol

  if (chosenSymbol) {
    try {
      const stockRes = await fetch(`${base}/api/stocks/${chosenSymbol}`, { cache: 'no-store' })
      if (stockRes.ok) {
        const stockData = await stockRes.json() as Record<string, unknown>
        const info = (stockData.info as Record<string, unknown>) ?? {}
        chosenName = (stockData.name as string) || chosenSymbol
        const fmt = (n: unknown, mult = 1, suffix = '%') =>
          n != null && typeof n === 'number' ? `${(n * mult).toFixed(1)}${suffix}` : 'N/A'

        realDataBlock = `
REAL MARKET DATA FOR ${chosenSymbol} (use these exact numbers — do not invent others):
Company: ${chosenName}
Sector: ${(info.sector as string) ?? 'N/A'} | Industry: ${(info.industry as string) ?? 'N/A'}
Current Price: $${(stockData.currentPrice as number)?.toFixed(2) ?? 'N/A'}
52-Week Range: $${(info.week52Low as number) ?? 'N/A'} – $${(info.week52High as number) ?? 'N/A'}
Market Cap: ${info.marketCap ? `$${((info.marketCap as number) / 1e9).toFixed(1)}B` : 'N/A'}
P/E Ratio: ${info.pe ?? 'N/A'} | Forward P/E: ${info.forwardPE ?? 'N/A'} | PEG: ${info.pegRatio ?? 'N/A'}
Revenue Growth (annual): ${fmt(info.revenueGrowth)}
Earnings Growth (annual): ${fmt(info.earningsGrowth)}
Profit Margin: ${fmt(info.profitMargin)}
ROE: ${fmt(info.roe)}
Debt/Equity: ${info.debtToEquity ?? 'N/A'}
Beta: ${info.beta ?? 'N/A'}
Dividend Yield: ${info.dividendYield != null ? fmt(info.dividendYield) : 'None'}
Analyst Consensus: ${info.recommendationKey ? (info.recommendationKey as string).toUpperCase() : 'N/A'} (${info.numberOfAnalystOpinions ?? 'N/A'} analysts)
Price Target: Mean $${(info.targetMeanPrice as number)?.toFixed(2) ?? 'N/A'} · Low $${(info.targetLowPrice as number)?.toFixed(2) ?? 'N/A'} · High $${(info.targetHighPrice as number)?.toFixed(2) ?? 'N/A'}
`
      }
    } catch { /* continue without stock data */ }
  }

  // Tavily web search
  const searchQuery = chosenSymbol
    ? `${chosenName} ${chosenSymbol} stock news 2026`
    : `${title} 2026`
  const newsResults = await searchTavily(searchQuery)
  const newsBlock = newsResults ? `
RECENT NEWS (use these to make the article timely and specific — cite facts naturally in context):
${newsResults}
` : ''

  // Generate new content with Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const year = new Date().getFullYear()

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a senior financial analyst at stockmarketroi.com, a US-focused investing publication. Rewrite this article with the most current, accurate and specific information available.

Title: "${title}"
${realDataBlock}${newsBlock}
CRITICAL RULES:
- Use ONLY the exact numbers provided in the real market data block. Never invent prices, ratios or percentages.
- If a metric shows "N/A", say it's not available — don't invent a number.
- Reference facts from the recent news to make the article timely. Do not list news as bullets — weave them into the narrative.
- Take a clear, opinionated position — don't hedge everything.
- Length: 1,000–1,200 words
- Use H2 and H3 headers (Markdown)
- Open with a hook: a specific data point, counterintuitive insight, or current event angle
- Include a "Bottom Line" H2 at the end: a direct 2-3 sentence verdict
- When mentioning ${chosenSymbol || 'stocks'}, link: [${chosenName || 'stock'}](https://stockmarketroi.com/stocks/${chosenSymbol || 'SYMBOL'}). Link each stock once only.
- Write for US investors (USD, ${year} context)
- Avoid AI clichés ("In today's fast-paced world", "navigating the landscape", "In conclusion")
- DO NOT include the title as H1 — start directly with the intro paragraph
- Format: plain Markdown only

At the very end, separated by "---META---":
- excerpt: one sentence (max 160 chars)
- seo_title: SEO title (max 60 chars)
- seo_description: meta description (max 155 chars)
- image_query: 2-3 word Pexels search term`,
    }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text
  const [body, metaBlock] = raw.split('---META---')
  const content = body.trim()
  const meta: Record<string, string> = {}
  for (const line of (metaBlock ?? '').split('\n')) {
    const m = line.match(/^(\w+(?:_\w+)*):\s*(.+)/)
    if (m) meta[m[1]] = m[2].trim()
  }

  // Fetch new cover image from Pexels
  let image_url: string | null = null
  let image_alt: string | null = null
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey && meta.image_query) {
    try {
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
    } catch { /* keep existing image */ }
  }

  // Update post in-place (preserve slug and ID)
  const updatePayload: Record<string, unknown> = {
    content,
    excerpt:         meta.excerpt ?? content.slice(0, 155),
    seo_title:       meta.seo_title ?? title,
    seo_description: meta.seo_description ?? meta.excerpt ?? '',
    updated_at:      new Date().toISOString(),
  }
  if (image_url) {
    updatePayload.image_url = image_url
    updatePayload.image_alt = image_alt
  }

  const { error: updateErr } = await supabase
    .from('blog_posts')
    .update(updatePayload)
    .eq('id', post.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    id: post.id,
    slug,
    title,
    had_real_data: !!chosenSymbol,
    had_news: !!newsResults,
  })
}
