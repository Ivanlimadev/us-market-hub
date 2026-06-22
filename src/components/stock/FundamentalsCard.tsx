import type { StockDetailData } from '@/lib/hooks/useStockDetail'

function fmtLarge(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString()}`
}

function fmtPct(n: number | null): string {
  if (n === null) return '—'
  return `${(n * 100).toFixed(2)}%`
}

function fmtNum(n: number | null, decimals = 2): string {
  if (n === null) return '—'
  return n.toFixed(decimals)
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/60 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-200">{value}</span>
    </div>
  )
}

export function FundamentalsCard({ data }: { data: StockDetailData }) {
  const info = data.info
  const eod = data.latestEod

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300">Key Statistics</h3>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">Valuation</p>
        <Row label="Market Cap" value={fmtLarge(info?.marketCap ?? null)} />
        <Row label="P/E Ratio" value={fmtNum(info?.pe ?? null)} />
        <Row label="Forward P/E" value={fmtNum(info?.forwardPE ?? null)} />
        <Row label="P/B Ratio" value={fmtNum(info?.priceToBook ?? null)} />
        <Row label="PEG Ratio" value={fmtNum(info?.pegRatio ?? null)} />
        <Row label="EPS (TTM)" value={info?.eps !== null && info?.eps !== undefined ? `$${info.eps.toFixed(2)}` : '—'} />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">Trading</p>
        <Row label="Open" value={eod?.open != null ? `$${eod.open.toFixed(2)}` : '—'} />
        <Row label="Day High" value={eod?.high != null ? `$${eod.high.toFixed(2)}` : '—'} />
        <Row label="Day Low" value={eod?.low != null ? `$${eod.low.toFixed(2)}` : '—'} />
        <Row label="52W High" value={info?.week52High !== null && info?.week52High !== undefined ? `$${info.week52High.toFixed(2)}` : '—'} />
        <Row label="52W Low" value={info?.week52Low !== null && info?.week52Low !== undefined ? `$${info.week52Low.toFixed(2)}` : '—'} />
        <Row label="Volume" value={eod?.volume != null ? eod.volume.toLocaleString() : '—'} />
        <Row label="Avg Volume (3M)" value={info?.avgVolume3m ? info.avgVolume3m.toLocaleString() : '—'} />
        <Row label="Beta" value={fmtNum(info?.beta ?? null)} />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">Dividends</p>
        <Row label="Dividend Yield" value={info?.dividendYield ? `${(info.dividendYield * 100).toFixed(2)}%` : '—'} />
        <Row label="Annual Rate" value={info?.dividendRate ? `$${info.dividendRate.toFixed(2)}` : '—'} />
        <Row label="Ex-Div Date" value={info?.exDividendDate ?? '—'} />
        <Row label="Payout Ratio" value={fmtPct(info?.payoutRatio ?? null)} />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">Profitability</p>
        <Row label="Profit Margin" value={fmtPct(info?.profitMargin ?? null)} />
        <Row label="Operating Margin" value={fmtPct(info?.operatingMargin ?? null)} />
        <Row label="ROE" value={fmtPct(info?.roe ?? null)} />
        <Row label="ROA" value={fmtPct(info?.roa ?? null)} />
        <Row label="Revenue Growth" value={fmtPct(info?.revenueGrowth ?? null)} />
        <Row label="Earnings Growth" value={fmtPct(info?.earningsGrowth ?? null)} />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">Balance Sheet</p>
        <Row label="Total Revenue" value={fmtLarge(info?.totalRevenue ?? null)} />
        <Row label="Total Debt" value={fmtLarge(info?.totalDebt ?? null)} />
        <Row label="Debt / Equity" value={fmtNum(info?.debtToEquity ?? null)} />
        <Row label="Current Ratio" value={fmtNum(info?.currentRatio ?? null)} />
        <Row label="Free Cash Flow" value={fmtLarge(info?.freeCashflow ?? null)} />
      </div>
    </div>
  )
}
