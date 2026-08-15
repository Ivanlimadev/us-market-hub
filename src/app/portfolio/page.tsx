import { PortfolioView } from '@/components/portfolio/PortfolioView'
import { PageTracker } from '@/components/PageTracker'

export const metadata = {
  title: 'My Portfolio',
  description: 'Track your US stock portfolio with real-time prices and P&L calculations.',
  robots: { index: false, follow: false },
}

export default function PortfolioPage() {
  return (
    <>
      <PageTracker path="/portfolio" />
      <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
        <p className="text-sm text-zinc-400">
          Prices update automatically · Average cost calculated per position
        </p>
      </div>
      <PortfolioView />
      </div>
    </>
  )
}
