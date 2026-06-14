import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

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
  if (!raw.startsWith('{')) return null
  try {
    const parsed = JSON.parse(raw) as InsightData
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const supabase = serviceClient()

  // Check cache
  const { data: cached } = await supabase
    .from('ai_insights')
    .select('insight, updated_at')
    .eq('symbol', upper)
    .single()

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime()
    if (age < CACHE_HOURS * 60 * 60 * 1000) {
      const structured = parseInsight(cached.insight)
      return NextResponse.json({ insight: cached.insight, cached: true, ...structured })
    }
  }

  // Fetch stock data
  const base = req.nextUrl.origin
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
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const insight = (message.content[0] as { type: string; text: string }).text.trim()
  const structured = parseInsight(insight)

  await supabase.from('ai_insights').upsert(
    { symbol: upper, insight, updated_at: new Date().toISOString() },
    { onConflict: 'symbol' },
  )

  return NextResponse.json({ insight, cached: false, ...structured })
}
