import { CompareView } from './CompareView'

export const metadata = {
  title: 'Compare Stocks Side by Side — Fundamentals & Performance',
  description: 'Compare up to 5 US stocks side by side. Analyze P/E, market cap, revenue, profit margin, dividend yield and price performance to make better investment decisions.',
  alternates: { canonical: 'https://stockmarketroi.com/compare' },
}

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
