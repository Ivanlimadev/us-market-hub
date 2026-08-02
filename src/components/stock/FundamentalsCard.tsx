'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

function fmtLarge(n: number | null): string {
  if (n === null) return '-'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString()}`
}
function fmtPct(n: number | null): string {
  if (n === null) return '-'
  return `${(n * 100).toFixed(2)}%`
}
function fmtNum(n: number | null, decimals = 2): string {
  if (n === null) return '-'
  return n.toFixed(decimals)
}
const fmtPrice = (n: number | null | undefined) =>
  n != null ? `$${n.toFixed(2)}` : '-'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/60 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-200">{value}</span>
    </div>
  )
}

export function FundamentalsCard({ data }: { data: StockDetailData }) {
  const [showAll, setShowAll] = useState(false)
  const info = data.info
  const eod = data.latestEod

  const sections: { title: string; rows: { label: string; value: string }[] }[] = [
    {
      title: 'Valuation',
      rows: [
        { label: 'Market Cap', value: fmtLarge(info?.marketCap ?? null) },
        { label: 'P/E Ratio', value: fmtNum(info?.pe ?? null) },
        { label: 'Forward P/E', value: fmtNum(info?.forwardPE ?? null) },
        { label: 'P/B Ratio', value: fmtNum(info?.priceToBook ?? null) },
        { label: 'PEG Ratio', value: fmtNum(info?.pegRatio ?? null) },
        { label: 'EPS (TTM)', value: info?.eps != null ? `$${info.eps.toFixed(2)}` : '-' },
      ],
    },
    {
      title: 'Trading',
      rows: [
        { label: 'Open', value: fmtPrice(eod?.open) },
        { label: 'Day High', value: fmtPrice(eod?.high) },
        { label: 'Day Low', value: fmtPrice(eod?.low) },
        { label: '52W High', value: fmtPrice(info?.week52High) },
        { label: '52W Low', value: fmtPrice(info?.week52Low) },
        { label: 'Volume', value: eod?.volume != null ? eod.volume.toLocaleString() : '-' },
        { label: 'Avg Volume (3M)', value: info?.avgVolume3m ? info.avgVolume3m.toLocaleString() : '-' },
        { label: 'Beta', value: fmtNum(info?.beta ?? null) },
      ],
    },
    {
      title: 'Dividends',
      rows: [
        { label: 'Dividend Yield', value: info?.dividendYield ? `${(info.dividendYield * 100).toFixed(2)}%` : '-' },
        { label: 'Annual Rate', value: info?.dividendRate ? `$${info.dividendRate.toFixed(2)}` : '-' },
        { label: 'Ex-Div Date', value: info?.exDividendDate ?? '-' },
        { label: 'Payout Ratio', value: fmtPct(info?.payoutRatio ?? null) },
      ],
    },
    {
      title: 'Profitability',
      rows: [
        { label: 'Profit Margin', value: fmtPct(info?.profitMargin ?? null) },
        { label: 'Operating Margin', value: fmtPct(info?.operatingMargin ?? null) },
        { label: 'ROE', value: fmtPct(info?.roe ?? null) },
        { label: 'ROA', value: fmtPct(info?.roa ?? null) },
        { label: 'Revenue Growth', value: fmtPct(info?.revenueGrowth ?? null) },
        { label: 'Earnings Growth', value: fmtPct(info?.earningsGrowth ?? null) },
      ],
    },
    {
      title: 'Balance Sheet',
      rows: [
        { label: 'Total Revenue', value: fmtLarge(info?.totalRevenue ?? null) },
        { label: 'Total Debt', value: fmtLarge(info?.totalDebt ?? null) },
        { label: 'Debt / Equity', value: fmtNum(info?.debtToEquity ?? null) },
        { label: 'Current Ratio', value: fmtNum(info?.currentRatio ?? null) },
        { label: 'Free Cash Flow', value: fmtLarge(info?.freeCashflow ?? null) },
      ],
    },
  ]

  const total = sections.reduce((n, s) => n + s.rows.length, 0)
  const preview = sections.flatMap((s) => s.rows).slice(0, 5)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">Key Statistics</h3>

      {showAll ? (
        <div className="space-y-4">
          {sections.map((s) => (
            <div key={s.title}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">{s.title}</p>
              {s.rows.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}
            </div>
          ))}
        </div>
      ) : (
        <div>{preview.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}</div>
      )}

      <button
        onClick={() => setShowAll((v) => !v)}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-zinc-800/50"
      >
        {showAll ? 'Show less' : `See all ${total} statistics`}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}
