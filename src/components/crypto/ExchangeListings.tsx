'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import type { ExchangeTicker } from '@/app/api/crypto/[id]/tickers/route'

function fmtVol(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function TrustDot({ score }: { score: 'green' | 'yellow' | 'red' }) {
  const cls =
    score === 'green'  ? 'bg-emerald-400' :
    score === 'yellow' ? 'bg-amber-400'   : 'bg-red-400'
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} title={`Trust: ${score}`} />
}

export function ExchangeListings({ coinId }: { coinId: string }) {
  const [logoFailed, setLogoFailed] = useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery<ExchangeTicker[]>({
    queryKey: ['crypto-tickers', coinId],
    queryFn:  () =>
      fetch(`/api/crypto/${coinId}/tickers`).then(r => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      }),
    staleTime: 9 * 60_000,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 animate-pulse">
        <div className="mb-4 h-3 w-24 rounded bg-zinc-800" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-zinc-800/50 py-2.5 last:border-0">
            <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-800" />
            <div className="h-3 flex-1 rounded bg-zinc-800" />
            <div className="h-3 w-16 rounded bg-zinc-800" />
            <div className="h-3 w-16 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    )
  }

  const empty = !isError && (!data || data.length === 0)

  if (isError || empty) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Where to Buy</h3>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-xs text-zinc-500">
            {isError ? 'Could not load exchange data' : 'No exchange listings available'}
          </p>
          {isError && (
            <button onClick={() => refetch()} className="text-[11px] text-emerald-400 hover:underline">
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Where to Buy</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500">
              <th className="pb-2 font-medium">Exchange</th>
              <th className="pb-2 font-medium">Pair</th>
              <th className="pb-2 text-right font-medium">Price</th>
              <th className="pb-2 text-right font-medium">24h Volume</th>
              <th className="pb-2 text-center font-medium">Trust</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {data!.map((t, i) => {
              const failed = logoFailed.has(t.identifier)
              return (
                <tr
                  key={`${t.identifier}-${t.target}-${i}`}
                  className="hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                        {t.logo && !failed ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.logo}
                            alt={t.exchange}
                            width={24}
                            height={24}
                            className="h-full w-full object-contain"
                            onError={() =>
                              setLogoFailed(prev => new Set([...prev, t.identifier]))
                            }
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-zinc-400">
                            {t.exchange.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="whitespace-nowrap font-semibold text-zinc-200">{t.exchange}</span>
                    </div>
                  </td>
                  <td className="py-2.5 font-mono text-zinc-400">{t.target}</td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-zinc-200">
                    ${t.price >= 1
                      ? t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : t.price.toFixed(6)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-zinc-400">{fmtVol(t.volume24h)}</td>
                  <td className="py-2.5 text-center">
                    <TrustDot score={t.trustScore} />
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    {t.tradeUrl ? (
                      <a
                        href={t.tradeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Buy <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] text-zinc-600">
        Data via CoinGecko · Trust score reflects liquidity and volume consistency
      </p>
    </div>
  )
}
