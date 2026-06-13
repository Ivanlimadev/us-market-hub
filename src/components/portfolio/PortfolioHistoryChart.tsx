'use client'
import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { usePortfolioHistory, type HistoryPeriod, type PortfolioHistoryPoint } from '@/lib/hooks/usePortfolioHistory'

const PERIODS: { label: string; value: HistoryPeriod }[] = [
  { label: '1M',  value: '1M'  },
  { label: '3M',  value: '3M'  },
  { label: '6M',  value: '6M'  },
  { label: '1Y',  value: '1Y'  },
  { label: 'All', value: 'ALL' },
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

function HistoryCanvas({ points }: { points: PortfolioHistoryPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || points.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const PAD = { top: 12, bottom: 28, left: 0, right: 0 }
    const chartH = H - PAD.top - PAD.bottom
    const chartW = W - PAD.left - PAD.right

    const values = points.map((p) => p.value)
    const costs  = points.map((p) => p.cost)
    const minY   = Math.min(...values, ...costs) * 0.98
    const maxY   = Math.max(...values, ...costs) * 1.02
    const rangeY = maxY - minY || 1

    const toX = (i: number) => PAD.left + (i / (points.length - 1)) * chartW
    const toY = (v: number) => PAD.top + chartH - ((v - minY) / rangeY) * chartH

    ctx.clearRect(0, 0, W, H)

    const firstVal = points[0].value
    const lastVal  = points[points.length - 1].value
    const isUp     = lastVal >= firstVal
    const lineColor = isUp ? '#10b981' : '#ef4444'

    // --- Value area fill ---
    const grad = ctx.createLinearGradient(0, PAD.top, 0, H - PAD.bottom)
    grad.addColorStop(0, isUp ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.beginPath()
    points.forEach((p, i) => {
      const x = toX(i)
      const y = toY(p.value)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.lineTo(toX(points.length - 1), H - PAD.bottom)
    ctx.lineTo(toX(0), H - PAD.bottom)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // --- Value line ---
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = toX(i)
      const y = toY(p.value)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.stroke()

    // --- Cost basis line (dashed) ---
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = toX(i)
      const y = toY(p.cost)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = 'rgba(113,113,122,0.6)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 4])
    ctx.stroke()
    ctx.setLineDash([])

    // --- X-axis labels (5 evenly spaced dates) ---
    ctx.fillStyle = '#52525b'
    ctx.font = '10px ui-sans-serif,system-ui,sans-serif'
    ctx.textAlign = 'center'
    const labelIndices = [0, Math.floor(points.length * 0.25), Math.floor(points.length * 0.5), Math.floor(points.length * 0.75), points.length - 1]
    for (const idx of labelIndices) {
      const p = points[idx]
      const x = toX(idx)
      const d = new Date(p.date + 'T12:00:00Z')
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ctx.fillText(label, x, H - 6)
    }
  }, [points])

  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-xs text-zinc-600">Not enough data for the selected period</p>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: 180, display: 'block' }}
      width={900}
      height={220}
    />
  )
}

export function PortfolioHistoryChart() {
  const [period, setPeriod] = useState<HistoryPeriod>('3M')
  const { data, isLoading } = usePortfolioHistory(period)

  const first = data[0]
  const last  = data[data.length - 1]
  const gain  = first && last ? last.value - first.value : null
  const gainPct = first && last && first.value > 0
    ? ((last.value - first.value) / first.value) * 100
    : null
  const isUp = (gainPct ?? 0) >= 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">Portfolio History</h3>
          {gain != null && gainPct != null && !isLoading && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              isUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isUp ? '+' : ''}{fmt(gain)} ({isUp ? '+' : ''}{gainPct.toFixed(2)}%)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === value
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-3 pb-1">
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-lg bg-zinc-800/50" />
        ) : (
          <HistoryCanvas points={data} />
        )}
      </div>

      {/* Legend */}
      {!isLoading && data.length > 1 && (
        <div className="flex items-center gap-4 px-4 pb-3 pt-1">
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 rounded bg-emerald-400" />
            <span className="text-[11px] text-zinc-500">Portfolio Value</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-px w-4 border-t border-dashed border-zinc-600" />
            <span className="text-[11px] text-zinc-500">Cost Basis</span>
          </div>
          {last && (
            <div className="ml-auto text-[11px] text-zinc-500">
              Current: <span className="font-semibold text-zinc-200">{fmt(last.value)}</span>
              {' '}· Invested: <span className="font-semibold text-zinc-200">{fmt(last.cost)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
