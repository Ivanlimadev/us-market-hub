import { NextResponse } from 'next/server'

// Temporary diagnostic — remove after confirming rate limit works
export const runtime = 'edge'

export function GET() {
  const hasUrl   = !!process.env.UPSTASH_REDIS_REST_URL
  const hasToken = !!process.env.UPSTASH_REDIS_REST_TOKEN
  const urlPrefix = process.env.UPSTASH_REDIS_REST_URL?.slice(0, 20) ?? 'not set'
  return NextResponse.json({ hasUrl, hasToken, urlPrefix })
}
