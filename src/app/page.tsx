import { IndexCards } from '@/components/market/IndexCards'
import { StockTable } from '@/components/market/StockTable'

const BLUE_CHIPS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'V', 'UNH']

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">US Markets</h1>
        <p className="text-sm text-zinc-400">Real-time data · Updates every 60s during market hours</p>
      </div>

      <IndexCards />

      <StockTable symbols={BLUE_CHIPS} title="Blue Chips" />
    </div>
  )
}
