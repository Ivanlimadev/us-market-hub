'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'

interface DivEvent { symbol: string; exDate: string; payDate: string; amount: number }

function daysUntil(d: string) {
  return Math.round((new Date(d).getTime() - new Date().setHours(0,0,0,0)) / 86_400_000)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

export default function DividendCalendarPage() {
  const { data, isLoading } = useQuery<DivEvent[]>({
    queryKey: ['calendar-dividends'],
    queryFn: () => fetch('/api/calendar/dividends').then((r) => r.json()),
    staleTime: 60 * 60_000,
  })

  // Group by week
  const grouped = (data ?? []).reduce<Record<string, DivEvent[]>>((acc, e) => {
    const d = new Date(e.exDate)
    const mon = new Date(d); mon.setDate(d.getDate() - d.getDay() + 1)
    const key = mon.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dividend Calendar</h1>
        <p className="text-sm text-zinc-400">Upcoming ex-dividend dates · Next 45 days</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({length: 3}).map((_,i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      )}

      {!isLoading && !data?.length && (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
          No upcoming dividend events found
        </div>
      )}

      {Object.entries(grouped).map(([weekStart, events]) => (
        <div key={weekStart}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="divide-y divide-zinc-800/60">
              {events.map((e) => {
                const days = daysUntil(e.exDate)
                const urgent = days <= 3
                return (
                  <Link key={e.symbol + e.exDate} href={`/stocks/${e.symbol}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-800/40 transition-colors"
                  >
                    <Logo sym={e.symbol} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{e.symbol}</p>
                      <p className="text-xs text-zinc-500">Ex-date: {fmtDate(e.exDate)} · Pay: {fmtDate(e.payDate)}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="font-mono text-sm font-bold text-emerald-400">${e.amount.toFixed(4)}</p>
                      <p className={`text-xs font-semibold ${urgent ? 'text-amber-400' : 'text-zinc-500'}`}>
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
