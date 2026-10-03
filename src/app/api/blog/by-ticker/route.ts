import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')?.toUpperCase()
  const limit  = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '3', 10), 10)

  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // B3 (.SA) listings have no posts tagged with their local ticker. Surface the
  // Brazil-cluster posts instead (tagged with the US-listed ADRs / the EWZ ETF),
  // so Brazilian stock pages show relevant Brazil coverage.
  const BR_PROXY = ['EWZ', 'PBR', 'PBR-A', 'VALE', 'ITUB', 'BBD', 'BSBR', 'NU', 'ABEV', 'ERJ', 'XP', 'STNE', 'PAGS', 'VIV', 'GGB', 'SBS', 'CIG', 'UGP']

  let q = supabase
    .from('blog_posts')
    .select('slug, title, excerpt, content, category, image_url, image_alt, published_at, tickers, author_slug')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())

  q = ticker.endsWith('.SA')
    ? q.overlaps('tickers', BR_PROXY)
    : q.contains('tickers', [ticker])

  const { data, error } = await q
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=3600' },
  })
}
