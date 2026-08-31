'use client'
import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { subscribeToPush, pushSupported, pushPermission } from '@/lib/push'

// Discreet "get new-post notifications" card (Yahoo-style), bottom-right.
// Shows only when: browser supports push, permission not yet decided, the user
// hasn't dismissed it before, and after a short delay so it doesn't fight the
// cookie banner for attention.
const DISMISS_KEY = 'smroi-push-dismissed'
const COOKIE_KEY = 'smroi-cookie-consent'

export function PushPrompt() {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      // Don't stack on top of the cookie banner.
      if (!localStorage.getItem(COOKIE_KEY)) return
      if (localStorage.getItem(DISMISS_KEY)) return
      if (pushPermission() !== 'default') return
      if (!(await pushSupported())) return
      if (!cancelled) setVisible(true)
    }, 8000)
    return () => { cancelled = true; clearTimeout(t) }
  }, [])

  async function enable() {
    setBusy(true)
    const token = await subscribeToPush()
    setBusy(false)
    // Whether granted or denied, don't nag again.
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
    if (token) console.info('[push] subscribed')
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 right-4 z-50 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl sm:bottom-4">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
          <Bell className="h-4.5 w-4.5 text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Get new post alerts</p>
          <p className="mt-0.5 text-xs leading-snug text-zinc-400">
            Be the first to know when we publish market analysis, earnings and dividend updates.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={enable}
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
            >
              {busy ? 'Enabling…' : 'Enable notifications'}
            </button>
            <button
              onClick={dismiss}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
