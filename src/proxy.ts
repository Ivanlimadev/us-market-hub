import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Vercel KV (via Storage tab) uses KV_REST_API_* names
// Direct Upstash uses UPSTASH_REDIS_REST_* names — support both
const redisUrl   = process.env.KV_REST_API_URL   ?? process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

const ratelimit =
  redisUrl && redisToken
    ? new Ratelimit({
        redis:     new Redis({ url: redisUrl, token: redisToken }),
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

  if (!ratelimit) {
    const res = NextResponse.next()
    res.headers.set('X-RL-Status', 'disabled-no-env')
    return res
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'

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
}

export const config = {
  matcher: '/api/:path*',
}
