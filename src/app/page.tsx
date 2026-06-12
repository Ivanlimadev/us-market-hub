import { IndexCards } from '@/components/market/IndexCards'
import { HomeHeatmap } from '@/components/market/HomeHeatmap'
import { HomeRankings } from '@/components/market/HomeRankings'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">US Markets</h1>
        <p className="text-sm text-zinc-400">Real-time data · Updates every 60s during market hours</p>
      </div>

      {/* Market index cards */}
      <IndexCards />

      {/* Heatmap */}
      <HomeHeatmap />

      {/* Rankings */}
      <HomeRankings />
    </div>
  )
}
