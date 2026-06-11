import { HeatmapView } from './HeatmapView'

export const metadata = { title: 'Market Heatmap — US Market Hub' }

export default function HeatmapPage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Market Heatmap</h1>
        <p className="text-sm text-zinc-400">Live performance by sector · Updates every 60s</p>
      </div>
      <HeatmapView />
    </div>
  )
}
