import Link from 'next/link'

// iOS App Store link (country-less so it opens in the visitor's local store).
const APP_STORE_URL = 'https://apps.apple.com/app/id6785098951'

/**
 * Call-to-action card that turns blog readers into app users. Rendered at the
 * end of every blog post, where engagement is highest.
 */
export default function AppDownloadCard() {
  return (
    <div className="my-10 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-zinc-900 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Stock Market ROI app
          </span>
          <h3 className="mt-1 text-xl font-bold text-zinc-100 sm:text-2xl">
            Analyze any U.S. stock in seconds
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Live prices, earnings, valuation and AI insights on the biggest U.S.
            stocks and crypto — track your portfolio and never watch from the
            sidelines again. Free on the App Store.
          </p>
        </div>
        <Link
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-500 px-7 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Download free
        </Link>
      </div>
    </div>
  )
}
