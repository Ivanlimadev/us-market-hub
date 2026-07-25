'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, ExternalLink, Users } from 'lucide-react'
import type { InsiderData, InsiderTx } from '@/app/api/stocks/insiders/route'

function fmtUsd(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}
function fmtShares(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}
function shortDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

const TYPE_LABEL: Record<InsiderTx['type'], string> = {
  buy: 'Buy', sell: 'Sell', award: 'Grant', option: 'Option', tax: 'Tax', gift: 'Gift', other: 'Other',
}
function typeClass(t: InsiderTx['type']): string {
  if (t === 'buy') return 'bg-emerald-500/15 text-emerald-400'
  if (t === 'sell') return 'bg-red-500/15 text-red-400'
  return 'bg-zinc-700/50 text-zinc-400'
}

export function InsiderTransactions({ symbol }: { symbol: string }) {
  const [expanded, setExpanded] = useState(false)
  const VISIBLE = 3

  const { data, isLoading } = useQuery<InsiderData>({
    queryKey: ['insiders', symbol],
    queryFn: async () => {
      const r = await fetch(`/api/stocks/insiders?symbol=${symbol}`)
      const j = await r.json()
      if (!r.ok || !j || !Array.isArray(j.transactions)) {
        return { symbol, cik: '', transactions: [], summary: { months: 6, buys: 0, sells: 0, buyValue: 0, sellValue: 0, netValue: 0 } } as InsiderData
      }
      return j as InsiderData
    },
    staleTime: 6 * 60 * 60_000,
    retry: 1,
  })

  const s = data?.summary
  const netBuying = (s?.netValue ?? 0) > 0
  const hasSignal = (s?.buys ?? 0) > 0 || (s?.sells ?? 0) > 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Insider Transactions</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">SEC Form 4 · officers, directors & 10% owners</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="p-5 space-y-3 animate-pulse">
          <div className="h-12 rounded bg-zinc-800" />
          {[1, 2, 3, 4].map(i => <div key={i} className="h-8 rounded bg-zinc-800" />)}
        </div>
      )}

      {!isLoading && !data?.transactions.length && (
        <div className="px-5 py-8 text-center text-xs text-zinc-500">
          No recent insider (Form 4) filings found for {symbol}.
        </div>
      )}

      {!isLoading && data?.transactions.length ? (
        <div className="p-5 space-y-4">
          {/* 6-month sentiment */}
          {hasSignal && s && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/40 px-4 py-3">
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${netBuying ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                {netBuying ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {netBuying ? 'Net insider buying' : 'Net insider selling'}
              </span>
              <span className="text-xs text-zinc-500">last {s.months} months</span>
              <span className="ml-auto flex gap-4 text-xs">
                <span className="text-emerald-400">{s.buys} buys · {fmtUsd(s.buyValue)}</span>
                <span className="text-red-400">{s.sells} sells · {fmtUsd(s.sellValue)}</span>
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
                  <th className="pb-2 text-left font-medium">Date</th>
                  <th className="pb-2 text-left font-medium">Insider</th>
                  <th className="pb-2 text-left font-medium">Type</th>
                  <th className="pb-2 text-right font-medium">Shares</th>
                  <th className="pb-2 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {(expanded ? data.transactions : data.transactions.slice(0, VISIBLE)).map((t, i) => (
                  <tr key={`${t.owner}-${t.date}-${i}`} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 whitespace-nowrap text-zinc-400">{shortDate(t.date)}</td>
                    <td className="py-2.5 pr-2">
                      <span className="block font-medium text-zinc-200">{t.owner}</span>
                      <span className="block text-[10px] text-zinc-500 truncate max-w-[180px]">{t.role}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${typeClass(t.type)}`}>
                        {TYPE_LABEL[t.type]}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-zinc-300">{fmtShares(t.shares)}</td>
                    <td className="py-2.5 text-right tabular-nums text-zinc-400">
                      {t.value != null ? fmtUsd(t.value) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.transactions.length > VISIBLE && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full rounded-lg bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              {expanded ? 'Show less' : `View all ${data.transactions.length} transactions`}
            </button>
          )}

          <div className="flex items-center justify-between text-[10px] text-zinc-600">
            <span>P = open-market buy · S = sell · others are compensation events</span>
            <a
              href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${data.cik}&type=4&dateb=&owner=include&count=40`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-zinc-400"
            >
              All Form 4 filings <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      ) : null}
    </div>
  )
}
