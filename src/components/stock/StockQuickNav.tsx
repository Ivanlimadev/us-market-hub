'use client'
import { BarChart3, Coins, Building2, Calculator } from 'lucide-react'

/**
 * Investidor10-style quick-nav: a gold icon over each label, smooth-scrolling to
 * the matching section (ids set in StockDetailClient). Rendered inside the dark
 * header band, so colors use `neutral` (not remapped by the light-mode zinc
 * inversion in globals.css) to stay visible in both themes.
 */

const ITEMS: { label: string; id: string; Icon: typeof BarChart3 }[] = [
  { label: 'Indicators', id: 'indicators', Icon: BarChart3 },
  { label: 'Dividends', id: 'dividends', Icon: Coins },
  { label: 'Company', id: 'company', Icon: Building2 },
  { label: 'Results', id: 'results', Icon: Calculator },
]

export function StockQuickNav({ className = '' }: { className?: string }) {
  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={`flex items-center gap-7 overflow-x-auto sm:gap-9 ${className}`}>
      {ITEMS.map(({ label, id, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => go(id)}
          className="group flex shrink-0 flex-col items-center gap-1.5"
        >
          <Icon
            className="h-6 w-6 text-[#c8a45d] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110"
            strokeWidth={1.75}
          />
          <span className="text-sm font-semibold text-neutral-100 transition-colors group-hover:text-[#c8a45d]">
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
