'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useQuotes, type QuoteData } from '@/lib/hooks/useQuotes'
import { ChangeBadge } from '@/components/ui/change-badge'

interface StockTableProps {
  symbols: string[]
  title?: string
}

function LogoImg({ symbol }: { symbol: string }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
      <Image
        src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
        alt={symbol}
        width={32}
        height={32}
        className="object-contain"
        onError={(e) => {
          const t = e.target as HTMLImageElement
          t.style.display = 'none'
          t.parentElement!.innerHTML = `<span class="text-xs font-bold text-zinc-400">${symbol.slice(0, 2)}</span>`
        }}
        unoptimized
      />
    </div>
  )
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`
  return vol.toString()
}

export function StockTable({ symbols, title }: StockTableProps) {
  const { data: quotes, isLoading } = useQuotes(symbols)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {title && (
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-4 py-2.5 text-left font-medium">Symbol</th>
              <th className="px-4 py-2.5 text-right font-medium">Price</th>
              <th className="px-4 py-2.5 text-right font-medium">Change</th>
              <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Open</th>
              <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">High</th>
              <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Low</th>
              <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell">Volume</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? symbols.map((s) => (
                  <tr key={s} className="border-b border-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-800" />
                        <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
                      </div>
                    </td>
                    {[...Array(3)].map((_, i) => (
                      <td key={i} className="px-4 py-3">
                        <div className="ml-auto h-4 w-16 animate-pulse rounded bg-zinc-800" />
                      </td>
                    ))}
                  </tr>
                ))
              : (quotes ?? []).map((q: QuoteData) => (
                  <tr
                    key={q.symbol}
                    className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/stocks/${q.symbol}`} className="flex items-center gap-3">
                        <LogoImg symbol={q.symbol} />
                        <div>
                          <p className="font-semibold text-white">{q.symbol}</p>
                          <p className="max-w-[120px] truncate text-xs text-zinc-400">{q.name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      ${q.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeBadge value={q.changePct} />
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-zinc-400 sm:table-cell">
                      ${q.open.toFixed(2)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-zinc-400 sm:table-cell">
                      ${q.high.toFixed(2)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-zinc-400 sm:table-cell">
                      ${q.low.toFixed(2)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-zinc-400 md:table-cell">
                      {formatVolume(q.volume)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
