'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import type { SecFiling } from '@/app/api/stocks/filings/route'

const FORM_META: Record<string, { badge: string; border: string; label: string }> = {
  '10-K':    { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',    border: 'border-l-blue-500',    label: 'Annual Report' },
  '10-Q':    { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', border: 'border-l-emerald-500', label: 'Quarterly Report' },
  '8-K':     { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',  border: 'border-l-amber-500',   label: 'Material Event' },
  'DEF 14A': { badge: 'bg-violet-500/20 text-violet-400 border-violet-500/30', border: 'border-l-violet-500', label: 'Proxy Statement' },
}

function formatDate(d: string): string {
  if (!d) return '-'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function FilingCard({ f }: { f: SecFiling }) {
  const meta = FORM_META[f.form] ?? {
    badge: 'bg-zinc-700/40 text-zinc-400 border-zinc-700',
    border: 'border-l-zinc-600',
    label: f.form,
  }

  return (
    <a
      href={f.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col gap-1.5 rounded-lg border border-zinc-800 border-l-2 ${meta.border} bg-zinc-900/60 p-2 hover:bg-zinc-800/60 transition-colors`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={`shrink-0 rounded border px-1 py-px text-[9px] font-bold ${meta.badge}`}>
          {f.form}
        </span>
        <ExternalLink className="h-2.5 w-2.5 shrink-0 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
      </div>
      <p className="text-[10px] text-zinc-400 leading-snug line-clamp-1 group-hover:text-zinc-200 transition-colors">
        {f.description && f.description !== f.form ? f.description : meta.label}
      </p>
      <span className="text-[9px] text-zinc-600 tabular-nums">
        {formatDate(f.filingDate)}
        {f.reportDate && f.reportDate !== f.filingDate && ` · ${formatDate(f.reportDate)}`}
      </span>
    </a>
  )
}

export function SecFilings({ symbol }: { symbol: string }) {
  const [expanded, setExpanded] = useState(false)

  const { data, isLoading } = useQuery<SecFiling[]>({
    queryKey: ['sec-filings', symbol],
    queryFn:  () => fetch(`/api/stocks/filings?symbol=${symbol}`).then(r => r.json()),
    staleTime: 2 * 60 * 60_000,
    retry: 1,
  })

  const all = data ?? []
  const filtered = expanded ? all : all.slice(0, 8)
  const hasMore = all.length > 8

  // Don't render section if no filings found
  if (!isLoading && all.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-500" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">SEC Filings</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Official EDGAR documents</p>
          </div>
        </div>
        <a
          href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${symbol}&type=&dateb=&owner=include&count=40`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          All filings <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="p-4 grid grid-cols-2 gap-2 animate-pulse">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-20 rounded-lg bg-zinc-800" />)}
        </div>
      )}

      {/* Cards grid */}
      {!isLoading && (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((f, i) => <FilingCard key={i} f={f} />)}
          </div>
          {hasMore && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              {expanded
                ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
                : <><ChevronDown className="h-3.5 w-3.5" /> Show all {all.length} filings</>
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
