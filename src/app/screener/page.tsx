import { ScreenerView } from './ScreenerView'

export const metadata = {
  title: 'Stock Screener — Filter US Stocks by Fundamentals | Stock Market ROI',
  description: 'Screen US stocks by P/E ratio, market cap, dividend yield, revenue growth, profit margin and more. Filter 100+ stocks to find undervalued opportunities.',
  alternates: { canonical: 'https://stockmarketroi.com/screener' },
}

export default function ScreenerPage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Stock Screener</h1>
        <p className="text-sm text-zinc-400">Filter and sort {' '}100+ US stocks by fundamentals</p>
      </div>
      <ScreenerView />
    </div>
  )
}
