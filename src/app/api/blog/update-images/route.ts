import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const KEYWORD_MAP: Record<string, string> = {
  'bitcoin': 'bitcoin crypto',
  'gold': 'gold investment',
  'federal reserve': 'federal reserve finance',
  'dividend': 'dividend stocks',
  'etf': 'stock market trading',
  'mutual fund': 'investment fund',
  'stock chart': 'stock market chart',
  'interest rate': 'interest rate economy',
  'recession': 'economy recession',
  'inflation': 'inflation money',
  'investing': 'investing money',
  'brokerage': 'stock broker',
  'nvidia': 'technology chip semiconductor',
  'ai stocks': 'artificial intelligence tech',
  's&p 500': 'stock market index',
}

function queryFromTitle(title: string): string {
  const lower = title.toLowerCase()
  for (const [key, query] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(key)) return query
  }
  return 'stock market investing'
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pexelsKey = process.env.PEXELS_API_KEY
  if (!pexelsKey) {
    return NextResponse.json({ error: 'PEXELS_API_KEY not set' }, { status: 503 })
  }

  const supabase = anonClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title')
    .is('image_url', null)

  if (!posts?.length) {
    return NextResponse.json({ message: 'No posts need images', updated: 0 })
  }

  let updated = 0
  const results: string[] = []

  for (const post of posts) {
    const query = queryFromTitle(post.title)
    try {
      const imgRes = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5`,
        { headers: { Authorization: pexelsKey } },
      )
      if (!imgRes.ok) continue

      const data = await imgRes.json()
      const photo = data.photos?.[0]
      if (!photo) continue

      await supabase
        .from('blog_posts')
        .update({
          image_url: photo.src.large,
          image_alt: photo.alt ?? query,
        })
        .eq('id', post.id)

      updated++
      results.push(`✓ ${post.slug}`)
    } catch {
      results.push(`✗ ${post.slug}`)
    }
  }

  return NextResponse.json({ updated, total: posts.length, results })
}
