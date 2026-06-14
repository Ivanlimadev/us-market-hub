'use client'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface InsightResponse {
  insight: string
  cached: boolean
  verdict?: 'BUY' | 'HOLD' | 'SELL'
  confidence?: 'High' | 'Medium' | 'Low'
  summary?: string
  bull?: string
  bear?: string
}

const VERDICT_CONFIG = {
  BUY:  { label: 'BUY',  icon: TrendingUp,   bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  HOLD: { label: 'HOLD', icon: Minus,         bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  SELL: { label: 'SELL', icon: TrendingDown,  bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30' },
}

export function StockAIInsight({ symbol }: { symbol: string }) {
  const { data, isLoading, isError } = useQuery<InsightResponse>({
    queryKey: ['stock-ai-insight', symbol],
    queryFn: () => fetch(`/api/stocks/${symbol}/insight`).then((r) => r.json()),
    staleTime: 1000 * 60 * 60 * 4,
    retry: 1,
  })

  if (isError) return null

  const isStructured = data?.verdict != null
  const cfg = data?.verdict ? VERDICT_CONFIG[data.verdict] : null

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-zinc-200">AI Insight</h2>
        <span className="ml-auto rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
          Powered by Claude
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-3.5 w-full animate-pulse rounded bg-zinc-800 mt-4" />
          <div className="h-3.5 w-5/6 animate-pulse rounded bg-zinc-800" />
          <div className="h-3.5 w-4/6 animate-pulse rounded bg-zinc-800" />
        </div>
      ) : isStructured && cfg ? (
        <div className="space-y-4">
          {/* Verdict badge */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${cfg.bg} ${cfg.border}`}>
              <cfg.icon className={`h-4 w-4 ${cfg.text}`} />
              <span className={`text-base font-bold tracking-wide ${cfg.text}`}>{cfg.label}</span>
            </div>
            {data.confidence && (
              <span className="text-xs text-zinc-500">
                Confidence: <span className="text-zinc-400">{data.confidence}</span>
              </span>
            )}
          </div>

          {/* Summary */}
          {data.summary && (
            <p className="text-sm leading-relaxed text-zinc-300">{data.summary}</p>
          )}

          {/* Bull / Bear */}
          {(data.bull || data.bear) && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {data.bull && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-500">Bull Case</p>
                  <p className="text-xs leading-relaxed text-zinc-300">{data.bull}</p>
                </div>
              )}
              {data.bear && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-red-500">Bear Case</p>
                  <p className="text-xs leading-relaxed text-zinc-300">{data.bear}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Fallback for old plain-text cached insights
        <p className="text-sm leading-relaxed text-zinc-300">{data?.insight}</p>
      )}

      <p className="mt-4 text-[10px] text-zinc-600">
        AI-generated analysis for informational purposes only. Not financial advice.
      </p>
    </section>
  )
}
