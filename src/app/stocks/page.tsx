import Link from 'next/link'
import { ScreenerView } from '@/app/screener/ScreenerView'

export const metadata = { title: 'US Stocks - Live Quotes & Analysis' }

export default function StocksPage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">US Stocks</h1>
        <p className="text-sm text-zinc-400">
          Filter and sort 100+ US stocks by fundamentals, or browse the{' '}
          <Link href="/stocks/all" className="text-emerald-400 hover:text-emerald-300">full A-Z list of every ticker</Link>.
        </p>
      </div>
      <ScreenerView />
    </div>
  )
}
