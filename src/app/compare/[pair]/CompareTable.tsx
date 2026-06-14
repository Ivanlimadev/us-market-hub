'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Dimension {
  label: string
  aValue: string
  bValue: string
  winner: 'a' | 'b' | 'tie'
  note: string
}

const INITIAL_ROWS = 4

export function CompareTable({
  dimensions,
  aSymbol,
  bSymbol,
}: {
  dimensions: Dimension[]
  aSymbol: string
  bSymbol: string
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? dimensions : dimensions.slice(0, INITIAL_ROWS)
  const hidden = dimensions.length - INITIAL_ROWS

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] bg-zinc-900 border-b border-zinc-800">
        <div className="p-3 text-xs font-semibold text-zinc-500 uppercase tracking-widest">Metric</div>
        <div className="p-3 text-xs font-semibold text-zinc-200 text-center min-w-[90px]">{aSymbol}</div>
        <div className="p-3 text-xs font-semibold text-zinc-200 text-center min-w-[90px]">{bSymbol}</div>
        <div className="p-3 text-xs font-semibold text-zinc-500 uppercase tracking-widest text-center min-w-[70px]">Edge</div>
      </div>

      {visible.map((dim, i) => (
        <div
          key={dim.label}
          className={`grid grid-cols-[1fr_auto_auto_auto] border-b border-zinc-800 last:border-0 ${i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/40'}`}
        >
          <div className="p-3">
            <p className="text-sm font-medium text-zinc-300">{dim.label}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{dim.note}</p>
          </div>
          <div className={`p-3 flex items-center justify-center min-w-[90px] ${dim.winner === 'a' ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}`}>
            <span className="text-sm text-center">{dim.aValue}</span>
          </div>
          <div className={`p-3 flex items-center justify-center min-w-[90px] ${dim.winner === 'b' ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}`}>
            <span className="text-sm text-center">{dim.bValue}</span>
          </div>
          <div className="p-3 flex items-center justify-center min-w-[70px]">
            {dim.winner === 'tie' ? (
              <span className="text-xs text-zinc-600">Tie</span>
            ) : (
              <span className="text-xs font-semibold text-emerald-400">
                {dim.winner === 'a' ? aSymbol : bSymbol}
              </span>
            )}
          </div>
        </div>
      ))}

      {hidden > 0 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex w-full items-center justify-center gap-2 border-t border-zinc-800 bg-zinc-900/60 py-3 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> Show {hidden} more metric{hidden > 1 ? 's' : ''}</>
          )}
        </button>
      )}
    </div>
  )
}
