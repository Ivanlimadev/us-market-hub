'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const KEY = 'smroi-cookie-consent'

// Update Google Consent Mode v2 signals (analytics + advertising).
function updateConsent(state: 'granted' | 'denied') {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void }
  w.gtag?.('consent', 'update', {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  })
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true)
  }, [])

  function accept() { localStorage.setItem(KEY, 'all'); updateConsent('granted'); setVisible(false) }
  function dismiss() { localStorage.setItem(KEY, 'essential'); updateConsent('denied'); setVisible(false) }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-2.5">
        <p className="flex-1 text-xs text-zinc-400 leading-snug">
          We use cookies for preferences, analytics and advertising.{' '}
          <Link href="/privacy" className="text-zinc-300 hover:text-white underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-md border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Essential only
        </button>
        <button
          onClick={accept}
          className="shrink-0 rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          Accept all
        </button>
      </div>
    </div>
  )
}
