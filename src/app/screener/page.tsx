import { ScreenerView } from './ScreenerView'

export const metadata = { title: 'Stock Screener — US Market Hub' }

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
