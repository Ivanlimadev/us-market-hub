'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'

interface EarningsEvent {
  symbol:    string
  name:      string
  date:      string
  time:      string | null
  price:     number | null
  changePct: number | null
}

function Logo({ sym }: { sym: string }) {
  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-zinc-800 flex items-center justify-center">
      <Image
        src={`https://assets.parqet.com/logos/symbol/${sym}?format=png`}
        alt={sym} width={32} height={32} className="object-contain" unoptimized
        onError={(e) => {
          const t = e.target as HTMLImageElement
          t.style.display = 'none'
          if (t.parentElement)
            t.parentElement.innerHTML = `<span class="text-[10px] font-bold text-zinc-400">${sym.slice(0, 2)}</span>`
        }}
      />
    </div>
  )
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

function TimeBadge({ time }: { time: string | null }) {
  if (!time) return null
  const label = time === 'amc' ? 'After Close' : time === 'bmo' ? 'Pre-Market' : time
  const cls   = time === 'amc' ? 'bg-violet-500/15 text-violet-400' : 'bg-amber-500/15 text-amber-400'
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${cls}`}>
      {label}
    </span>
  )
}

export function EarningsCalendarWidget() {
  const { data, isLoading } = useQuery<EarningsEvent[]>({
    queryKey: ['calendar-earnings'],
    queryFn:  () => fetch('/api/calendar/earnings').then(r => {
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json()
    }),
    staleTime: 15 * 60_000,
  })

  const events = Array.isArray(data) ? data.slice(0, 5) : []

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Upcoming Earnings</h2>
        </div>
        <Link
          href="/calendar"
          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          See more →
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-zinc-800/50">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-12 animate-pulse rounded bg-zinc-800" />
                  <div className="h-2.5 w-28 animate-pulse rounded bg-zinc-800" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
              </div>
            ))
          : events.length === 0
          ? (
            <p className="px-4 py-8 text-center text-xs text-zinc-600">
              No upcoming earnings found
            </p>
          )
          : events.map((e, i) => {
              const up = (e.changePct ?? 0) >= 0
              return (
                <Link
                  key={`${e.symbol}-${e.date}-${i}`}
                  href={`/stocks/${e.symbol}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors"
                >
                  <Logo sym={e.symbol} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white">{e.symbol}</p>
                      <TimeBadge time={e.time} />
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {fmtDate(e.date)}
                      {e.name && e.name !== e.symbol && (
                        <span className="mx-1.5 text-zinc-700">·</span>
                      )}
                      <span className="truncate">{e.name !== e.symbol ? e.name : ''}</span>
                    </p>
                  </div>
                  {e.price != null && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-white">
                        ${e.price.toFixed(2)}
                      </p>
                      <p className={`text-[11px] font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                        {up ? '+' : ''}{(e.changePct ?? 0).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </Link>
              )
            })
        }
      </div>
    </div>
  )
}
