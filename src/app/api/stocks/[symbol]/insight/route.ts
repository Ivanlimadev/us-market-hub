import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const CACHE_HOURS = 24

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params
  const upper = symbol.toUpperCase()
  const supabase = await createClient()

  // Check cache
  const { data: cached } = await supabase
    .from('ai_insights')
    .select('insight, updated_at')
    .eq('symbol', upper)
    .single()

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime()
    if (age < CACHE_HOURS * 60 * 60 * 1000) {
      return NextResponse.json({ insight: cached.insight, cached: true })
    }
  }

  // Fetch stock data to build the prompt
  const base = _req.nextUrl.origin
  const stockRes = await fetch(`${base}/api/stocks/${upper}`, { cache: 'no-store' })
  if (!stockRes.ok) {
    return NextResponse.json({ error: 'Stock data unavailable' }, { status: 502 })
  }
  const stock = await stockRes.json()
  const info = stock.info ?? {}

  const prompt = `You are a concise financial analyst. Write a single paragraph (3-4 sentences) about ${upper} (${stock.name ?? upper}) stock for an investor researching whether to buy.

Key data:
- Sector: ${info.sector ?? 'N/A'}, Industry: ${info.industry ?? 'N/A'}
- P/E: ${info.pe ?? 'N/A'}, Forward P/E: ${info.forwardPE ?? 'N/A'}, PEG: ${info.pegRatio ?? 'N/A'}
- Revenue Growth: ${info.revenueGrowth != null ? (info.revenueGrowth * 100).toFixed(1) + '%' : 'N/A'}
- Earnings Growth: ${info.earningsGrowth != null ? (info.earningsGrowth * 100).toFixed(1) + '%' : 'N/A'}
- Profit Margin: ${info.profitMargin != null ? (info.profitMargin * 100).toFixed(1) + '%' : 'N/A'}
- ROE: ${info.roe != null ? (info.roe * 100).toFixed(1) + '%' : 'N/A'}
- Debt/Equity: ${info.debtToEquity ?? 'N/A'}
- Beta: ${info.beta ?? 'N/A'}
- Dividend Yield: ${info.dividendYield != null ? (info.dividendYield * 100).toFixed(2) + '%' : 'none'}
- 52-week range: $${info.week52Low ?? 'N/A'} – $${info.week52High ?? 'N/A'}, current: $${stock.currentPrice ?? 'N/A'}

Write in third person, fact-based, no buy/sell recommendation. Do not use bullet points. Plain paragraph only.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  const insight = (message.content[0] as { type: string; text: string }).text.trim()

  // Upsert cache
  await supabase.from('ai_insights').upsert(
    { symbol: upper, insight, updated_at: new Date().toISOString() },
    { onConflict: 'symbol' },
  )

  return NextResponse.json({ insight, cached: false })
}
