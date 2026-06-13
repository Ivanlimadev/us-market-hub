'use client'
import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { CryptoDetail } from '@/types/crypto'

interface Period { label: string; pct: number }

export function ROICalculator({ coin }: { coin: CryptoDetail }) {
  const [amount, setAmount] = useState(1000)

  const md = coin.market_data
  const periods: Period[] = [
    { label: '7d ago',  pct: md.price_change_percentage_7d  },
    { label: '30d ago', pct: md.price_change_percentage_30d },
    { label: '60d ago', pct: md.price_change_percentage_60d },
    { label: '1y ago',  pct: md.price_change_percentage_1y  },
  ].filter(p => p.pct != null) as Period[]

  if (!periods.length) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">ROI Calculator</h3>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-400">If you invested</span>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-zinc-400">$</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={e => setAmount(Math.max(1, Number(e.target.value) || 1))}
            className="w-28 rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-6 pr-2 text-sm font-semibold text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <span className="text-sm text-zinc-400">it would be worth today:</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {periods.map(({ label, pct }) => {
          const result = amount * (1 + pct / 100)
          const gain   = result - amount
          const up     = gain >= 0
          return (
            <div
              key={label}
              className={`rounded-lg border p-3 ${
                up ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
              }`}
            >
              <p className="mb-1 text-[10px] text-zinc-500">{label}</p>
              <p className="text-sm font-bold tabular-nums text-white">
                ${result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p
                className={`mt-0.5 flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
                  up ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {up ? '+' : ''}${Math.abs(gain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                &nbsp;({up ? '+' : ''}{pct.toFixed(2)}%)
              </p>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-[10px] text-zinc-600">
        For educational purposes only · Based on historical price change data from CoinGecko
      </p>
    </div>
  )
}
