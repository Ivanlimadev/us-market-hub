import { NextRequest, NextResponse } from 'next/server'

// Minimal test — verify middleware runs at all before re-adding Upstash
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/api/')) return NextResponse.next()

  const res = NextResponse.next()
  res.headers.set('X-Middleware', 'active')
  return res
}

export const config = {
  matcher: '/api/:path*',
}
