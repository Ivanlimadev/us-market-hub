'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { YFOptionChain, YFOptionContract } from '@/lib/yahoo-finance'

const fmtExp = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

const num = (n: number, d = 2) =>
  n > 0 ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '-'

const int = (n: number) => (n > 0 ? n.toLocaleString('en-US') : '-')

function Table({ rows, price }: { rows: YFOptionContract[]; price: number }) {
  // Strike closest to the underlying price = at-the-money, highlighted.
  const atm = rows.reduce(
    (best, r, i) => (Math.abs(r.strike - price) < Math.abs(rows[best].strike - price) ? i : best),
    0
  )
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[560px] text-right text-sm tabular-nums">
        <thead>
          <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 text-left">Strike</th>
            <th className="px-3 py-2">Last</th>
            <th className="px-3 py-2">Bid</th>
            <th className="px-3 py-2">Ask</th>
            <th className="px-3 py-2">Volume</th>
            <th className="px-3 py-2">Open Int.</th>
            <th className="px-3 py-2">IV</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.contractSymbol || r.strike}
              className={`border-b border-zinc-800/50 ${
                i === atm ? 'bg-[#c8a45d]/10' : r.inTheMoney ? 'bg-zinc-800/30' : ''
              }`}
            >
              <td className="px-3 py-2 text-left font-semibold text-white">
                ${num(r.strike)}
              </td>
              <td className="px-3 py-2 text-zinc-200">{num(r.lastPrice)}</td>
              <td className="px-3 py-2 text-emerald-400">{num(r.bid)}</td>
              <td className="px-3 py-2 text-red-400">{num(r.ask)}</td>
              <td className="px-3 py-2 text-zinc-400">{int(r.volume)}</td>
              <td className="px-3 py-2 text-zinc-400">{int(r.openInterest)}</td>
              <td className="px-3 py-2 text-zinc-400">
                {r.impliedVolatility > 0 ? `${(r.impliedVolatility * 100).toFixed(1)}%` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function OptionsChain({
  symbol,
  initialData,
}: {
  symbol: string
  initialData: YFOptionChain
}) {
  const [exp, setExp] = useState(initialData.expiration)
  const [side, setSide] = useState<'calls' | 'puts'>('calls')

  const { data, isFetching } = useQuery<YFOptionChain>({
    queryKey: ['options', symbol, exp],
    queryFn: () => fetch(`/api/options/${symbol}?date=${exp}`).then((r) => r.json()),
    initialData: exp === initialData.expiration ? initialData : undefined,
    staleTime: 300_000,
  })

  const chain = data ?? initialData
  const rows = side === 'calls' ? chain.calls : chain.puts

  return (
    <div className="space-y-4">
      {/* Expiration selector */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Expiration
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {initialData.expirationDates.map((d) => (
            <button
              key={d}
              onClick={() => setExp(d)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                d === exp
                  ? 'border-[#c8a45d] bg-[#c8a45d]/10 text-[#c8a45d]'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {fmtExp(d)}
            </button>
          ))}
        </div>
      </div>

      {/* Calls / Puts toggle */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-zinc-800 p-0.5">
          {(['calls', 'puts'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                side === s
                  ? s === 'calls'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-500">
          {isFetching ? 'Loading...' : `${rows.length} contracts`}
        </span>
      </div>

      {rows.length > 0 ? (
        <Table rows={rows} price={chain.underlyingPrice} />
      ) : (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-6 text-center text-sm text-zinc-500">
          No {side} listed for this expiration.
        </p>
      )}
    </div>
  )
}
