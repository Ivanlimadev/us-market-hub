import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const REDIS_CONFIGURED =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const ratelimit = REDIS_CONFIGURED
  ? new Ratelimit({
      redis: new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter:   Ratelimit.slidingWindow(60, '60 s'),
      analytics: true,
      prefix:    'smroi',
    })
  : null

const EXEMPT_PREFIXES = [
  '/api/auth/',
  '/api/watchlist',
  '/api/alerts',
  '/api/portfolio',
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/api/')) return NextResponse.next()
  if (EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'

  if (!ratelimit) {
    const res = NextResponse.next()
    res.headers.set('X-RL-Status', 'disabled-no-env')
    return res
  }

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(ip)

    const rlHeaders: Record<string, string> = {
      'X-RateLimit-Limit':     String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset':     String(reset),
    }

    if (!success) {
      const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { ...rlHeaders, 'Retry-After': String(retryAfter) } },
      )
    }

    const res = NextResponse.next()
    Object.entries(rlHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch {
    const res = NextResponse.next()
    res.headers.set('X-RL-Status', 'error-redis-unavailable')
    return res
  }
}

export const config = {
  matcher: '/api/:path*',
}
