'use client'
import { useEffect, useRef, useState } from 'react'

export interface YFTickerState {
  price: number
  change: number
  changePercent: number
}

/**
 * Minimal protobuf decoder for Yahoo Finance streaming messages.
 * YF sends base64-encoded protobuf frames over the WebSocket.
 *
 * Relevant fields (proto field numbers):
 *   1  = id (string)     - ticker symbol, e.g. "AAPL"
 *   2  = price (float32)
 *   8  = changePercent (float32)
 *   12 = change (float32)
 */
function decodeYFProto(buf: Uint8Array): { id: string; price: number; changePercent: number; change: number } | null {
  let id = ''
  let price = 0
  let changePercent = 0
  let change = 0
  let i = 0

  while (i < buf.length) {
    // Decode varint tag
    let tag = 0
    let shift = 0
    while (i < buf.length) {
      const b = buf[i++]
      tag |= (b & 0x7f) << shift
      if (!(b & 0x80)) break
      shift += 7
    }

    const fieldNum = tag >>> 3
    const wireType = tag & 0x7

    if (wireType === 5) {
      // 32-bit (float32, little-endian)
      if (i + 4 > buf.length) break
      const val = new DataView(buf.buffer, buf.byteOffset + i, 4).getFloat32(0, true)
      i += 4
      if (fieldNum === 2) price = val
      else if (fieldNum === 8) changePercent = val
      else if (fieldNum === 12) change = val
    } else if (wireType === 2) {
      // Length-delimited (string, bytes, embedded message)
      let len = 0
      shift = 0
      while (i < buf.length) {
        const b = buf[i++]
        len |= (b & 0x7f) << shift
        if (!(b & 0x80)) break
        shift += 7
      }
      if (fieldNum === 1) {
        id = new TextDecoder().decode(buf.slice(i, i + len))
      }
      i += len
    } else if (wireType === 0) {
      // Varint - skip
      while (i < buf.length && buf[i++] & 0x80) { /* consume */ }
    } else if (wireType === 1) {
      // 64-bit - skip
      i += 8
    } else {
      break
    }
  }

  return id ? { id, price, changePercent, change } : null
}

export function useYahooTicker(symbols: string[]): Map<string, YFTickerState> {
  const [tickers, setTickers] = useState<Map<string, YFTickerState>>(new Map())
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (symbols.length === 0) return

    const ws = new WebSocket('wss://streamer.finance.yahoo.com/')
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ subscribe: symbols }))
    }

    ws.onmessage = (event) => {
      try {
        const raw = atob(event.data as string)
        const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0))
        const msg = decodeYFProto(bytes)
        if (!msg?.id || !msg.price) return

        setTickers((prev) => {
          const next = new Map(prev)
          next.set(msg.id, {
            price: msg.price,
            change: msg.change,
            changePercent: msg.changePercent,
          })
          return next
        })
      } catch {
        // ignore parse errors on individual frames
      }
    }

    ws.onerror = () => ws.close()

    ws.onclose = () => {
      wsRef.current = null
    }

    return () => {
      ws.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(',')])

  return tickers
}
