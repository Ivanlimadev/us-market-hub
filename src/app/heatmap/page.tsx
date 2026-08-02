import { HeatmapView } from './HeatmapView'

export const metadata = {
  title: 'Market Heatmap - Top US Stocks by Performance',
  description: 'Visual heatmap of the top US stocks showing real-time price performance. Instantly identify the market\'s biggest gainers and losers by sector.',
  alternates: { canonical: 'https://stockmarketroi.com/heatmap' },
}

export default function HeatmapPage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Top 20 Stocks</h1>
        <p className="text-sm text-zinc-400">Top US stocks by market cap · auto-updates</p>
      </div>
      <HeatmapView />
    </div>
  )
}
