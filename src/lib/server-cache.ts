// Process-wide cache + single-flight + stale-while-revalidate for expensive
// upstream fetches (e.g. Yahoo batch quotes). PM2 runs a single instance, so a
// module-level Map is shared across every request - one refresh per TTL serves
// all visitors instead of each request (or each IP) hammering the upstream.
//
// Behaviour:
//  - fresh entry  -> returned immediately
//  - stale entry  -> returned immediately, refresh kicked off in the background
//  - no entry     -> caller awaits the in-flight refresh (cold start)
//  - concurrent callers for the same key share one in-flight promise
//  - the entry is kept past expiry as a fallback (see cachedStale) so a failed
//    refresh can still serve the last good value instead of erroring.

type Entry<T> = { data: T; expires: number }

const store    = new Map<string, Entry<unknown>>()
const inflight  = new Map<string, Promise<unknown>>()

export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined
  if (hit && Date.now() < hit.expires) return hit.data

  let pending = inflight.get(key) as Promise<T> | undefined
  if (!pending) {
    pending = loader()
      .then((data) => { store.set(key, { data, expires: Date.now() + ttlMs }); return data })
      .finally(() => { inflight.delete(key) })
    inflight.set(key, pending)
  }

  // Stale-while-revalidate: serve stale now, let the refresh finish in the
  // background. Attach a no-op catch so a failed background refresh doesn't
  // surface as an unhandled rejection.
  if (hit) {
    pending.catch(() => {})
    return hit.data
  }
  return pending
}

/** Last cached value for a key, even if expired. Use as a fallback on error. */
export function cachedStale<T>(key: string): T | undefined {
  return store.get(key)?.data as T | undefined
}
