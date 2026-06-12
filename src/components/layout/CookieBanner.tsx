'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

const KEY = 'smroi-cookie-consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(KEY, 'all')
    setVisible(false)
  }

  function essential() {
    localStorage.setItem(KEY, 'essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-700 bg-zinc-900/95 backdrop-blur-md shadow-2xl">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <p className="text-sm text-zinc-300 leading-relaxed">
            We use cookies and local storage to save your portfolio and preferences.
            No personal data is sold or shared with third parties.{' '}
            <Link href="/privacy" className="text-emerald-400 underline-offset-2 hover:underline">
              Privacy Policy
            </Link>{' '}
            &amp;{' '}
            <Link href="/terms" className="text-emerald-400 underline-offset-2 hover:underline">
              Terms of Use
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={essential}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Essential only
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Accept all
          </button>
          <button
            onClick={essential}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
