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

  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, content, category, image_url, image_alt, published_at')
    .eq('status', 'published')
    .contains('tickers', [ticker])
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=3600' },
  })
}
