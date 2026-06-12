'use client'
import { useEffect, useRef, useState } from 'react'

export interface TickerState {
  price: number
  priceChange: number
  priceChangePercent: number
}

// Maps lowercase CoinGecko symbol (e.g. "btc") → live TickerState via Kraken WebSocket
// Kraken is accessible globally (unlike Binance which is geo-restricted in some regions)
export function useKrakenTicker(cgSymbols: string[]): Map<string, TickerState> {
  const [tickers, setTickers] = useState<Map<string, TickerState>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (cgSymbols.length === 0) return

    const krakenSymbols = cgSymbols.map((s) => `${s.toUpperCase()}/USD`)

    const ws = new WebSocket('wss://ws.kraken.com/v2')
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: 'subscribe',
        params: { channel: 'ticker', symbol: krakenSymbols },
      }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        // Handle both snapshot (initial) and update messages
        if (msg.channel !== 'ticker' || !Array.isArray(msg.data)) return

        setTickers((prev) => {
          const next = new Map(prev)
          for (const d of msg.data) {
            if (!d.symbol || !d.last) continue
            // "BTC/USD" → "btc"
            const key = d.symbol.replace('/USD', '').toLowerCase()
            next.set(key, {
              price: d.last,
              priceChange: d.change ?? 0,
              priceChangePercent: d.change_pct ?? 0,
            })
          }
          return next
        })
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => ws.close()
    ws.onclose = () => { wsRef.current = null }

    return () => {
      ws.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cgSymbols.join(',')])

  return tickers
}
