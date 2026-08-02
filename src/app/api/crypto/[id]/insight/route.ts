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
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!rateLimit(getIp(req), 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const teaser = req.nextUrl.searchParams.get('teaser') === '1'

  const buildResponse = (structured: InsightData | null, cached: boolean) => {
    if (teaser) {
      return NextResponse.json({
        verdict:    structured?.verdict    ?? 'HOLD',
        confidence: structured?.confidence ?? 'Low',
        summary:    structured?.summary    ?? '',
        cached,
      })
    }
    return NextResponse.json({ cached, ...structured })
  }

  const cacheKey = `crypto:${id}`
  const supabase = serviceClient()

  const { data: cached, error: readErr } = await supabase
    .from('ai_insights')
    .select('insight, updated_at')
    .eq('symbol', cacheKey)
    .single()
  if (readErr && readErr.code !== 'PGRST116') {
    console.error('[crypto-insight] cache READ failed:', readErr.code, readErr.message)
  }

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime()
    if (age < CACHE_HOURS * 60 * 60 * 1000) {
      return buildResponse(parseInsight(cached.insight), true)
    }
  }

  const base = process.env.INTERNAL_API_URL ?? req.nextUrl.origin
  const coinRes = await fetch(`${base}/api/crypto/${id}`, { cache: 'no-store' })
  if (!coinRes.ok) {
    return NextResponse.json({ error: 'Crypto data unavailable' }, { status: 502 })
  }
  const coin = await coinRes.json()
  const md = coin.market_data ?? {}

  const fmt = (n: number | null | undefined, suffix = '%') =>
    n != null ? `${n.toFixed(2)}${suffix}` : 'N/A'

  const prompt = `You are a crypto analyst. Analyze ${coin.name} (${coin.symbol?.toUpperCase()}) using only the data below and return ONLY valid JSON - no markdown, no explanation, nothing else.

Data:
Price: $${md.current_price?.toFixed ? md.current_price.toFixed(4) : 'N/A'}
Market Cap Rank: #${md.market_cap_rank ?? 'N/A'}
Market Cap: $${md.market_cap ? (md.market_cap / 1e9).toFixed(2) + 'B' : 'N/A'}
24h Volume: $${md.total_volume ? (md.total_volume / 1e9).toFixed(2) + 'B' : 'N/A'}
24h Change: ${fmt(md.price_change_percentage_24h)}
7d Change: ${fmt(md.price_change_percentage_7d)}
30d Change: ${fmt(md.price_change_percentage_30d)}
1y Change: ${fmt(md.price_change_percentage_1y)}
ATH Change: ${fmt(md.ath_change_percentage)}
Circulating Supply: ${md.circulating_supply ? (md.circulating_supply / 1e6).toFixed(2) + 'M' : 'N/A'}
Max Supply: ${md.max_supply ? (md.max_supply / 1e6).toFixed(2) + 'M' : 'unlimited'}

Return this exact JSON structure:
{
  "verdict": "BUY" or "HOLD" or "SELL",
  "confidence": "High" or "Medium" or "Low",
  "summary": "2-3 sentences covering momentum, market position, and key risk",
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
    // Never 500: serve the last cached insight (even if stale) instead of blank.
    console.error('[crypto-insight] Anthropic call failed:', (err as Error).message)
    if (cached) {
      return buildResponse(parseInsight(cached.insight), true)
    }
    return NextResponse.json(
      { error: 'AI temporarily unavailable' },
      { status: 503 },
    )
  }

  const structured = parseInsight(insight)

  const { error: writeErr } = await supabase.from('ai_insights').upsert(
    { symbol: cacheKey, insight, updated_at: new Date().toISOString() },
    { onConflict: 'symbol' },
  )
  if (writeErr) {
    console.error('[crypto-insight] cache WRITE failed:', writeErr.code, writeErr.message)
  }

  return buildResponse(structured, false)
}
