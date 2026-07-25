const store = new Map<string, { count: number; resetAt: number }>()

// Cleanup entries older than 1h every 10 min
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((v, k) => { if (v.resetAt < now) store.delete(k) })
  }, 10 * 60 * 1000)
}

export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

export function getIp(req: { headers: { get: (k: string) => string | null } }): string {
  // Behind Cloudflare the chain is client → CF edge → nginx → app, so nginx's
  // $remote_addr (and thus x-real-ip / the last x-forwarded-for hop) is the CF
  // EDGE IP, shared by many users — that collapses everyone into one rate-limit
  // bucket. CF-Connecting-IP is always the true client IP, so prefer it. It only
  // reaches us via Cloudflare (direct-to-nginx traffic is denied), so it is as
  // trustworthy as x-real-ip here.
  const cfIp = req.headers.get('cf-connecting-ip')?.trim()
  if (cfIp) return cfIp

  // Prefer x-real-ip: nginx sets it to $remote_addr, overwriting any client value,
  // so it cannot be spoofed to forge a fresh rate-limit bucket.
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  // Fallback: nginx appends the true client IP as the LAST entry of x-forwarded-for.
  // Trusting the last (not first) entry avoids honoring a client-supplied prefix.
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }

  return 'unknown'
}
