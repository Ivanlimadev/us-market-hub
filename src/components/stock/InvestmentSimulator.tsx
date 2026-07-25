'use client'
import { useState, useMemo } from 'react'
import { useStockHistory15y, calcSimulatorForDays } from '@/lib/hooks/useStockHistory15y'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

function getYTDDays(): number {
  const now = new Date()
  const jan1 = new Date(now.getFullYear(), 0, 1)
  return Math.round((now.getTime() - jan1.getTime()) / 86_400_000)
}

const SIM_PERIODS = [
  { key: '7d',  label: '7D',   desc: '7 days ago',    getDays: () => 7         },
  { key: '1m',  label: '1M',   desc: '1 month ago',   getDays: () => 30        },
  { key: '6m',  label: '6M',   desc: '6 months ago',  getDays: () => 182       },
  { key: 'ytd', label: 'YTD',  desc: 'start of year', getDays: getYTDDays      },
  { key: '1y',  label: '1Y',   desc: '1 year ago',    getDays: () => 365       },
  { key: '2y',  label: '2Y',   desc: '2 years ago',   getDays: () => 730       },
  { key: '5y',  label: '5Y',   desc: '5 years ago',   getDays: () => 1825      },
  { key: '10y', label: '10Y',  desc: '10 years ago',  getDays: () => 3650      },
]

function fmt$(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })
}

function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

interface Props { data: StockDetailData }

export function InvestmentSimulator({ data }: Props) {
  const [amount, setAmount] = useState('1000')
  const [selectedKey, setSelectedKey] = useState('1y')
  const numAmount = Math.max(parseFloat(amount) || 1000, 1)
  const symbol = data.symbol

  const { data: bars, isLoading } = useStockHistory15y(symbol)

  const selectedPeriod = SIM_PERIODS.find((p) => p.key === selectedKey) ?? SIM_PERIODS[4]
  const days = selectedPeriod.getDays()

  const result = useMemo(() => {
    if (!bars?.length) return null
    return calcSimulatorForDays(bars, data.dividends ?? [], numAmount, days)
  }, [bars, data.dividends, numAmount, days])

  const pctWithout = result?.withoutDiv != null
    ? ((result.withoutDiv - numAmount) / numAmount) * 100
    : null
  const pctWith = result?.withDiv != null
    ? ((result.withDiv - numAmount) / numAmount) * 100
    : null

  const noData = !isLoading && result?.withoutDiv == null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-800 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-300">If You Had Invested…</h3>
        <p className="mt-0.5 text-xs text-zinc-500">Hypothetical return based on historical prices</p>
      </div>

      {/* Amount input */}
      <div className="border-b border-zinc-800 px-5 py-3">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Investment Amount
        </label>
        <div className="flex items-center w-fit rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden focus-within:border-emerald-500 transition-colors">
          <span className="px-3 py-2 text-sm font-medium text-zinc-400 border-r border-zinc-700">$</span>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32 bg-transparent px-3 py-2 text-sm font-mono font-semibold text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Period selector */}
      <div className="border-b border-zinc-800 px-5 py-3">
        <div className="flex flex-wrap gap-1">
          {SIM_PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setSelectedKey(p.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedKey === p.key
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className="px-5 py-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-48 animate-pulse rounded bg-zinc-800" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 animate-pulse rounded-lg bg-zinc-800" />
              <div className="h-24 animate-pulse rounded-lg bg-zinc-800" />
            </div>
          </div>
        ) : noData ? (
          <p className="text-sm text-zinc-500 text-center py-4">
            No historical data available for this period.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-400">
              Investing{' '}
              <span className="font-semibold text-white">{fmt$(numAmount)}</span>{' '}
              in{' '}
              <span className="font-semibold text-white">{symbol}</span>{' '}
              <span className="text-zinc-500">{selectedPeriod.desc}</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Price only */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Price Only
                </p>
                <p className="font-mono text-xl font-bold text-white leading-tight">
                  {result?.withoutDiv != null ? fmt$(result.withoutDiv) : '—'}
                </p>
                {pctWithout != null && (
                  <p className={`mt-1 text-sm font-semibold tabular-nums ${
                    pctWithout >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {fmtPct(pctWithout)}
                  </p>
                )}
              </div>

              {/* With dividends reinvested */}
              <div className={`rounded-lg border p-4 ${
                result?.withDiv != null
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-zinc-700 bg-zinc-800/50'
              }`}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  + Div. Reinvested
                </p>
                <p className="font-mono text-xl font-bold text-white leading-tight">
                  {result?.withDiv != null ? fmt$(result.withDiv) : '—'}
                </p>
                {pctWith != null && (
                  <p className={`mt-1 text-sm font-semibold tabular-nums ${
                    pctWith >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {fmtPct(pctWith)}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-zinc-800 px-5 py-2.5">
        <p className="text-[11px] text-zinc-600">
          * Dividend reinvestment calculated at ex-date price. For informational purposes only.
        </p>
      </div>
    </div>
  )
}
