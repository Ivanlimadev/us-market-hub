'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface FeaturedAnalysisProps {
  symbol: string
  title: string
  excerpt: string
  href: string
  imageUrl?: string
}

/**
 * Featured analysis article card for specific stocks with deep-dive blog coverage
 * Currently used for NVDA and other major holdings
 */
export function FeaturedAnalysis({ symbol, title, excerpt, href, imageUrl }: FeaturedAnalysisProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent p-5 transition-all hover:border-emerald-500/50 hover:from-emerald-500/10"
    >
      {/* Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">In-Depth Analysis</span>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-zinc-400 line-clamp-2">
          {excerpt}
        </p>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
        <span className="text-xs font-semibold text-emerald-400">Read full analysis</span>
        <ArrowRight className="h-3.5 w-3.5 text-emerald-400 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
