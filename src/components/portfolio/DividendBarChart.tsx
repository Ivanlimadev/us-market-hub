'use client'
import type { DividendBar } from '@/lib/hooks/usePortfolioDividends'

interface Props {
  data:    DividendBar[]
  color?:  string
  height?: number
}

export function DividendBarChart({ data, color = 'bg-emerald-500', height = 96 }: Props) {
  const max = Math.max(...data.map(d => d.value), 0.01)
  const showEvery = data.length > 12 ? 3 : 1

  return (
    <div className="w-full">
      <div className="flex items-end gap-px" style={{ height }}>
        {data.map((bar) => {
          const pct = (bar.value / max) * 100
          return (
            <div
              key={bar.period}
              className="group relative flex flex-1 flex-col justify-end"
              style={{ height: '100%' }}
            >
              {bar.value > 0 && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 group-hover:block">
                  <div className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-center whitespace-nowrap shadow-lg">
                    <p className="text-[10px] text-zinc-400">{bar.label}</p>
                    <p className="text-xs font-bold text-emerald-400">
                      ${bar.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
              <div
                className={`${color} rounded-t-sm transition-all`}
                style={{ height: `${pct}%`, minHeight: bar.value > 0 ? 2 : 0 }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-px">
        {data.map((bar, i) => (
          <div key={bar.period} className="flex-1 text-center">
            {i % showEvery === 0 && (
              <span className="text-[8px] leading-none text-zinc-600">{bar.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
