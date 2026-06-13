import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Graceful no-op when env vars aren't set (dev / pre-Upstash)
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis:     Redis.fromEnv(),
        limiter:   Ratelimit.slidingWindow(60, '60 s'),
        analytics: true,
        prefix:    'smroi',
      })
    : null

// Routes that skip rate limiting (auth has Turnstile; user-data routes require Supabase JWT)
const EXEMPT_PREFIXES = [
  '/api/auth/',
  '/api/watchlist',
  '/api/alerts',
  '/api/portfolio',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only intercept API routes
  if (!pathname.startsWith('/api/')) return NextResponse.next()

  // Skip exempt routes
  if (EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()

  // If Upstash isn't configured yet, pass through with diagnostic header
  if (!ratelimit) {
    const res = NextResponse.next()
    res.headers.set('X-RL-Status', 'disabled-no-env')
    return res
  }

  // Use IP as rate limit key; fall back to a static string if IP unavailable
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'

  const { success, limit, remaining, reset } = await ratelimit.limit(ip)

  const headers: Record<string, string> = {
    'X-RateLimit-Limit':     String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset':     String(reset),
  }

  if (!success) {
    const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000))
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: { ...headers, 'Retry-After': String(retryAfter) },
      },
    )
  }

  const res = NextResponse.next()
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

export const config = {
  matcher: '/api/:path*',
}
