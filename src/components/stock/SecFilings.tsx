'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText } from 'lucide-react'
import type { SecFiling } from '@/app/api/stocks/filings/route'

const FORM_COLORS: Record<string, string> = {
  '10-K':    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '10-Q':    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  '8-K':     'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'DEF 14A': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
}

const FILTERS = ['All', '10-K', '10-Q', '8-K', 'DEF 14A'] as const
type Filter = typeof FILTERS[number]

function formatDate(d: string): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function SecFilings({ symbol }: { symbol: string }) {
  const [filter, setFilter] = useState<Filter>('All')

  const { data, isLoading } = useQuery<SecFiling[]>({
    queryKey: ['sec-filings', symbol],
    queryFn:  () => fetch(`/api/stocks/filings?symbol=${symbol}`).then(r => r.json()),
    staleTime: 2 * 60 * 60_000,
    retry: 1,
  })

  const filtered = (data ?? []).filter(f => filter === 'All' || f.form === filter)

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

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-zinc-800 px-4 py-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              filter === f ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="p-4 space-y-2 animate-pulse">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 rounded bg-zinc-800" />)}
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <div className="divide-y divide-zinc-800/60">
          {filtered.length === 0 && (
            <p className="px-5 py-6 text-center text-xs text-zinc-500">No {filter} filings found.</p>
          )}
          {filtered.map((f, i) => (
            <a
              key={i}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${FORM_COLORS[f.form] ?? 'bg-zinc-700/40 text-zinc-400 border-zinc-700'}`}>
                  {f.form}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-zinc-300 truncate group-hover:text-white transition-colors">
                    {f.description || f.form}
                  </p>
                  {f.reportDate && f.reportDate !== f.filingDate && (
                    <p className="text-[10px] text-zinc-600 mt-0.5">Period ending {formatDate(f.reportDate)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-zinc-500 tabular-nums">{formatDate(f.filingDate)}</span>
                <ExternalLink className="h-3 w-3 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
