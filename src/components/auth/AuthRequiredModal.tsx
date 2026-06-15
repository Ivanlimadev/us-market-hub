'use client'
import Link from 'next/link'
import { X, Star, Bell, BarChart2, TrendingUp } from 'lucide-react'

const FEATURE_COPY: Record<string, { icon: React.ReactNode; title: string; description: string }> = {
  watchlist: {
    icon: <Star className="h-6 w-6 text-amber-400" />,
    title: 'Add to Watchlist',
    description: 'Save and monitor your favorite stocks in one place.',
  },
  alert: {
    icon: <Bell className="h-6 w-6 text-amber-400" />,
    title: 'Price Alerts',
    description: 'Get notified when a stock reaches your target price.',
  },
  portfolio: {
    icon: <BarChart2 className="h-6 w-6 text-emerald-400" />,
    title: 'Portfolio Tracker',
    description: 'Track your investments, performance and dividends.',
  },
}

interface Props {
  feature: 'watchlist' | 'alert' | 'portfolio'
  onClose: () => void
}

export function AuthRequiredModal({ feature, onClose }: Props) {
  const copy = FEATURE_COPY[feature]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
            {copy.icon}
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">{copy.title}</h2>
            <p className="text-sm text-zinc-400">{copy.description}</p>
          </div>

          <p className="text-xs text-zinc-500">
            Create a free account to unlock this feature.
          </p>

          <div className="flex w-full flex-col gap-2">
            <Link
              href="/auth/register"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              Create free account
            </Link>
            <Link
              href="/auth/login"
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-lg border border-zinc-700 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
