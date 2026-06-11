import { CompareView } from './CompareView'

export const metadata = { title: 'Compare Stocks — US Market Hub' }

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Compare Stocks</h1>
        <p className="text-sm text-zinc-400">Side-by-side comparison of up to 5 assets</p>
      </div>
      <CompareView />
    </div>
  )
}
