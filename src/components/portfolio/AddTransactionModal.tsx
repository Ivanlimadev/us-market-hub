'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { usePortfolioStore } from '@/lib/store/portfolio-store'
import { SymbolSearch } from './SymbolSearch'
import type { AssetSuggestion } from './SymbolSearch'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

interface Props {
  onClose: () => void
  defaultSymbol?: string
  defaultName?: string
}

function SelectedAssetCard({ symbol, name, onClear }: { symbol: string; name: string; onClear: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3">
      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-zinc-800 overflow-hidden">
        <Image
          src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
          alt={symbol} width={40} height={40} className="object-contain" unoptimized
          onError={(e) => {
            const t = e.target as HTMLImageElement
            t.style.display = 'none'
            if (t.parentElement)
              t.parentElement.innerHTML = `<span class="text-sm font-bold text-zinc-400">${symbol.slice(0, 2)}</span>`
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-emerald-400 tracking-wide">{symbol}</p>
        <p className="truncate text-xs text-zinc-400">{name}</p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-white transition-colors"
        title="Change asset"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function AddTransactionModal({ onClose, defaultSymbol, defaultName }: Props) {
  const addTransaction = usePortfolioStore((s) => s.addTransaction)
  const queryClient    = useQueryClient()

  const [selectedAsset, setSelectedAsset] = useState<AssetSuggestion | null>(
    defaultSymbol ? { symbol: defaultSymbol, name: defaultName ?? defaultSymbol } : null
  )
  const [priceSuggestion, setPriceSuggestion] = useState<string>('')

  const [form, setForm] = useState({
    type:          'buy' as 'buy' | 'sell',
    quantity:      '',
    pricePerShare: '',
    date:          new Date().toISOString().split('T')[0],
    fees:          '0',
  })

  // Fetch current price whenever selected asset changes
  useEffect(() => {
    const sym = selectedAsset?.symbol
    if (!sym) { setPriceSuggestion(''); return }

    // 1. Try screener cache first (instant, no network)
    const cached = queryClient.getQueryData<YFBatchQuote[]>(['screener'])
    const hit = cached?.find(q => q.symbol === sym)
    if (hit?.price) {
      const p = hit.price.toFixed(2)
      setPriceSuggestion(p)
      setForm(f => ({ ...f, pricePerShare: p }))
      return
    }

    // 2. Fetch lightweight stock quote
    fetch(`/api/stocks/${sym}`)
      .then(r => r.json())
      .then(d => {
        const price = d?.currentPrice
        if (typeof price === 'number' && price > 0) {
          const p = price.toFixed(2)
          setPriceSuggestion(p)
          setForm(f => ({ ...f, pricePerShare: p }))
        }
      })
      .catch(() => {})
  }, [selectedAsset?.symbol, queryClient])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAsset) return
    addTransaction({
      symbol:        selectedAsset.symbol,
      type:          form.type,
      quantity:      parseFloat(form.quantity),
      pricePerShare: parseFloat(form.pricePerShare),
      date:          form.date,
      fees:          parseFloat(form.fees) || 0,
    })
    onClose()
  }

  const total = form.quantity && form.pricePerShare
    ? parseFloat(form.quantity) * parseFloat(form.pricePerShare) + (parseFloat(form.fees) || 0)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-semibold text-white">Add Asset</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Asset selection */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Asset
            </label>
            {selectedAsset ? (
              <SelectedAssetCard
                symbol={selectedAsset.symbol}
                name={selectedAsset.name}
                onClear={defaultSymbol ? () => {} : () => {
                  setSelectedAsset(null)
                  setPriceSuggestion('')
                  setForm(f => ({ ...f, pricePerShare: '' }))
                }}
              />
            ) : (
              <SymbolSearch onSelect={setSelectedAsset} />
            )}
          </div>

          {/* Transaction fields — show after asset is selected */}
          {selectedAsset && (
            <>
              {/* Buy / Sell toggle */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Transaction type
                </label>
                <div className="flex rounded-xl border border-zinc-700 p-1 gap-1">
                  {(['buy', 'sell'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`flex-1 rounded-lg py-2 text-sm font-bold capitalize transition-all ${
                        form.type === t
                          ? t === 'buy'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {t === 'buy' ? '▲ Buy' : '▼ Sell'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Shares
                  </label>
                  <input
                    required type="number" min="0.0001" step="any"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    placeholder="10"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Price / Share ($)
                    </label>
                    {priceSuggestion && form.pricePerShare !== priceSuggestion && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, pricePerShare: priceSuggestion }))}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        ↺ use ${priceSuggestion}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      required type="number" min="0.01" step="any"
                      value={form.pricePerShare}
                      onChange={(e) => setForm((f) => ({ ...f, pricePerShare: e.target.value }))}
                      placeholder={priceSuggestion || '150.00'}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                    {priceSuggestion && form.pricePerShare === priceSuggestion && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500/70">
                        current
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Date
                  </label>
                  <input
                    type="date" required
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Fees ($)
                  </label>
                  <input
                    type="number" min="0" step="any"
                    value={form.fees}
                    onChange={(e) => setForm((f) => ({ ...f, fees: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Total preview */}
              {total !== null && (
                <div className="flex items-center justify-between rounded-xl bg-zinc-800/60 px-4 py-3">
                  <span className="text-xs font-medium text-zinc-400">Total cost</span>
                  <span className={`text-sm font-bold tabular-nums ${form.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all shadow-lg ${
                  form.type === 'buy'
                    ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                    : 'bg-red-500 hover:bg-red-400 shadow-red-500/20'
                }`}
              >
                {form.type === 'buy' ? '▲ Record Buy' : '▼ Record Sell'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
