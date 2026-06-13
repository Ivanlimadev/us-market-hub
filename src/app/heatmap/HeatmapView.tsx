'use client'
import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval, isMarketOpen } from '@/lib/market-hours'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

const TOP_N   = 20
const HEIGHT  = 600
const DAMPING = 0.986
const BOUNCE  = 0.60
const MIN_SPD = 0.28

function pctBg(p: number) {
  if (p <= -3)   return 'rgba(127,29,29,0.95)'
  if (p <= -1.5) return 'rgba(153,27,27,0.9)'
  if (p <= -0.5) return 'rgba(185,28,28,0.7)'
  if (p <   0.5) return 'rgba(39,39,42,0.88)'
  if (p <   1.5) return 'rgba(5,96,63,0.7)'
  if (p <   3)   return 'rgba(4,120,87,0.88)'
  return                 'rgba(6,78,59,0.95)'
}
function pctBorder(p: number) {
  if (p <= -0.5) return 'rgba(239,68,68,0.5)'
  if (p <   0.5) return 'rgba(82,82,91,0.4)'
  return 'rgba(16,185,129,0.5)'
}
function pctGlow(p: number) {
  if (p <= -0.5) return 'rgba(239,68,68,0.25)'
  if (p <   0.5) return 'rgba(113,113,122,0.1)'
  return 'rgba(16,185,129,0.25)'
}
function pctText(p: number) {
  if (p <= -0.5) return '#fca5a5'
  if (p <   0.5) return '#a1a1aa'
  return '#34d399'
}

interface Bubble {
  symbol: string; price: number; pct: number
  r: number; x: number; y: number; vx: number; vy: number
}

