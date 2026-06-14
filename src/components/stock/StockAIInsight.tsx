'use client'
import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'

export function StockAIInsight({ symbol }: { symbol: string }) {
  const { data, isLoading, isError } = useQuery<{ insight: string; cached: boolean }>({
    queryKey: ['stock-ai-insight', symbol],
    queryFn: () => fetch(`/api/stocks/${symbol}/insight`).then((r) => r.json()),
    staleTime: 1000 * 60 * 60 * 4,
    retry: 1,
  })

  if (isError) return null

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-zinc-200">AI Insight</h2>
        <span className="ml-auto rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
          Powered by Claude
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-zinc-800" />
          <div className="h-3.5 w-5/6 animate-pulse rounded bg-zinc-800" />
          <div className="h-3.5 w-4/6 animate-pulse rounded bg-zinc-800" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-zinc-300">{data?.insight}</p>
      )}

      <p className="mt-3 text-[10px] text-zinc-600">
        AI-generated analysis for informational purposes only. Not financial advice.
      </p>
    </section>
  )
}
