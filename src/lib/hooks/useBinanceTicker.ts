'use client'

import { useEffect, useRef, useState } from 'react'
import type { BinanceTicker } from '@/types/crypto'

export interface TickerState {
  price: number
  priceChange: number
  priceChangePercent: number
  high: number
  low: number
  volume: number
  quoteVolume: number
}

// Maps BTCUSDT → live TickerState via Binance WebSocket
export function useBinanceTicker(symbols: string[]): Map<string, TickerState> {
  const [tickers, setTickers] = useState<Map<string, TickerState>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)
  const symbolSet = symbols.map((s) => s.toUpperCase())

  useEffect(() => {
    if (symbolSet.length === 0) return

    const streams = symbolSet.map((s) => `${s.toLowerCase()}@ticker`).join('/')
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { stream: string; data: BinanceTicker }
        const d = msg.data
        setTickers((prev) => {
          const next = new Map(prev)
          next.set(d.s, {
            price: parseFloat(d.c),
            priceChange: parseFloat(d.p),
            priceChangePercent: parseFloat(d.P),
            high: parseFloat(d.h),
            low: parseFloat(d.l),
            volume: parseFloat(d.v),
            quoteVolume: parseFloat(d.q),
          })
          return next
        })
      } catch {
        // ignore malformed frames
      }
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(',')])

  return tickers
}