export function HeatmapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const bubblesRef   = useRef<Bubble[]>([])
  const elemRefs     = useRef<(HTMLElement | null)[]>([])
  const rafRef       = useRef<number | null>(null)
  const [ready, setReady] = useState(false)

  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey:        ['screener'],
    queryFn:         () => fetch('/api/screener').then(r => r.json()),
    staleTime:       25_000,
    refetchInterval: getPollInterval,
  })

  const top20 = useMemo(() => {
    if (!data?.length) return []
    return [...data]
      .filter(q => (q.marketCap ?? 0) > 0)
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
      .slice(0, TOP_N)
  }, [data])

  // Init / update bubble physics when data changes
  useEffect(() => {
    if (!top20.length || !containerRef.current) return
    const W = containerRef.current.clientWidth || 900
    const maxM = top20[0].marketCap ?? 1
    const minM = top20[top20.length - 1].marketCap ?? 1

    // Responsive radius: scales with container width so mobile bubbles don't overflow
    const maxR = Math.min(88, Math.floor(W / 8))   // desktop→88, mobile~48
    const minR = Math.max(26, Math.floor(maxR * 0.52))

    const prevMap = new Map(bubblesRef.current.map(b => [b.symbol, b]))

    bubblesRef.current = top20.map((q) => {
      const t = maxM === minM ? 0.5 : Math.sqrt(((q.marketCap ?? minM) - minM) / (maxM - minM))
      const r = Math.round(minR + t * (maxR - minR))

      const prev = prevMap.get(q.symbol)
      if (prev) return { ...prev, r, pct: q.changePct, price: q.price }

      const angle = Math.random() * Math.PI * 2
      return {
        symbol: q.symbol, pct: q.changePct, price: q.price, r,
        x: r + Math.random() * (W - 2 * r),
        y: r + Math.random() * (HEIGHT - 2 * r),
        vx: Math.cos(angle) * 0.8,
        vy: Math.sin(angle) * 0.8,
      }
    })

    if (!ready) setReady(true)
  }, [top20, ready])

  // Reinit on window resize (handles mobile rotation)
  useEffect(() => {
    const onResize = () => {
      if (!top20.length || !containerRef.current) return
      const W = containerRef.current.clientWidth || 900
      const maxR = Math.min(88, Math.floor(W / 8))
      const minR = Math.max(26, Math.floor(maxR * 0.52))
      const maxM = top20[0].marketCap ?? 1
      const minM = top20[top20.length - 1].marketCap ?? 1
      bubblesRef.current.forEach((b, i) => {
        const q = top20[i]
        if (!q) return
        const t = maxM === minM ? 0.5 : Math.sqrt(((q.marketCap ?? minM) - minM) / (maxM - minM))
        b.r = Math.round(minR + t * (maxR - minR))
        b.x = Math.min(b.x, W - b.r)
        b.y = Math.min(b.y, HEIGHT - b.r)
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [top20])

  // Physics animation loop
  useEffect(() => {
    function tick() {
      const container = containerRef.current
      const bubbles   = bubblesRef.current
      if (!container || !bubbles.length) { rafRef.current = requestAnimationFrame(tick); return }

      const W = container.clientWidth

      for (const b of bubbles) {
        b.x += b.vx;  b.y += b.vy
        b.vx *= DAMPING; b.vy *= DAMPING

        if (b.x < b.r)      { b.x = b.r;      b.vx =  Math.abs(b.vx) * BOUNCE }
        if (b.x > W - b.r)  { b.x = W - b.r;  b.vx = -Math.abs(b.vx) * BOUNCE }
        if (b.y < b.r)      { b.y = b.r;      b.vy =  Math.abs(b.vy) * BOUNCE }
        if (b.y > HEIGHT - b.r) { b.y = HEIGHT - b.r; b.vy = -Math.abs(b.vy) * BOUNCE }

        const spd = Math.hypot(b.vx, b.vy)
        if (spd < MIN_SPD) {
          const a = Math.random() * Math.PI * 2
          b.vx += Math.cos(a) * (MIN_SPD - spd + 0.2)
          b.vy += Math.sin(a) * (MIN_SPD - spd + 0.2)
        }
      }

      // Soft separation between overlapping bubbles
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const a = bubbles[i], b2 = bubbles[j]
          const dx = a.x - b2.x, dy = a.y - b2.y
          const d  = Math.hypot(dx, dy)
          const minD = a.r + b2.r + 3
          if (d < minD && d > 0.1) {
            const f  = (minD - d) / minD * 0.14
            const nx = dx / d, ny = dy / d
            a.vx  += nx * f;  a.vy  += ny * f
            b2.vx -= nx * f;  b2.vy -= ny * f
          }
        }
      }

      // Write positions to DOM (bypass React state)
      bubbles.forEach((b, i) => {
        const el = elemRefs.current[i]
        if (el) el.style.transform = `translate(${Math.round(b.x - b.r)}px,${Math.round(b.y - b.r)}px)`
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const open = isMarketOpen()

  if (isLoading && !ready) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950"
        style={{ height: HEIGHT }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Top {TOP_N} ações por market cap · tamanho = market cap</span>
        <span className="flex items-center gap-1.5">
          {open
            ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Ao vivo</>
            : 'Mercado fechado · última sessão'
          }
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
        style={{ height: HEIGHT }}
      >
        {ready && top20.map((q, i) => {
          const b   = bubblesRef.current[i]
          if (!b) return null
          const d   = b.r * 2
          const p   = q.changePct
          const fs  = Math.max(10, Math.round(b.r * 0.28))
          const fs2 = Math.max(9,  Math.round(b.r * 0.22))
          const fs3 = Math.max(8,  Math.round(b.r * 0.17))

          return (
            <Link
              key={q.symbol}
              href={`/stocks/${q.symbol}`}
              ref={(el) => { elemRefs.current[i] = el }}
              className="absolute flex flex-col items-center justify-center rounded-full hover:brightness-125 transition-[filter] duration-150 select-none"
              style={{
                width: d, height: d,
                top: 0, left: 0,
                transform: `translate(${Math.round(b.x - b.r)}px,${Math.round(b.y - b.r)}px)`,
                background: pctBg(p),
                border: `1.5px solid ${pctBorder(p)}`,
                boxShadow: `0 0 ${Math.round(b.r * 0.5)}px ${pctGlow(p)}, 0 0 ${Math.round(b.r * 0.15)}px ${pctGlow(p)}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                willChange: 'transform',
              }}
            >
              <span className="font-bold text-white leading-none" style={{ fontSize: fs }}>
                {q.symbol}
              </span>
              <span className="font-semibold leading-none mt-1" style={{ color: pctText(p), fontSize: fs2 }}>
                {p >= 0 ? '+' : ''}{p.toFixed(2)}%
              </span>
              {b.r >= 48 && (
                <span className="mt-0.5 font-mono leading-none" style={{ color: pctText(p), fontSize: fs3, opacity: 0.75 }}>
                  ${q.price >= 10 ? q.price.toFixed(2) : q.price.toFixed(4)}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
