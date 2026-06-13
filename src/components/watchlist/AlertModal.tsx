'use client'
import { useState } from 'react'
import { X, Trash2, DollarSign, Percent } from 'lucide-react'
import { useWatchlistStore } from '@/lib/store/watchlist-store'
import { useWatchlistSync } from '@/lib/hooks/useWatchlistSync'
import type { PriceAlert } from '@/types/watchlist'

interface Props {
  symbol: string
  name: string
  asset_type: 'stock' | 'crypto'
  coingeckoId?: string
  image?: string
  currentPrice?: number
  onClose: () => void
}

type AlertMode = 'price' | 'pct'

function fmtPrice(n: number) {
  if (n >= 1)    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (n >= 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(8)}`
}

function AlertBadge({ alert }: { alert: PriceAlert }) {
  const isPct = alert.condition === 'change_up' || alert.condition === 'change_down'
  const isUp  = alert.condition === 'above' || alert.condition === 'change_up'

  const label = isPct
    ? `${isUp ? '▲' : '▼'} ${alert.targetPct?.toFixed(2)}%`
    : `${isUp ? '▲' : '▼'} ${fmtPrice(alert.targetPrice)}`

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
      isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
    }`}>
      {label}
    </span>
  )
}

export function AlertModal({
  symbol, name, asset_type, coingeckoId, image, currentPrice, onClose,
}: Props) {
  const { addAlert, removeAlert } = useWatchlistSync()
  const getAlertsForSymbol        = useWatchlistStore((s) => s.getAlertsForSymbol)
  const alerts                    = getAlertsForSymbol(symbol, asset_type)

  const [mode, setMode]           = useState<AlertMode>('price')
  const [priceDir, setPriceDir]   = useState<'above' | 'below'>('above')
  const [pctDir, setPctDir]       = useState<'change_up' | 'change_down'>('change_down')
  const [priceVal, setPriceVal]   = useState(currentPrice ? currentPrice.toFixed(2) : '')
  const [pctVal, setPctVal]       = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (mode === 'price') {
      const target = parseFloat(priceVal)
      if (isNaN(target) || target <= 0) return
      addAlert({
        symbol, name, asset_type, coingeckoId, image,
        condition: priceDir,
        targetPrice: target,
      })
      setPriceVal(currentPrice ? currentPrice.toFixed(2) : '')
    } else {
      const pct = parseFloat(pctVal)
      if (isNaN(pct) || pct <= 0 || !currentPrice) return
      addAlert({
        symbol, name, asset_type, coingeckoId, image,
        condition: pctDir,
        targetPrice: currentPrice,   // store ref price in targetPrice
        targetPct: pct,
        referencePrice: currentPrice,
      })
      setPctVal('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Price Alerts</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{symbol} · {name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Existing alerts */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Alerts</p>
              {alerts.map((alert: PriceAlert) => {
                const isPct = alert.condition === 'change_up' || alert.condition === 'change_down'
                return (
                  <div key={alert.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/50 px-3 py-2.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <AlertBadge alert={alert} />
                        {isPct && alert.referencePrice && (
                          <span className="text-[11px] text-zinc-500">
                            ref. {fmtPrice(alert.referencePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.triggered && (
                        <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                          ✓ Triggered
                        </span>
                      )}
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="rounded-lg p-1 text-zinc-600 hover:text-red-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* New alert form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">New Alert</p>

            {/* Mode toggle: Price | % Change */}
            <div className="flex rounded-xl border border-zinc-700 p-1 gap-1">
              <button
                type="button"
                onClick={() => setMode('price')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-all ${
                  mode === 'price'
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" /> Preço
              </button>
              <button
                type="button"
                onClick={() => setMode('pct')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-all ${
                  mode === 'pct'
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Percent className="h-3.5 w-3.5" /> Variação %
              </button>
            </div>

            {mode === 'price' ? (
              <>
                {/* Above / Below */}
                <div className="flex rounded-xl border border-zinc-700 p-1 gap-1">
                  {(['above', 'below'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPriceDir(c)}
                      className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                        priceDir === c
                          ? c === 'above'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {c === 'above' ? '▲ Acima de' : '▼ Abaixo de'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Preço alvo ($)
                  </label>
                  <input
                    required type="number" min="0.00000001" step="any"
                    value={priceVal}
                    onChange={(e) => setPriceVal(e.target.value)}
                    placeholder={currentPrice ? currentPrice.toFixed(2) : '0.00'}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                  {currentPrice && (
                    <p className="mt-1 text-[11px] text-zinc-600">Atual: {fmtPrice(currentPrice)}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Valorizar / Desvalorizar */}
                <div className="flex rounded-xl border border-zinc-700 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setPctDir('change_up')}
                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                      pctDir === 'change_up'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    ▲ Valorizar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPctDir('change_down')}
                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                      pctDir === 'change_down'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    ▼ Desvalorizar
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Variação (%)
                  </label>
                  <div className="relative">
                    <input
                      required type="number" min="0.01" max="9999" step="any"
                      value={pctVal}
                      onChange={(e) => setPctVal(e.target.value)}
                      placeholder="5"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">%</span>
                  </div>
                  {currentPrice && (
                    <p className="mt-1 text-[11px] text-zinc-600">
                      Referência: {fmtPrice(currentPrice)}
                      {pctVal && parseFloat(pctVal) > 0 && (
                        <span className={`ml-1 ${pctDir === 'change_up' ? 'text-emerald-600' : 'text-red-600'}`}>
                          → {fmtPrice(
                            pctDir === 'change_up'
                              ? currentPrice * (1 + parseFloat(pctVal) / 100)
                              : currentPrice * (1 - parseFloat(pctVal) / 100)
                          )}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              Criar Alerta
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
