'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { usePortfolioStore } from '@/lib/store/portfolio-store'

interface Props {
  onClose: () => void
}

export function AddTransactionModal({ onClose }: Props) {
  const addTransaction = usePortfolioStore((s) => s.addTransaction)
  const [form, setForm] = useState({
    symbol: '',
    type: 'buy' as 'buy' | 'sell',
    quantity: '',
    pricePerShare: '',
    date: new Date().toISOString().split('T')[0],
    fees: '0',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addTransaction({
      symbol: form.symbol.toUpperCase().trim(),
      type: form.type,
      quantity: parseFloat(form.quantity),
      pricePerShare: parseFloat(form.pricePerShare),
      date: form.date,
      fees: parseFloat(form.fees) || 0,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add Transaction</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-lg border border-zinc-700 p-1">
            {(['buy', 'sell'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 rounded-md py-1.5 text-sm font-semibold capitalize transition-colors ${
                  form.type === t
                    ? t === 'buy'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Symbol */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Ticker Symbol</label>
            <input
              required
              value={form.symbol}
              onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
              placeholder="e.g. AAPL"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm uppercase text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Shares</label>
              <input
                required
                type="number"
                min="0.0001"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                placeholder="10"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            {/* Price */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Price per Share ($)</label>
              <input
                required
                type="number"
                min="0.01"
                step="any"
                value={form.pricePerShare}
                onChange={(e) => setForm((f) => ({ ...f, pricePerShare: e.target.value }))}
                placeholder="150.00"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            {/* Fees */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Fees ($)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.fees}
                onChange={(e) => setForm((f) => ({ ...f, fees: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Total preview */}
          {form.quantity && form.pricePerShare && (
            <div className="rounded-lg bg-zinc-800 px-3 py-2 text-sm">
              <span className="text-zinc-400">Total cost: </span>
              <span className="font-semibold text-white">
                ${(parseFloat(form.quantity) * parseFloat(form.pricePerShare) + (parseFloat(form.fees) || 0)).toFixed(2)}
              </span>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  )
}
