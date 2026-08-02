import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // 10 verifications per 5 min per IP - prevents token enumeration
  if (!rateLimit(getIp(req), 10, 5 * 60_000)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 })
  }

  const { token } = await req.json() as { token?: string }

  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 })
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret:   process.env.TURNSTILE_SECRET_KEY!,
      response: token,
      remoteip: req.headers.get('x-forwarded-for') ?? '',
    }),
  })

  const data = await res.json() as { success: boolean; 'error-codes'?: string[] }

  if (!data.success) {
    return NextResponse.json(
      { success: false, error: 'Verification failed', codes: data['error-codes'] },
      { status: 400 },
    )
  }

  return NextResponse.json({ success: true })
}
