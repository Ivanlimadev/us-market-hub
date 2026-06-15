'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

const KEY = 'smroi-cookie-consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true)
  }, [])

  function accept() { localStorage.setItem(KEY, 'all'); setVisible(false) }
  function dismiss() { localStorage.setItem(KEY, 'essential'); setVisible(false) }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-2.5">
        <p className="flex-1 text-xs text-zinc-400 leading-snug">
          We use cookies to save your preferences.{' '}
          <Link href="/privacy" className="text-zinc-300 hover:text-white underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
        >
          OK
        </button>
        <button onClick={dismiss} aria-label="Close" className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
