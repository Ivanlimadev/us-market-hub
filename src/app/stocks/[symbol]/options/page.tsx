import type { Metadata } from 'next'
import Link from 'next/link'
import { getYFOptions } from '@/lib/yahoo-finance'
import { OptionsChain } from '@/components/stock/OptionsChain'

// Revalidate periodically; the data is delayed anyway.
export const revalidate = 300
export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>
}): Promise<Metadata> {
  const { symbol } = await params
  const upper = symbol.toUpperCase()
  return {
    title: `${upper} Options Chain: Calls, Puts, Strikes & Implied Volatility | Stock Market ROI`,
    description: `Live ${upper} options chain with strikes, bid/ask, volume, open interest and implied volatility across every expiration.`,
    alternates: { canonical: `https://stockmarketroi.com/stocks/${symbol.toLowerCase()}/options` },
    // Delayed, third-party data that we plan to replace with a fuller provider,
    // so keep it out of the index for now (still followable for discovery).
    robots: { index: false, follow: true },
  }
}

export default async function OptionsPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const upper = symbol.toUpperCase()
  const chain = await getYFOptions(upper)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-4 text-xs text-zinc-500">
        <Link href={`/stocks/${symbol.toLowerCase()}`} className="hover:text-zinc-300">
          {upper}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-zinc-400">Options</span>
      </nav>

      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-3xl font-bold text-white">{upper} Options Chain</h1>
        {chain && chain.underlyingPrice > 0 && (
          <span className="text-lg font-semibold text-zinc-400">
            Underlying ${chain.underlyingPrice.toFixed(2)}
          </span>
        )}
      </div>

      {/* Data-source notice: delayed today, fuller provider planned. */}
      <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs leading-relaxed text-amber-200/80">
        Options data is delayed (roughly 15 minutes) and provided by Yahoo Finance. We are working on
        an upgrade to a faster, more complete data source (with Greeks and historical chains) soon.
      </div>

      {chain && (chain.calls.length > 0 || chain.puts.length > 0) ? (
        <OptionsChain symbol={upper} initialData={chain} />
      ) : (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-8 text-center text-sm text-zinc-500">
          No options chain is available for {upper} right now. Not every ticker has listed options.
        </p>
      )}

      <p className="mt-8 border-t border-zinc-800 pt-6 text-xs leading-relaxed text-zinc-500">
        Implied volatility (IV) is the market&apos;s forecast of how much the stock could move. Learn
        the metrics behind every stock in our{' '}
        <Link href="/glossary" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
          glossary
        </Link>
        , or go back to the{' '}
        <Link href={`/stocks/${symbol.toLowerCase()}`} className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
          {upper} analysis
        </Link>
        .
      </p>
    </main>
  )
}
