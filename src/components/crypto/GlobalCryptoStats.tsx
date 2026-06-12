'use client'
import { useQuery } from '@tanstack/react-query'
import type { CryptoGlobal } from '@/types/crypto'

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString('en-US')}`
}

interface StatCardProps {
  label: string
  value: string
  subColor?: string
  subText?: string
}

function StatCard({ label, value, subColor, subText }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-lg font-bold text-white">{value}</span>
      {subText && (
        <span className={`text-[11px] ${subColor ?? 'text-zinc-500'}`}>{subText}</span>
      )}
    </div>
  )
}

export function GlobalCryptoStats() {
  const { data, isLoading } = useQuery<CryptoGlobal>({
    queryKey: ['crypto-global'],
    queryFn: () => fetch('/api/crypto/global').then((r) => r.json()),
    staleTime: 4 * 60_000,
    refetchInterval: 5 * 60_000,
  })

  const chg = data?.market_cap_change_percentage_24h ?? 0
  const chgColor = chg >= 0 ? 'text-emerald-400' : 'text-red-400'

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-800/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="Market Cap"
        value={fmt(data?.total_market_cap_usd ?? 0)}
        subColor={chgColor}
        subText={`${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% 24h`}
      />
      <StatCard label="24h Volume" value={fmt(data?.total_volume_usd ?? 0)} />
      <StatCard label="BTC Dominance" value={`${(data?.btc_dominance ?? 0).toFixed(1)}%`} />
      <StatCard label="ETH Dominance" value={`${(data?.eth_dominance ?? 0).toFixed(1)}%`} />
      <StatCard label="Active Coins" value={(data?.active_cryptocurrencies ?? 0).toLocaleString()} />
      <StatCard label="Exchanges" value={(data?.markets ?? 0).toLocaleString()} />
    </div>
  )
}
