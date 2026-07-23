'use client'

/**
 * Investidor10-style anchor bar under the stock header. Smooth-scrolls to the
 * matching section on the same page. Section ids are set in StockDetailClient.
 */

const ITEMS: { label: string; id: string }[] = [
  { label: 'Indicators', id: 'indicators' },
  { label: 'Dividends', id: 'dividends' },
  { label: 'Company', id: 'company' },
  { label: 'Results', id: 'results' },
]

export function StockQuickNav() {
  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-zinc-800 py-2.5">
      {ITEMS.map(({ label, id }) => (
        <button
          key={id}
          type="button"
          onClick={() => go(id)}
          className="text-sm font-semibold text-zinc-400 transition-colors hover:text-[#c8a45d]"
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
