'use client'
import type { ReactNode } from 'react'
import { useStockDetail, useStockHistory, type StockDetailData } from '@/lib/hooks/useStockDetail'
import { ChangeBadge } from '@/components/ui/change-badge'

/**
 * Investidor10-style key-stats strip: a row of cards, each with a dark header
 * band (gold uppercase label + help tooltip) over a big bold value. Mirrors the
 * five headline cards on investidor10.com.br/stocks/[symbol], adapted to the US
 * market (English labels, USD).
 */

function StatCard({
  label,
  help,
  children,
}: {
  label: string
  help: string
  children: ReactNode
}) {
  return (
    // Colors written in the site's dark-theme idiom (globals.css inverts the zinc
    // palette in light mode). The header band uses `neutral` (not remapped) so it
    // stays dark in both themes — the Investidor10 look. No `overflow-hidden` here
    // so the ? tooltip can spill below the card; corners are rounded per-band.
    <div className="rounded-xl border border-zinc-800 shadow-sm">
      <div className="flex items-center justify-center gap-1.5 rounded-t-xl bg-neutral-800 px-2 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c8a45d]">
          {label}
        </span>
        <span className="group/tip relative flex">
          <span
            aria-label={help}
            className="flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full border border-neutral-500 text-[9px] leading-none text-neutral-400"
          >
            ?
          </span>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 hidden w-44 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-center text-[11px] font-normal normal-case leading-snug tracking-normal text-neutral-200 shadow-xl group-hover/tip:block"
          >
            {help}
          </span>
        </span>
      </div>
      <div className="flex min-h-[70px] flex-col items-center justify-center gap-1 rounded-b-xl bg-zinc-900 px-2 py-3">
        {children}
      </div>
    </div>
  )
}

function BigValue({ children }: { children: ReactNode }) {
  return (
    <span className="text-2xl font-bold tabular-nums text-white">{children}</span>
  )
}

const DASH = <span className="text-2xl font-bold text-zinc-500">—</span>

export function KeyStatsStrip({
  symbol,
  initialData,
}: {
  symbol: string
  initialData?: StockDetailData
}) {
  const { data } = useStockDetail(symbol, initialData)
  const { data: history } = useStockHistory(symbol, '1y')

  if (!data) return null

  const info = data.info

  // 1Y change from the first vs. last close of the 1-year daily series.
  const bars = history?.bars ?? []
  const firstClose = bars.length ? bars[0].close : null
  const lastClose = bars.length ? bars[bars.length - 1].close : null
  const change1y =
    firstClose && firstClose > 0 && lastClose != null
      ? ((lastClose - firstClose) / firstClose) * 100
      : null

  const pe = info?.pe
  const dy = info?.dividendYield

  // Last dividend = the most recent dividend paid per share (newest by date).
  const divs = data.dividends ?? []
  const lastDiv = divs.length
    ? [...divs].sort((a, b) => (a.date < b.date ? 1 : -1))[0].dividend
    : null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label="Price"
        help="Current share price and today's change versus the previous close."
      >
        <BigValue>${data.currentPrice.toFixed(2)}</BigValue>
        <ChangeBadge value={data.changePct} size="sm" />
      </StatCard>

      <StatCard
        label="1Y Change"
        help="How much the share price has moved over the last 12 months."
      >
        {change1y != null ? (
          <ChangeBadge value={change1y} size="md" />
        ) : (
          DASH
        )}
      </StatCard>

      <StatCard
        label="P/E"
        help="Price-to-earnings: the share price divided by earnings per share. How many years of current profit you pay for the stock."
      >
        {pe != null && pe > 0 ? <BigValue>{pe.toFixed(2)}</BigValue> : DASH}
      </StatCard>

      <StatCard
        label="Last Dividend"
        help="The most recent dividend paid per share by the company."
      >
        {lastDiv != null && lastDiv > 0 ? <BigValue>${lastDiv.toFixed(2)}</BigValue> : DASH}
      </StatCard>

      <StatCard
        label="Div Yield"
        help="Annual dividends as a percentage of the current share price."
      >
        {dy != null && dy > 0 ? <BigValue>{(dy * 100).toFixed(2)}%</BigValue> : DASH}
      </StatCard>
    </div>
  )
}
