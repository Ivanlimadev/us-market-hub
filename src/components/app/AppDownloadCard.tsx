import Link from 'next/link'
import { Bell, PieChart, Sparkles, Calculator, Landmark, Newspaper, Coins } from 'lucide-react'

// Stock Market ROI on the App Store (app id 6785098951). Locale-agnostic link
// so it opens the visitor's own storefront.
export const APP_STORE_URL = 'https://apps.apple.com/app/id6785098951'

/** Official-style "Download on the App Store" badge (black), scalable. */
export function AppStoreBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 40"
      className={className}
      role="img"
      aria-label="Download on the App Store"
    >
      <rect x="0.5" y="0.5" width="119" height="39" rx="7" fill="#000" stroke="#A6A6A6" strokeWidth="1" />
      <g transform="translate(10, 10) scale(0.85)" fill="#fff">
        <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
      </g>
      <text x="34" y="16" fill="#fff" fontFamily="Helvetica, Arial, sans-serif" fontSize="7.5">Download on the</text>
      <text x="33.5" y="31" fill="#fff" fontFamily="Helvetica, Arial, sans-serif" fontSize="16" fontWeight="600" letterSpacing="-0.6">App Store</text>
    </svg>
  )
}

/**
 * Promotes the iOS app. `sidebar` is a compact card (blog rail); `hero` is a
 * wider row for the homepage. Opens the App Store in a new tab.
 */
export function AppDownloadCard({ variant = 'sidebar' }: { variant?: 'sidebar' | 'hero' | 'banner' | 'dividends' }) {
  // Dividend-themed app CTA — rich, alive, fills the Dividends section's right column.
  if (variant === 'dividends') {
    const feats = [
      { icon: Bell,       label: 'Dividend notifications' },
      { icon: Newspaper,  label: 'Market & your stocks news' },
      { icon: PieChart,   label: 'Portfolio tracking' },
      { icon: Landmark,   label: 'Fundamental analysis' },
      { icon: Sparkles,   label: 'AI insights' },
      { icon: Coins,      label: 'Magic Number' },
      { icon: Calculator, label: 'Financial calculators' },
    ]
    return (
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden rounded-2xl border border-emerald-500/30 p-6 text-center shadow-[0_0_40px_-12px_rgba(16,185,129,0.35)]"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, rgba(200,164,93,0.18) 0%, rgba(16,185,129,0.14) 35%, rgba(9,9,11,0.9) 100%)' }}
      >
        {/* Decorative sparkles */}
        <span className="pointer-events-none absolute left-6 top-10 text-[#c8a45d]/50">✦</span>
        <span className="pointer-events-none absolute right-8 top-20 text-emerald-400/40 text-lg">✦</span>
        <span className="pointer-events-none absolute bottom-10 left-10 text-[#c8a45d]/30 text-xs">✦</span>

        {/* Bell with animated sound waves */}
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
          <span className="absolute inset-1 rounded-full ring-1 ring-emerald-400/30" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/40">
            <Bell className="h-7 w-7" />
          </span>
        </div>

        <h3 className="mt-4 text-xl font-extrabold text-white">
          Get <span className="text-[#c8a45d]">dividend</span> notifications
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-300">
          Be alerted when your stocks pay — follow market news for your watchlist and manage your whole financial life, on the go.
        </p>

        {/* Feature grid — 2 columns */}
        <ul className="mx-auto mt-5 grid max-w-md grid-cols-1 gap-x-5 gap-y-2.5 text-left text-sm text-zinc-100 sm:grid-cols-2">
          {feats.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{label}</span>
            </li>
          ))}
          <li className="flex items-center gap-2.5 text-[#c8a45d]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center text-base font-bold">+</span>
            <span className="font-semibold">and much more</span>
          </li>
        </ul>

        <div className="mt-6 flex items-center justify-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app-qr.svg" alt="QR code to download the app" className="h-24 w-24 shrink-0 rounded-xl bg-white p-1.5 shadow-lg ring-2 ring-[#c8a45d]/40" />
          <Link
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download Stock Market ROI on the App Store"
            className="rounded-xl ring-2 ring-[#c8a45d]/40 transition-all hover:ring-[#c8a45d]/70"
          >
            <AppStoreBadge className="h-12 w-auto" />
          </Link>
        </div>
      </div>
    )
  }

  // Full-width Investidor10-style banner with a QR code.
  if (variant === 'banner') {
    return (
      <div className="flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-neutral-800 to-zinc-900 px-6 py-5 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <span className="hidden text-4xl font-black text-emerald-400 sm:block" aria-hidden>↗</span>
          <div>
            <h2 className="text-lg font-bold text-white sm:text-xl">Track your investments anywhere</h2>
            <p className="mt-1 max-w-md text-sm text-zinc-400">
              Portfolio, dividends, alerts and AI insights — free on your iPhone.
            </p>
            <Link href="/pro" className="mt-1.5 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">
              See everything you get →
            </Link>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right text-xs leading-tight text-zinc-400">
            Scan the QR<br />to download
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app-qr.svg" alt="QR code to download the app" className="h-[76px] w-[76px] rounded-lg bg-white p-1" />
          <Link
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download Stock Market ROI on the App Store"
            className="transition-opacity hover:opacity-90"
          >
            <AppStoreBadge className="h-11 w-auto" />
          </Link>
        </div>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <div
        className="flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-[#c8a45d]/40 p-6 sm:flex-row sm:justify-between"
        style={{ background: 'linear-gradient(105deg, #171717 0%, #1c1917 42%, rgba(16,185,129,0.16) 74%, rgba(200,164,93,0.28) 100%)' }}
      >
        {/* Left: pitch + Go Pro button right beside it */}
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div>
            {/* neutral-* colors don't get inverted by the light-mode zinc/text-white
                override, so they stay light on this fixed-dark banner in both themes */}
            <p className="text-xs font-bold uppercase tracking-widest text-[#e0c283]">Stock Market ROI Pro</p>
            <h2 className="mt-1 text-xl font-extrabold text-neutral-50">
              All features, <span className="text-[#e0c283]">zero ads</span> — web &amp; app
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-neutral-300">
              Unlock every feature, ad-free, across our website and iOS app.
            </p>
          </div>
          <Link
            href="/pro"
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#c8a45d] to-amber-500 px-6 py-3 text-base font-extrabold text-zinc-950 shadow-lg shadow-amber-500/30 transition-transform hover:scale-105"
          >
            Go Pro →
          </Link>
        </div>

        {/* Right: QR + App Store */}
        <div className="flex shrink-0 items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app-qr.svg" alt="QR code to download the app" className="h-[76px] w-[76px] shrink-0 rounded-lg bg-white p-1 shadow-lg ring-2 ring-[#c8a45d]/50" />
          <Link
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download Stock Market ROI on the App Store"
            className="rounded-xl ring-2 ring-[#c8a45d]/50 transition-all hover:ring-[#c8a45d]/80"
          >
            <AppStoreBadge className="h-12 w-auto" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-emerald-500/10 to-zinc-900 p-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">iOS App</p>
      <h3 className="mt-1 text-sm font-bold text-white">Stock Market ROI in your pocket</h3>
      <p className="mx-auto mt-1 text-xs leading-relaxed text-zinc-400">
        Track your portfolio, live prices and alerts on the go.
      </p>
      <Link
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download Stock Market ROI on the App Store"
        className="mt-3 inline-block transition-opacity hover:opacity-90"
      >
        <AppStoreBadge className="h-10 w-auto" />
      </Link>
    </div>
  )
}
