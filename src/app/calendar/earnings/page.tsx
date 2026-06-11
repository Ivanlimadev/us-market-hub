'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'

interface EarningsEvent {
  symbol: string; name: string; date: string | null; time: string | null
  price: number | null; changePct: number | null; marketCap: number | null; eps: number | null
}

function fmtCap(n: number | null) {
  if (!n) return null
  if (n >= 1e12) return `$${(n/1e12).toFixed(1)}T`
  if (n >= 1e9)  return `$${(n/1e9).toFixed(1)}B`
  return null
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function daysUntil(d: string) {
  return Math.round((new Date(d).getTime() - new Date().setHours(0,0,0,0)) / 86_400_000)
}
function timeLabel(t: string | null) {
  if (t === 'amc') return 'After Close'
  if (t === 'bmo') return 'Before Open'
  return 'TBD'
}
function Logo({ sym }: { sym: string }) {
  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-zinc-800 flex items-center justify-center">
      <Image src={`https://assets.parqet.com/logos/symbol/${sym}?format=png`} alt={sym} width={32} height={32} className="object-contain" unoptimized
        onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; if (t.parentElement) t.parentElement.innerHTML = `<span class="text-xs font-bold text-zinc-400">${sym.slice(0,2)}</span>` }}
      />
    </div>
  )
}

export default function EarningsCalendarPage() {
  const { data, isLoading } = useQuery<EarningsEvent[]>({
    queryKey: ['calendar-earnings'],
    queryFn: () => fetch('/api/calendar/earnings').then((r) => r.json()),
    staleTime: 60 * 60_000,
  })

  const grouped = (data ?? []).reduce<Record<string, EarningsEvent[]>>((acc, e) => {
    if (!e.date) return acc
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Earnings Calendar</h1>
        <p className="text-sm text-zinc-400">Upcoming earnings reports · Next 45 days</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({length:3}).map((_,i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      )}

      {!isLoading && !data?.length && (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
          No upcoming earnings events found
        </div>
      )}

      {Object.entries(grouped).map(([date, events]) => {
        const days = daysUntil(date)
        return (
          <div key={date}>
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {fmtDate(date)}
              </h2>
              {days <= 1 && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  {days === 0 ? 'Today' : 'Tomorrow'}
                </span>
              )}
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="divide-y divide-zinc-800/60">
                {events.map((e) => {
                  const isUp = (e.changePct ?? 0) >= 0
                  return (
                    <Link key={e.symbol} href={`/stocks/${e.symbol}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/40 transition-colors"
                    >
                      <Logo sym={e.symbol} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">{e.symbol}</p>
                        <p className="truncate text-xs text-zinc-500">{e.name}</p>
                      </div>
                      <div className="hidden text-center sm:block">
                        <p className="text-xs text-zinc-400">{timeLabel(e.time)}</p>
                        {e.eps !== null && (
                          <p className="text-[11px] text-zinc-500">EPS est. ${e.eps.toFixed(2)}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {e.price !== null && (
                          <p className="font-mono text-sm font-bold text-white">${e.price.toFixed(2)}</p>
                        )}
                        {e.changePct !== null && (
                          <p className={`text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isUp ? '+' : ''}{e.changePct.toFixed(2)}%
                          </p>
                        )}
                        {fmtCap(e.marketCap) && (
                          <p className="text-[11px] text-zinc-500">{fmtCap(e.marketCap)}</p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
