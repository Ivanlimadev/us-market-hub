'use client'
import { useEffect, useRef } from 'react'
import { X, Bell } from 'lucide-react'
import { useWatchlistStore } from '@/lib/store/watchlist-store'

export function TriggeredAlertsToast() {
  const alerts     = useWatchlistStore((s) => s.alerts)
  const removeAlert = useWatchlistStore((s) => s.removeAlert)
  const triggerAlert = useWatchlistStore((s) => s.triggerAlert)

  const triggered = alerts.filter((a) => a.triggered)
  const visible   = triggered.slice(0, 3)

  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    for (const alert of triggered) {
      if (!timers.current.has(alert.id)) {
        const t = setTimeout(() => {
          removeAlert(alert.id)
          timers.current.delete(alert.id)
        }, 8_000)
        timers.current.set(alert.id, t)
      }
    }
    // Clean up timers for alerts that no longer exist
    for (const [id, t] of timers.current.entries()) {
      if (!triggered.find((a) => a.id === id)) {
        clearTimeout(t)
        timers.current.delete(id)
      }
    }
  }, [triggered]) // eslint-disable-line react-hooks/exhaustive-deps

  if (visible.length === 0) return null

  function fmtPrice(n: number) {
    if (n >= 1)    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (n >= 0.01) return `$${n.toFixed(4)}`
    return `$${n.toFixed(8)}`
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      {visible.map((alert) => {
        const isUp  = alert.condition === 'above' || alert.condition === 'change_up'
        const isPct = alert.condition === 'change_up' || alert.condition === 'change_down'
        const msg   = isPct
          ? `${isUp ? 'Valorizou' : 'Desvalorizou'} ${alert.targetPct?.toFixed(2)}% (ref. ${fmtPrice(alert.referencePrice ?? alert.targetPrice)})`
          : `Preço ${isUp ? 'acima de' : 'abaixo de'} ${fmtPrice(alert.targetPrice)}`
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl max-w-xs ${
              isUp
                ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-300'
                : 'border-red-500/40 bg-red-950/90 text-red-300'
            } backdrop-blur-md`}
          >
            <Bell className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">
                {alert.symbol} — Alerta Ativado!
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">{msg}</p>
            </div>
            <button
              onClick={() => {
                const t = timers.current.get(alert.id)
                if (t) { clearTimeout(t); timers.current.delete(alert.id) }
                removeAlert(alert.id)
              }}
              className="rounded-lg p-0.5 opacity-60 hover:opacity-100 transition-opacity shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
