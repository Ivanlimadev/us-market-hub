import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { rateLimit, getIp } from '@/lib/rate-limit'

// POST /api/push/subscribe — stores a browser FCM token for web push.
// Anonymous visitors are allowed (no auth): the goal is broad blog-post reach,
// mirroring how sites like Yahoo prompt every visitor. Tokens live in
// web_push_tokens (service-role only) and are delivered by notify-blog-posts.
export async function POST(req: NextRequest) {
  // 10 subscribes/min per IP — plenty for a real user, blocks abuse.
  if (!rateLimit(getIp(req), 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let token: unknown
  try {
    ({ token } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (typeof token !== 'string' || token.length < 50 || token.length > 4096) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Upsert on the unique token: re-subscribing just refreshes last_seen_at.
  const { error } = await admin
    .from('web_push_tokens')
    .upsert(
      {
        token,
        user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    )

  if (error) {
    console.error('[push/subscribe] insert failed:', error.message)
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
