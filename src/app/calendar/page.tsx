'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, TrendingUp } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────
interface DivEvent {
  symbol:  string
  exDate:  string
  payDate: string
  amount:  number
}
interface EarningsEvent {
  symbol:    string
  name:      string
  date:      string | null
  time:      string | null
  price:     number | null
  changePct: number | null
  marketCap: number | null
  eps:       number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────
function Logo({ sym }: { sym: string }) {
  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center">
      <Image
        src={`https://assets.parqet.com/logos/symbol/${sym}?format=png`}
        alt={sym} width={36} height={36} className="object-contain" unoptimized
        onError={(e) => {
          const t = e.target as HTMLImageElement; t.style.display = 'none'
          if (t.parentElement) t.parentElement.innerHTML = `<span class="text-xs font-bold text-zinc-400">${sym.slice(0, 2)}</span>`
        }}
      />
    </div>
  )
}

function daysUntil(iso: string) {
  return Math.round((new Date(iso + 'T12:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function DayBadge({ iso }: { iso: string }) {
  const d = daysUntil(iso)
  if (d > 3) return null
  const label = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`
  return (
    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
      {label}
    </span>
  )
}

function fmtCap(n: number | null) {
  if (!n) return null
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return null
}

// ── Dividends tab ─────────────────────────────────────────────────────────
function DividendsTab() {
  const { data, isLoading } = useQuery<DivEvent[]>({
    queryKey: ['calendar-dividends'],
    queryFn:  () => fetch('/api/calendar/dividends').then(r => {
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json()
    }),
    staleTime: 15 * 60_000,
  })

  const list = Array.isArray(data) ? data : []
  const grouped = list.reduce<Record<string, DivEvent[]>>((acc, e) => {
    const d = new Date(e.exDate + 'T12:00:00')
    const mon = new Date(d)
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday of the week
    const key = mon.toISOString().split('T')[0]
    ;(acc[key] ??= []).push(e)
    return acc
  }, {})

  if (isLoading) return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-800" />
      ))}
    </div>
  )

  if (!list.length) return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
      No upcoming dividend events found
    </div>
  )

  return (
    <div className="space-y-6">
      {Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([weekStart, events]) => (
        <div key={weekStart}>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Week of {new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </h2>
            <DayBadge iso={events[0].exDate} />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="divide-y divide-zinc-800/60">
              {events.map((e) => {
                const days = daysUntil(e.exDate)
                return (
                  <Link
                    key={e.symbol + e.exDate}
                    href={`/stocks/${e.symbol}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/40 transition-colors"
                  >
                    <Logo sym={e.symbol} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{e.symbol}</p>
                      <p className="text-xs text-zinc-500">
                        Ex-div: {fmtDate(e.exDate)}
                        <span className="mx-1.5 text-zinc-700">·</span>
                        Pay: {fmtDate(e.payDate)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-bold text-emerald-400">${e.amount.toFixed(4)}</p>
                      <p className={`text-xs font-semibold ${days <= 3 ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Earnings tab ──────────────────────────────────────────────────────────
function timeLabel(t: string | null) {
  if (t === 'amc') return { text: 'After Close', cls: 'bg-violet-500/15 text-violet-400' }
  if (t === 'bmo') return { text: 'Pre-Market',  cls: 'bg-amber-500/15 text-amber-400' }
  return { text: 'TBD', cls: 'bg-zinc-700/40 text-zinc-500' }
}

function EarningsTab() {
  const { data, isLoading } = useQuery<EarningsEvent[]>({
    queryKey: ['calendar-earnings'],
    queryFn:  () => fetch('/api/calendar/earnings').then(r => {
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json()
    }),
    staleTime: 15 * 60_000,
  })

  const earningsList = Array.isArray(data) ? data : []
  const grouped = earningsList.reduce<Record<string, EarningsEvent[]>>((acc, e) => {
    if (!e.date) return acc
    ;(acc[e.date] ??= []).push(e)
    return acc
  }, {})

  if (isLoading) return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-800" />
      ))}
    </div>
  )

  if (!earningsList.length) return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
      No upcoming earnings events found
    </div>
  )

  return (
    <div className="space-y-6">
      {Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([date, events]) => (
        <div key={date}>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {fmtDate(date)}
            </h2>
            <DayBadge iso={date} />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="divide-y divide-zinc-800/60">
              {events.map((e) => {
                const isUp = (e.changePct ?? 0) >= 0
                const tl   = timeLabel(e.time)
                return (
                  <Link
                    key={e.symbol}
                    href={`/stocks/${e.symbol}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/40 transition-colors"
                  >
                    <Logo sym={e.symbol} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{e.symbol}</p>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${tl.cls}`}>
                          {tl.text}
                        </span>
                      </div>
                      <p className="truncate text-xs text-zinc-500">{e.name}</p>
                    </div>
                    <div className="hidden text-center sm:block min-w-[80px]">
                      {e.eps !== null && (
                        <p className="text-xs text-zinc-400">EPS est. <span className="font-semibold text-white">${e.eps.toFixed(2)}</span></p>
                      )}
                      {fmtCap(e.marketCap) && (
                        <p className="text-[11px] text-zinc-500">{fmtCap(e.marketCap)}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 min-w-[70px]">
                      {e.price !== null && (
                        <p className="font-mono text-sm font-bold text-white">${e.price.toFixed(2)}</p>
                      )}
                      {e.changePct !== null && (
                        <p className={`text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isUp ? '+' : ''}{e.changePct.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
type Tab = 'dividends' | 'earnings'

export default function CalendarPage() {
  const [tab, setTab] = useState<Tab>('dividends')

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="text-sm text-zinc-400">Upcoming dividends and earnings reports</p>
      </div>

      {/* Tab bar */}
      <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1 gap-1 w-fit">
        <button
          onClick={() => setTab('dividends')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'dividends' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Dividends
        </button>
        <button
          onClick={() => setTab('earnings')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'earnings' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Earnings
        </button>
      </div>

      {tab === 'dividends' && <DividendsTab />}
      {tab === 'earnings'  && <EarningsTab />}
    </div>
  )
}
