'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, ArrowRight } from 'lucide-react'
import { runBacktest, type Bar, type BacktestResult } from '@/lib/backtest'

/**
 * A read-only "Backtest Snapshot" shown on stock pages: it runs one default
 * backtest ($10,000 buy & hold over ~10 years) and shows the headline result,
 * then links to the full /calculators/backtest tool to customize. Reuses the
 * shared runBacktest engine. Renders null on any failure/no-data so it can sit
 * safely inside a WidgetBoundary without ever breaking the page.
 */

const DEFAULT_AMOUNT = 10000

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

export function BacktestSnapshotCard({ symbol }: { symbol: string }) {
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'empty'>('loading')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=10y`)
        if (!res.ok) throw new Error('no data')
        const json = await res.json()
        const bars = (json.bars ?? []) as Bar[]
        const r = runBacktest(bars, { strategy: 'lumpSum', initial: DEFAULT_AMOUNT })
        if (!alive) return
        if (!r || r.finalValue <= 0) {
          setState('empty')
          return
        }
        setResult(r)
        setState('ready')
      } catch {
        if (alive) setState('empty')
      }
    })()
    return () => {
      alive = false
    }
  }, [symbol])

  // Silent when there is nothing meaningful to show.
  if (state === 'empty') return null

  const years = result ? Math.round(result.years) : 10

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#c8a45d]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#c8a45d]">Backtest Snapshot</span>
      </div>

      {state === 'loading' && (
        <div className="h-16 animate-pulse rounded-lg bg-zinc-800/50" />
      )}

      {state === 'ready' && result && (
        <>
          <p className="text-sm text-zinc-300">
            {usd(DEFAULT_AMOUNT)} invested in {symbol} and held for {years} year{years === 1 ? '' : 's'} would be worth{' '}
            <span className="font-bold text-[#c8a45d]">{usd(result.finalValue)}</span> today.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="Total Return" value={pct(result.returnPct)} good={result.returnPct >= 0} />
            <Metric label="Per Year (CAGR)" value={pct(result.cagr)} good={result.cagr >= 0} />
            <Metric label="Max Drawdown" value={`${result.maxDrawdown.toFixed(0)}%`} good={false} />
          </div>

          <MiniChart equity={result.equity} up={result.returnPct >= 0} />

          <Link
            href={`/calculators/backtest?symbol=${symbol.toLowerCase()}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#c8a45d] px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-[#d9b86e]"
          >
            Customize &amp; try strategies
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-2 text-[11px] text-zinc-600">
            Buy &amp; hold, dividend-adjusted. Excludes fees and taxes. Past performance does not guarantee future results.
          </p>
        </>
      )}
    </div>
  )
}

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  const color = good === true ? 'text-emerald-400' : good === false ? 'text-red-400' : 'text-zinc-100'
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`mt-0.5 text-base font-bold ${color}`}>{value}</div>
    </div>
  )
}

function MiniChart({ equity, up }: { equity: { value: number }[]; up: boolean }) {
  if (equity.length < 2) return null
  const W = 600
  const H = 64
  const pad = 2
  const vals = equity.map((p) => p.value)
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  const span = max - min || 1
  const d = equity
    .map((p, i) => {
      const x = pad + (i / (equity.length - 1)) * (W - 2 * pad)
      const y = H - pad - ((p.value - min) / span) * (H - 2 * pad)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const stroke = up ? '#34d399' : '#f87171'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  )
}
