'use client'
import type { CryptoDetail } from '@/types/crypto'

function fmtSupply(n: number, sym: string): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T ${sym}`
  if (n >= 1e9)  return `${(n / 1e9).toFixed(2)}B ${sym}`
  if (n >= 1e6)  return `${(n / 1e6).toFixed(2)}M ${sym}`
  return `${n.toLocaleString()} ${sym}`
}

function fmtUSD(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString()}`
}

export function SupplyCard({ coin }: { coin: CryptoDetail }) {
  const md  = coin.market_data
  const sym = coin.symbol.toUpperCase()
  const { circulating_supply: circ, total_supply: total, max_supply: max } = md

  const reference  = max ?? total ?? circ
  const circPct    = reference > 0 ? (circ / reference) * 100 : 100
  const totalPct   = max && total ? (total / max) * 100 : null
  const fdv        = max ? md.current_price * max : null
  const mcFdvRatio = fdv && fdv > 0 ? (md.market_cap / fdv) * 100 : null

  const rows = [
    { label: 'Circulating Supply',    value: fmtSupply(circ, sym) },
    { label: 'Total Supply',          value: total ? fmtSupply(total, sym) : '∞' },
    { label: 'Max Supply',            value: max   ? fmtSupply(max,  sym) : '∞' },
    { label: 'Market Cap',            value: fmtUSD(md.market_cap) },
    ...(fdv        ? [{ label: 'Fully Diluted Val.', value: fmtUSD(fdv) }]                       : []),
    ...(mcFdvRatio ? [{ label: 'MC / FDV Ratio',     value: `${mcFdvRatio.toFixed(1)}%` }]       : []),
  ]

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Supply</h3>

      <div className="mb-4">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          {totalPct !== null && (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-500/40"
              style={{ width: `${totalPct}%` }}
            />
          )}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
            style={{ width: `${Math.min(100, circPct)}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-600">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Circulating
          </span>
          {totalPct !== null && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500/60" />
              Total
            </span>
          )}
          <span>Max</span>
        </div>
      </div>

      <div>
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between border-b border-zinc-800 py-2 last:border-0">
            <span className="text-xs text-zinc-500">{label}</span>
            <span className="text-xs font-semibold text-zinc-200 tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
