import Link from 'next/link'
import { ScreenerView } from '@/app/screener/ScreenerView'

export const metadata = {
  title: 'US Stocks: Free Live Stock Quotes, Prices & Analysis',
  description:
    'Free live stock quotes for 100+ US stocks, with prices, fundamentals, dividends and charts. Browse the full A-Z list of tickers or filter with the screener.',
  alternates: { canonical: 'https://stockmarketroi.com/stocks' },
}

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
