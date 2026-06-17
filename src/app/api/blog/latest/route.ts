import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') ?? undefined
  const limit    = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10), 60)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  let query = supabase
    .from('blog_posts')
    .select('slug, title, excerpt, image_url, image_alt, published_at, category')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=3600' },
  })
}
