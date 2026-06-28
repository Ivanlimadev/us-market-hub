// POST /api/blog/rewrite?id=N  — rewrites an existing post with current real data + Tavily
// Preserves slug, ID and SEO links; only updates content, excerpt, seo fields and image.
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

// Writes (update post content) require the service role — blog_posts RLS grants
// the anon role SELECT only. This route is server-only and CRON_SECRET-protected.
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
  const cronSecret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization') ?? ''
  const header = req.headers.get('x-cron-secret') ?? ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  if (!cronSecret || (header !== cronSecret && bearer !== cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

  const supabase = serviceClient()
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
    model: 'claude-opus-4-8',
    max_tokens: 6000,
    messages: [{
      role: 'user',
      content: `You are a senior financial analyst at stockmarketroi.com, a US-focused investing publication. Rewrite this article with the most current, accurate and specific information available.

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
- Length: 2,000–2,500 words (be thorough — depth and specificity over filler)
- Open with a hook: a specific data point, counterintuitive insight, or current event angle
- Write for US investors (USD, ${year} context)
- Avoid AI clichés: "In today's fast-paced world", "navigating the landscape", "In conclusion", "the picture is nuanced", "it's worth noting"
- DO NOT include the title as H1 — start directly with the intro paragraph
- Format: plain Markdown only

At the very end, separated by "---META---":
- excerpt: 2-3 sentences that hook the reader — open with a specific data point or tension, state the core argument, tease the verdict. Between 220–340 chars. Example: "Lockheed Martin has surged 30% in 2026 on record defense budgets and a $160B backlog. The bull case rests on F-35 production ramp-up and NATO rearmament cycles — but there are two risks every investor must watch. Here's our verdict."
- seo_title: SEO title with primary keyword (max 60 chars)
- seo_description: meta description (max 155 chars)
- image_query: 4-6 word Pexels photo search. MUST be specific to the company/topic — include the company name, product, or industry. NEVER use generic phrases like "stock market", "financial growth", "business meeting".`,
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
