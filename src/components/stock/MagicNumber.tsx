'use client'
import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

function detectFrequency(divs: Array<{ date: string }>): { perYear: number; label: string } {
  if (divs.length < 2) return { perYear: 4, label: 'quarter' }

  const sorted = divs
    .slice(0, Math.min(8, divs.length))
    .map((d) => new Date(d.date).getTime())
    .sort((a, b) => b - a)

  const gaps: number[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    gaps.push((sorted[i] - sorted[i + 1]) / 86_400_000)
  }
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length

  if (avg <= 35) return { perYear: 12, label: 'month' }
  if (avg <= 100) return { perYear: 4, label: 'quarter' }
  if (avg <= 200) return { perYear: 2, label: 'semester' }
  return { perYear: 1, label: 'year' }
}

function fmt$(n: number, decimals = 2) {
  return n.toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  })
}

interface Props { data: StockDetailData }

export function MagicNumber({ data }: Props) {
  const divs = data.dividends ?? []
  const price = data.currentPrice

  const result = useMemo(() => {
    if (!divs.length || price <= 0) return null
    const lastDiv = divs[0].dividend
    if (!lastDiv || lastDiv <= 0) return null

    const { perYear, label } = detectFrequency(divs)
    const magicNumber = Math.ceil(price / lastDiv)
    const totalInvested = magicNumber * price

    // How many new shares per year at this pace
    const annualNewShares = perYear

    return { lastDiv, magicNumber, totalInvested, perYear, label, annualNewShares }
  }, [divs, price])

  if (!result) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <div>
          <h3 className="text-sm font-semibold text-zinc-300">Magic Number</h3>
          <p className="text-xs text-zinc-500">Shares needed to self-fund your next purchase</p>
        </div>
      </div>

      {/* Formula */}
      <div className="px-5 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-5">
          {/* Price */}
          <div className="text-center">
            <p className="font-mono text-base font-bold text-white sm:text-lg">{fmt$(price)}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-500">Price</p>
          </div>

          <span className="text-xl font-light text-zinc-600">÷</span>

          {/* Last dividend */}
          <div className="text-center">
            <p className="font-mono text-base font-bold text-white sm:text-lg">{fmt$(result.lastDiv, 4)}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-500">
              Last div. <span className="text-zinc-600">({result.label}ly)</span>
            </p>
          </div>

          <span className="text-xl font-light text-zinc-600">=</span>

          {/* Magic number */}
          <div className="text-center">
            <p className="font-mono text-3xl font-extrabold text-emerald-400">
              {result.magicNumber.toLocaleString('en-US')}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-500">shares</p>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-5 rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-4 py-3">
          <p className="text-sm leading-relaxed text-zinc-300">
            Own{' '}
            <span className="font-bold text-white">{result.magicNumber.toLocaleString('en-US')} {data.symbol}</span>{' '}
            shares
            {' '}
            <span className="text-zinc-500">({fmt$(result.totalInvested)})</span>
            {' '}and each{' '}
            <span className="font-medium text-white">{result.label}ly</span> dividend pays for{' '}
            <span className="font-bold text-emerald-400">1 new share</span> —
            the snowball runs on its own.
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-zinc-800/50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">Investment target</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-white">
              {fmt$(result.totalInvested)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">New shares / year</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-emerald-400">
              +{result.annualNewShares} shares
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
