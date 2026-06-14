import { RankingsView } from './RankingsView'

export const metadata = {
  title: 'Stock Rankings — Top US Stocks by Performance & Metrics | Stock Market ROI',
  description: 'Rank US stocks by daily performance, market cap, dividend yield, P/E ratio, revenue growth and more. Find the best and worst performing stocks today.',
  alternates: { canonical: 'https://stockmarketroi.com/rankings' },
}

export default function RankingsPage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Rankings</h1>
        <p className="text-sm text-zinc-400">Top US stocks ranked by key metrics</p>
      </div>
      <RankingsView />
    </div>
  )
}
