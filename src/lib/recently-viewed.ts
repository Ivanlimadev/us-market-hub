'use client'

const KEY = 'usm_viewed'
const MAX = 20

interface ViewedEntry { symbol: string; name: string; count: number; ts: number }

function load(): ViewedEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function recordView(symbol: string, name: string) {
  if (typeof window === 'undefined') return
  const entries = load()
  const idx = entries.findIndex((e) => e.symbol === symbol)
  if (idx >= 0) {
    entries[idx].count++
    entries[idx].ts = Date.now()
    entries[idx].name = name || entries[idx].name
  } else {
    entries.push({ symbol, name, count: 1, ts: Date.now() })
  }
  entries.sort((a, b) => b.count - a.count)
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)))
}

export function getTopViewed(limit = 5): ViewedEntry[] {
  return load().sort((a, b) => b.count - a.count).slice(0, limit)
}
