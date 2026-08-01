'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Award, TrendingUp } from 'lucide-react'

type CAQuote = { symbol: string; name: string; price: number; changePct: number }

function Logo({ sym }: { sym: string }) {
  const base = sym.replace('.TO', '')
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
      <Image
        src={`https://assets.parqet.com/logos/symbol/${base}?format=png`}
        alt={sym}
        width={28}
        height={28}
        className="object-contain"
        unoptimized
        onError={(e) => {
          const t = e.target as HTMLImageElement
          t.style.display = 'none'
          if (t.parentElement)
            t.parentElement.innerHTML = `<span class="text-[10px] font-bold text-zinc-400">${base.slice(0, 2)}</span>`
        }}
      />
    </div>
  )
}

const cad = (n: number) =>
  `C$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Biggest TSX companies by market cap (fixed order for the "top" list).
const TOP = ['RY.TO', 'TD.TO', 'SHOP.TO', 'BN.TO', 'ENB.TO', 'BMO.TO', 'CNR.TO', 'BNS.TO', 'CP.TO', 'ATD.TO']

function Card({
  title,
  icon: Icon,
  color,
  rows,
}: {
  title: string
  icon: React.ElementType
  color: string
  rows: CAQuote[]
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        </div>
        <Link href="/stocks" className="text-[11px] text-zinc-500 transition-colors hover:text-zinc-300">
          See more →
        </Link>
      </div>
      <div className="flex-1 divide-y divide-zinc-800/50">
        {rows.map((q, i) => {
          const up = q.changePct >= 0
          return (
            <Link
              key={q.symbol}
              href={`/stocks/${q.symbol.toLowerCase()}`}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-800/40"
            >
              <span className="w-4 text-center text-[10px] font-bold text-zinc-600">{i + 1}</span>
              <Logo sym={q.symbol} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">
                  {q.symbol.replace('.TO', '')}
                  <span className="text-zinc-600">.TO</span>
                </p>
                <p className="truncate text-[10px] text-zinc-500">{q.name}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-white">{cad(q.price)}</p>
                <p className={`text-[10px] ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {up ? '+' : ''}
                  {q.changePct.toFixed(2)}%
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function CanadaSection() {
  const { data } = useQuery<CAQuote[]>({
    queryKey: ['canada'],
    queryFn: () => fetch('/api/canada').then((r) => r.json()),
    staleTime: 60_000,
  })

  const list = Array.isArray(data) ? data : []
  if (!list.length) return null

  const bySym: Record<string, CAQuote> = Object.fromEntries(list.map((q) => [q.symbol, q]))
  const top = TOP.map((s) => bySym[s]).filter(Boolean) as CAQuote[]
  const gainers = [...list].sort((a, b) => b.changePct - a.changePct).slice(0, 10)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>🇨🇦</span>
        <h2 className="text-lg font-bold text-white">Canadian Markets</h2>
        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
          TSX · CAD
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Top Canadian Stocks" icon={Award} color="text-[#c8a45d]" rows={top} />
        <Card title="Top TSX Gainers" icon={TrendingUp} color="text-emerald-400" rows={gainers} />
      </div>
    </div>
  )
}
