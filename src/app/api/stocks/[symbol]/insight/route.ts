import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getIp } from '@/lib/rate-limit'

const CACHE_HOURS = 24

interface InsightData {
  verdict: 'BUY' | 'HOLD' | 'SELL'
  confidence: 'High' | 'Medium' | 'Low'
  summary: string
  bull: string
  bear: string
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function parseInsight(raw: string): InsightData | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  if (!cleaned.startsWith('{')) return null
  try {
    const parsed = JSON.parse(cleaned) as InsightData
    if (parsed.verdict && parsed.summary) return parsed
  } catch {}
  return null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const upper = symbol.toUpperCase()

  // `?teaser=1` returns only verdict + confidence + summary (no bull/bear and
  // no raw insight). The mobile app uses it to gate the full analysis behind a
  // rewarded ad; the website calls without it and gets the full payload.
  const teaser = req.nextUrl.searchParams.get('teaser') === '1'

  const buildResponse = (
    rawInsight: string,
    structured: InsightData | null,
    cached: boolean,
  ) => {
    if (teaser) {
      return NextResponse.json({
        verdict: structured?.verdict ?? 'HOLD',
        confidence: structured?.confidence ?? 'Low',
        summary: structured?.summary ?? '',
        cached,
      })
    }
    return NextResponse.json({ insight: rawInsight, cached, ...structured })
  }

  // 10 req/hour per IP (cached responses don't count against this)
  if (!rateLimit(getIp(req), 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const supabase = serviceClient()

  // Check cache
  const { data: cached, error: readErr } = await supabase
    .from('ai_insights')
    .select('insight, updated_at')
    .eq('symbol', upper)
    .single()
  // PGRST116 = no cached row yet (normal cache miss). Anything else (e.g. a
  // missing GRANT → 42501) means the cache is broken and must not fail silently.
  if (readErr && readErr.code !== 'PGRST116') {
    console.error('[insight] cache READ failed:', readErr.code, readErr.message)
  }

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime()
    if (age < CACHE_HOURS * 60 * 60 * 1000) {
      const structured = parseInsight(cached.insight)
      return buildResponse(cached.insight, structured, true)
    }
  }

  // Fetch stock data — use internal URL to avoid SSL loop on VPS
  const base = process.env.INTERNAL_API_URL ?? req.nextUrl.origin
  const stockRes = await fetch(`${base}/api/stocks/${upper}`, {
    headers: { 'x-internal': '1' },
    cache: 'no-store',
  })
  if (!stockRes.ok) {
    return NextResponse.json({ error: 'Stock data unavailable' }, { status: 502 })
  }
  const stock = await stockRes.json()
  const info = stock.info ?? {}

  const fmt = (n: number | null, mult = 1, suffix = '%') =>
    n != null ? `${(n * mult).toFixed(1)}${suffix}` : 'N/A'

  const prompt = `You are a financial analyst. Analyze ${upper} (${stock.name ?? upper}) using only the data below and return ONLY valid JSON — no markdown, no explanation, nothing else.

Data:
Sector: ${info.sector ?? 'N/A'} | Industry: ${info.industry ?? 'N/A'}
P/E: ${info.pe ?? 'N/A'} | Forward P/E: ${info.forwardPE ?? 'N/A'} | PEG: ${info.pegRatio ?? 'N/A'}
Revenue Growth: ${fmt(info.revenueGrowth)} | Earnings Growth: ${fmt(info.earningsGrowth)}
Profit Margin: ${fmt(info.profitMargin)} | ROE: ${fmt(info.roe)} | Debt/Equity: ${info.debtToEquity ?? 'N/A'}
Beta: ${info.beta ?? 'N/A'} | Dividend Yield: ${info.dividendYield != null ? fmt(info.dividendYield) : 'none'}
52w range: $${info.week52Low ?? 'N/A'}–$${info.week52High ?? 'N/A'} | Current: $${stock.currentPrice ?? 'N/A'}

Return this exact JSON structure:
{
  "verdict": "BUY" or "HOLD" or "SELL",
  "confidence": "High" or "Medium" or "Low",
  "summary": "2-3 sentences covering valuation, growth, and key financials",
  "bull": "1 sentence: the single strongest reason to be bullish",
  "bear": "1 sentence: the single biggest risk or concern"
}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  let insight: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    insight = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  } catch (err) {
    // Anthropic call failed (out of credits, rate limit, model change, outage).
    // Never 500 the app: serve the last cached insight if we have one — even if
    // it's older than CACHE_HOURS — so the section shows stale data instead of
    // going blank. Only fail if there's nothing cached at all.
    console.error('[insight] Anthropic call failed:', (err as Error).message)
    if (cached) {
      return buildResponse(cached.insight, parseInsight(cached.insight), true)
    }
    return NextResponse.json(
      { error: 'AI temporarily unavailable' },
      { status: 503 },
    )
  }

  const structured = parseInsight(insight)

  const { error: writeErr } = await supabase.from('ai_insights').upsert(
    { symbol: upper, insight, updated_at: new Date().toISOString() },
    { onConflict: 'symbol' },
  )
  if (writeErr) {
    console.error('[insight] cache WRITE failed:', writeErr.code, writeErr.message)
  }

  return buildResponse(insight, structured, false)
}
