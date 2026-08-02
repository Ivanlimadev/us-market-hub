'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, Search, Loader2, ChevronRight, Bitcoin } from 'lucide-react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { usePortfolioSync } from '@/lib/hooks/usePortfolioSync'
import { SymbolSearch } from './SymbolSearch'
import type { AssetSuggestion } from './SymbolSearch'
import type { YFBatchQuote } from '@/lib/yahoo-finance'
import type { CryptoMarket } from '@/types/crypto'
import type { AssetType } from '@/types/portfolio'

interface Props {
  onClose: () => void
  defaultSymbol?: string
  defaultName?: string
  defaultAssetType?: AssetType
  defaultCoingeckoId?: string
  defaultImage?: string
}

// ── Crypto inline search ──────────────────────────────────────────────────────
function CryptoSearch({ onSelect }: { onSelect: (asset: AssetSuggestion) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const inputRef          = useRef<HTMLInputElement>(null)

  const { data: markets, isLoading } = useQuery<CryptoMarket[]>({
    queryKey: ['crypto-markets'],
    queryFn: () => fetch('/api/crypto/markets?limit=250').then((r) => r.json()),
    staleTime: 55_000,
  })

  const q = query.toLowerCase()
  const suggestions = (markets ?? [])
    .filter((c) =>
      !q ||
      c.symbol.toLowerCase().startsWith(q) ||
      c.name.toLowerCase().includes(q)
    )
    .slice(0, 8)

  function fmtPrice(n: number) {
    if (n >= 1)    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (n >= 0.01) return `$${n.toFixed(4)}`
    return `$${n.toFixed(8)}`
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex items-center gap-2 rounded-xl border bg-zinc-800 px-3 py-2.5 transition-all ${
        open ? 'border-emerald-500 ring-1 ring-emerald-500/25' : 'border-zinc-700'
      }`}>
        <Search className="h-4 w-4 shrink-0 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search crypto (BTC, ETH, SOL…)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="flex-1 bg-transparent text-sm font-medium text-white placeholder-zinc-500 focus:outline-none tracking-wide"
          autoComplete="off"
          spellCheck={false}
        />
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500 shrink-0" />}
        {query && !isLoading && (
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQuery(''); inputRef.current?.focus() }}>
            <X className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300 transition-colors" />
          </button>
        )}
      </div>

      {open && (
        <div className="overflow-hidden rounded-2xl border border-zinc-700/70 bg-zinc-900 shadow-xl shadow-black/40">
          <div className="border-b border-zinc-800 px-4 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {query ? `Results for "${query.toUpperCase()}"` : 'Top cryptocurrencies'}
            </p>
          </div>
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {suggestions.map((coin) => (
              <button
                key={coin.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect({
                  symbol: coin.symbol.toUpperCase(),
                  name: coin.name,
                  asset_type: 'crypto',
                  coingeckoId: coin.id,
                  image: coin.image,
                })}
                className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/60 transition-colors text-left"
              >
                <Image src={coin.image} alt={coin.name} width={32} height={32} className="rounded-full shrink-0" unoptimized />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-wide text-emerald-400">
                      {coin.symbol.toUpperCase()}
                    </span>
                    <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/15">
                      #{coin.market_cap_rank}
                    </span>
                  </div>
                  <p className="truncate text-xs text-zinc-400 mt-0.5">{coin.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-zinc-300">{fmtPrice(coin.current_price)}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-700" />
              </button>
            ))}
            {!isLoading && suggestions.length === 0 && query.length >= 1 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-zinc-500">No results for <span className="font-semibold text-zinc-300">"{query.toUpperCase()}"</span></p>
              </div>
            )}
          </div>
          <div className="border-t border-zinc-800 px-4 py-2">
            <p className="text-[10px] text-zinc-600">Top 250 by market cap · CoinGecko</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Selected asset card ───────────────────────────────────────────────────────
function SelectedAssetCard({ asset, onClear }: { asset: AssetSuggestion; onClear: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3">
      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-zinc-800 overflow-hidden">
        {asset.image ? (
          <Image src={asset.image} alt={asset.symbol} width={40} height={40} className="rounded-full object-contain" unoptimized />
        ) : (
          <Image
            src={`https://assets.parqet.com/logos/symbol/${asset.symbol}?format=png`}
            alt={asset.symbol} width={40} height={40} className="object-contain" unoptimized
            onError={(e) => {
              const t = e.target as HTMLImageElement
              t.style.display = 'none'
              if (t.parentElement)
                t.parentElement.innerHTML = `<span class="text-sm font-bold text-zinc-400">${asset.symbol.slice(0, 2)}</span>`
            }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-emerald-400 tracking-wide">{asset.symbol}</p>
          {asset.asset_type === 'crypto' && (
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">Crypto</span>
          )}
        </div>
        <p className="truncate text-xs text-zinc-400">{asset.name}</p>
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

// ── Main component ────────────────────────────────────────────────────────────
export function AddTransactionModal({ onClose, defaultSymbol, defaultName, defaultAssetType, defaultCoingeckoId, defaultImage }: Props) {
  const { addTransaction } = usePortfolioSync()
  const queryClient        = useQueryClient()

  const [assetType, setAssetType] = useState<AssetType>(defaultAssetType ?? 'stock')
  const [selectedAsset, setSelectedAsset] = useState<AssetSuggestion | null>(
    defaultSymbol
      ? {
          symbol: defaultSymbol,
          name: defaultName ?? defaultSymbol,
          asset_type: defaultAssetType,
          coingeckoId: defaultCoingeckoId,
          image: defaultImage,
        }
      : null
  )
  const [priceSuggestion, setPriceSuggestion] = useState<string>('')

  const [form, setForm] = useState({
    type:          'buy' as 'buy' | 'sell',
    quantity:      '',
    pricePerShare: '',
    date:          new Date().toISOString().split('T')[0],
    fees:          '0',
  })

  // Fetch current price when asset changes
  useEffect(() => {
    const asset = selectedAsset
    if (!asset) { setPriceSuggestion(''); return }

    if (asset.asset_type === 'crypto') {
      // Use cached crypto markets data
      const cached = queryClient.getQueryData<CryptoMarket[]>(['crypto-markets'])
      const hit = cached?.find((c) => c.id === asset.coingeckoId)
      if (hit?.current_price) {
        const p = hit.current_price >= 1
          ? hit.current_price.toFixed(2)
          : hit.current_price.toFixed(8)
        setPriceSuggestion(p)
        setForm((f) => ({ ...f, pricePerShare: p }))
      }
      return
    }

    // Stock: try screener cache first
    const cached = queryClient.getQueryData<YFBatchQuote[]>(['screener'])
    const hit = cached?.find((q) => q.symbol === asset.symbol)
    if (hit?.price) {
      const p = hit.price.toFixed(2)
      setPriceSuggestion(p)
      setForm((f) => ({ ...f, pricePerShare: p }))
      return
    }

    fetch(`/api/stocks/${asset.symbol}`)
      .then((r) => r.json())
      .then((d) => {
        const price = d?.currentPrice
        if (typeof price === 'number' && price > 0) {
          const p = price.toFixed(2)
          setPriceSuggestion(p)
          setForm((f) => ({ ...f, pricePerShare: p }))
        }
      })
      .catch(() => {})
  }, [selectedAsset?.symbol, selectedAsset?.asset_type, queryClient]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAssetTypeChange(type: AssetType) {
    setAssetType(type)
    setSelectedAsset(null)
    setPriceSuggestion('')
    setForm((f) => ({ ...f, pricePerShare: '' }))
  }

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
      asset_type:    selectedAsset.asset_type ?? assetType,
      coingeckoId:   selectedAsset.coingeckoId,
    })
    onClose()
  }

  const total = form.quantity && form.pricePerShare
    ? parseFloat(form.quantity) * parseFloat(form.pricePerShare) + (parseFloat(form.fees) || 0)
    : null

  const isCrypto = (selectedAsset?.asset_type ?? assetType) === 'crypto'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-semibold text-white">Add Asset</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Asset type toggle - only show when no default symbol and no default type locked in */}
          {!defaultSymbol && !defaultAssetType && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Asset type
              </label>
              <div className="flex rounded-xl border border-zinc-700 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => handleAssetTypeChange('stock')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-all ${
                    assetType === 'stock'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  📈 Stock / ETF
                </button>
                <button
                  type="button"
                  onClick={() => handleAssetTypeChange('crypto')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-all ${
                    assetType === 'crypto'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Bitcoin className="h-4 w-4" /> Crypto
                </button>
              </div>
            </div>
          )}

          {/* Asset selection */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Asset
            </label>
            {selectedAsset ? (
              <SelectedAssetCard
                asset={selectedAsset}
                onClear={defaultSymbol ? () => {} : () => {
                  setSelectedAsset(null)
                  setPriceSuggestion('')
                  setForm((f) => ({ ...f, pricePerShare: '' }))
                }}
              />
            ) : assetType === 'crypto' ? (
              <CryptoSearch onSelect={(asset) => { setSelectedAsset(asset); setAssetType('crypto') }} />
            ) : (
              <SymbolSearch onSelect={(asset) => { setSelectedAsset(asset); setAssetType('stock') }} />
            )}
          </div>

          {/* Transaction fields - show after asset is selected */}
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
                    {isCrypto ? 'Amount' : 'Shares'}
                  </label>
                  <input
                    required type="number" min="0.00000001" step="any"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    placeholder={isCrypto ? '0.05' : '10'}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Price / {isCrypto ? 'Coin ($)' : 'Share ($)'}
                    </label>
                    {priceSuggestion && form.pricePerShare !== priceSuggestion && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, pricePerShare: priceSuggestion }))}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        ↺ use ${priceSuggestion}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      required type="number" min="0.00000001" step="any"
                      value={form.pricePerShare}
                      onChange={(e) => setForm((f) => ({ ...f, pricePerShare: e.target.value }))}
                      placeholder={priceSuggestion || (isCrypto ? '60000.00' : '150.00')}
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
