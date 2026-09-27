import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Distributed rate limiter ────────────────────────────────────────────────
// On serverless (Vercel) each request may hit a different instance, so an
// in-memory Map never sees a shared count and the limit is effectively off.
// When Upstash is configured we use a shared sliding-window limiter that works
// across instances. Without it (local dev, or before the store is provisioned)
// we fall back to the old per-instance in-memory limiter so behaviour degrades
// gracefully instead of throwing.
//
// To enable the real limiter set these env vars (Upstash Redis, REST API):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = hasUpstash ? Redis.fromEnv() : null

// Ratelimit instances are keyed by (limit, window) so each distinct policy in
// the codebase gets its own sliding window. Cached to avoid rebuilding per call.
const limiters = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`
  let l = limiters.get(key)
  if (!l) {
    l = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: `rl:${key}`,
      analytics: false,
    })
    limiters.set(key, l)
  }
  return l
}

// ── In-memory fallback (per-instance only) ──────────────────────────────────
const memStore = new Map<string, { count: number; resetAt: number }>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    memStore.forEach((v, k) => {
      if (v.resetAt < now) memStore.delete(k)
    })
  }, 10 * 60 * 1000)
}

function memRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = memStore.get(ip)
  if (!entry || entry.resetAt < now) {
    memStore.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

/**
 * Returns true when the request is allowed, false when it should be rejected.
 * Uses Upstash when configured, otherwise the in-memory fallback. If the Upstash
 * call fails at runtime we fall back to the in-memory limiter rather than taking
 * the endpoint down (fail-degraded, not fail-open with zero protection).
 */
export async function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  if (redis) {
    try {
      const { success } = await getLimiter(limit, windowMs).limit(ip)
      return success
    } catch (err) {
      console.error('[rate-limit] Upstash error, falling back to memory:', err)
      return memRateLimit(ip, limit, windowMs)
    }
  }
  return memRateLimit(ip, limit, windowMs)
}

/**
 * Resolves the true client IP.
 *
 * Order reflects the current stack (Vercel, no Cloudflare in front):
 *   1. cf-connecting-ip — only present if Cloudflare is ever put back in front;
 *      harmless to check first since it is absent otherwise.
 *   2. x-real-ip — on Vercel this is set by the platform to the real client IP
 *      and cannot be spoofed by the client, so it is the trustworthy primary.
 *   3. x-forwarded-for — on Vercel the client is the FIRST hop (platform-set),
 *      the opposite of the old nginx setup where it was the last. Fallback only.
 */
export function getIp(req: { headers: { get: (k: string) => string | null } }): string {
  const cfIp = req.headers.get('cf-connecting-ip')?.trim()
  if (cfIp) return cfIp

  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length) return parts[0]
  }

  return 'unknown'
}
