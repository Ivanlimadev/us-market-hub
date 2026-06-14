'use client'
import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWatchlistStore } from '@/lib/store/watchlist-store'
import type { PriceAlert } from '@/types/watchlist'
import type { YFBatchQuote } from '@/lib/yahoo-finance'
import type { CryptoMarket } from '@/types/crypto'

export function useAlertChecker(): { justTriggered: PriceAlert[] } {
  const store = useWatchlistStore()
  const queryClient = useQueryClient()
  const [justTriggered, setJustTriggered] = useState<PriceAlert[]>([])
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Gather symbols for stock alerts
  const stockAlerts = store.alerts.filter(
    (a) => !a.triggered && a.asset_type === 'stock'
  )
  const stockSymbols = [...new Set(stockAlerts.map((a) => a.symbol))]
  const symbolKey = stockSymbols.sort().join(',')

  // Poll stock prices every 30s
  const { data: stockQuotes } = useQuery<YFBatchQuote[]>({
    queryKey: ['batch-quotes', symbolKey],
    queryFn: () =>
      fetch(`/api/batch-quotes?symbols=${symbolKey}`).then((r) => r.json()),
    enabled: stockSymbols.length > 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 29_000,
  })

  useEffect(() => {
    const activeAlerts = store.alerts.filter((a) => !a.triggered)
    if (activeAlerts.length === 0) return

    // Get crypto prices from cache
    const cryptoMarkets = queryClient.getQueryData<CryptoMarket[]>(['crypto-markets'])

    const newlyTriggered: PriceAlert[] = []

    for (const alert of activeAlerts) {
      let currentPrice: number | undefined

      if (alert.asset_type === 'stock') {
        currentPrice = stockQuotes?.find((q) => q.symbol === alert.symbol)?.price
      } else {
        currentPrice = cryptoMarkets?.find(
          (c) => c.id === alert.coingeckoId || c.symbol === alert.symbol.toLowerCase()
        )?.current_price
      }

      if (currentPrice === undefined) continue

      let triggered = false
      if (alert.condition === 'above') {
        triggered = currentPrice >= alert.targetPrice
      } else if (alert.condition === 'below') {
        triggered = currentPrice <= alert.targetPrice
      } else if (alert.condition === 'change_up' && alert.referencePrice && alert.targetPct != null) {
        const changePct = ((currentPrice - alert.referencePrice) / alert.referencePrice) * 100
        triggered = changePct >= alert.targetPct
      } else if (alert.condition === 'change_down' && alert.referencePrice && alert.targetPct != null) {
        const changePct = ((alert.referencePrice - currentPrice) / alert.referencePrice) * 100
        triggered = changePct >= alert.targetPct
      }

      if (triggered) {
        store.triggerAlert(alert.id)
        newlyTriggered.push(alert)
        fetch('/api/alerts/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId: alert.id, currentPrice }),
        }).catch(() => null)
      }
    }

    if (newlyTriggered.length > 0) {
      setJustTriggered((prev) => [...prev, ...newlyTriggered])
      if (clearTimer.current) clearTimeout(clearTimer.current)
      clearTimer.current = setTimeout(() => setJustTriggered([]), 5_000)
    }
  }, [stockQuotes, store.alerts]) // eslint-disable-line react-hooks/exhaustive-deps

  return { justTriggered }
}
