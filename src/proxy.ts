import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limit store - persists across requests on VPS (single Node.js process)
const store = new Map<string, { count: number; resetAt: number }>()

function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false
  entry.count++
  return true
}

// Lazy cleanup: purge expired entries every ~200 requests
let tick = 0
function maybeClean() {
  if (++tick % 200 !== 0) return
  const now = Date.now()
  store.forEach((v, k) => { if (v.resetAt < now) store.delete(k) })
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// Bucket: group by IP + route prefix (not full path - avoids per-symbol keys)
function bucket(ip: string, pathname: string): string {
  const prefix = pathname.split('/').slice(0, 4).join('/')
  return `${ip}|${prefix}`
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // SEO: redirect uppercase stock URLs to the lowercase canonical.
  // Internal links emit /stocks/NVDA but each page's canonical is /stocks/nvda,
  // so a 301 here consolidates crawl/link-equity on one URL. Lowercase editorial
  // pages (e.g. /stocks/best-dividend-stocks) already match and pass through.
  if (pathname.startsWith('/stocks/')) {
    const lower = pathname.toLowerCase()
    if (pathname !== lower) {
      const url = req.nextUrl.clone()
      url.pathname = lower
      return NextResponse.redirect(url, 301)
    }
    return NextResponse.next()
  }

  if (!pathname.startsWith('/api/')) return NextResponse.next()

  maybeClean()

  const ip = getIp(req)

  // Routes that call multiple external APIs simultaneously - tighter limit
  const isHeavy =
    pathname.startsWith('/api/screener') ||
    pathname.startsWith('/api/batch-quotes') ||
    pathname.startsWith('/api/stocks/') && pathname.endsWith('/insight') ||
    pathname.startsWith('/api/crypto/') && pathname.endsWith('/insight')

  // Blog admin routes - very low limit (should only be called by cron)
  const isBlogAdmin =
    pathname.startsWith('/api/blog/generate') ||
    pathname.startsWith('/api/blog/rewrite') ||
    pathname.startsWith('/api/blog/publish') ||
    pathname.startsWith('/api/blog/update-images')

  const [max, windowMs] = isHeavy
    ? [30, 60_000]
    : isBlogAdmin
    ? [10, 60_000]
    : [60, 60_000]

  if (!allow(bucket(ip, pathname), max, windowMs)) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: 60 },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(max),
        },
      },
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/stocks/:path*'],
}
