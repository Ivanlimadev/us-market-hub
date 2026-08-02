import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization') ?? ''
  const header = req.headers.get('x-cron-secret') ?? ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  if (!cronSecret || (header !== cronSecret && bearer !== cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pexelsKey = process.env.PEXELS_API_KEY
  if (!pexelsKey) return NextResponse.json({ error: 'PEXELS_API_KEY not set' }, { status: 503 })

  // Writes (update post images) require the service role - blog_posts RLS grants
  // the anon role SELECT only. Route is server-only and CRON_SECRET-protected.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, category')
    .is('image_url', null)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts?.length) return NextResponse.json({ message: 'No posts missing images' })

  const results = []

  for (const post of posts) {
    const query = post.title
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .split(' ')
      .filter((w: string) => w.length > 3)
      .slice(0, 3)
      .join(' ') || post.category

    const imgRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=3`,
      { headers: { Authorization: pexelsKey } },
    )

    if (!imgRes.ok) { results.push({ slug: post.slug, error: 'pexels failed' }); continue }

    const data = await imgRes.json()
    const photo = data.photos?.[0]
    if (!photo) { results.push({ slug: post.slug, error: 'no photo' }); continue }

    const { error: updateErr } = await supabase
      .from('blog_posts')
      .update({ image_url: photo.src.large, image_alt: photo.alt ?? query })
      .eq('id', post.id)

    results.push({ slug: post.slug, image: photo.src.large, error: updateErr?.message ?? null })
  }

  return NextResponse.json({ updated: results.length, results })
}
