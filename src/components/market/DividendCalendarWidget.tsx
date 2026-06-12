'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'

interface DivEvent {
  symbol:  string
  exDate:  string
  payDate: string
  amount:  number
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

export function DividendCalendarWidget() {
  const { data, isLoading } = useQuery<DivEvent[]>({
    queryKey: ['calendar-dividends'],
    queryFn:  () => fetch('/api/calendar/dividends').then(r => {
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
          <CalendarDays className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Upcoming Dividends</h2>
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
                  <div className="h-2.5 w-24 animate-pulse rounded bg-zinc-800" />
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-3 w-14 animate-pulse rounded bg-zinc-800" />
                  <div className="h-2.5 w-10 animate-pulse rounded bg-zinc-800" />
                </div>
              </div>
            ))
          : events.length === 0
          ? (
            <p className="px-4 py-8 text-center text-xs text-zinc-600">
              No upcoming dividends found
            </p>
          )
          : events.map((e, i) => (
              <Link
                key={`${e.symbol}-${e.exDate}-${i}`}
                href={`/stocks/${e.symbol}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors"
              >
                <Logo sym={e.symbol} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{e.symbol}</p>
                  <p className="text-[11px] text-zinc-500">
                    Ex-div: {fmtDate(e.exDate)}
                    <span className="mx-1.5 text-zinc-700">·</span>
                    Pay: {fmtDate(e.payDate)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-400">
                  ${e.amount.toFixed(4)}
                </span>
              </Link>
            ))
        }
      </div>
    </div>
  )
}
