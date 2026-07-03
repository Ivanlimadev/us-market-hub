import Link from 'next/link'

// Stock Market ROI on the App Store (app id 6785098951). Locale-agnostic link
// so it opens the visitor's own storefront.
const APP_STORE_URL = 'https://apps.apple.com/app/id6785098951'

/** Official-style "Download on the App Store" badge (black), scalable. */
function AppStoreBadge({ className }: { className?: string }) {
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
export function AppDownloadCard({ variant = 'sidebar' }: { variant?: 'sidebar' | 'hero' }) {
  if (variant === 'hero') {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-zinc-800 bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-zinc-900 p-6 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">iOS App</p>
          <h2 className="mt-1 text-lg font-bold text-white">Get Stock Market ROI on your iPhone</h2>
          <p className="mt-1 max-w-md text-sm text-zinc-400">
            Real-time prices, portfolio tracking, price alerts and AI insights — free on the App Store.
          </p>
        </div>
        <Link
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download Stock Market ROI on the App Store"
          className="shrink-0 transition-opacity hover:opacity-90"
        >
          <AppStoreBadge className="h-12 w-auto" />
        </Link>
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
