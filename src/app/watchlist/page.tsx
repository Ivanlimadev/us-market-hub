import type { Metadata } from 'next'
import { WatchlistView } from './WatchlistView'

export const metadata: Metadata = {
  title: 'Watchlist | Stock Market ROI',
  description: 'Track your favorite stocks and crypto assets with price alerts.',
}

export default function WatchlistPage() {
  return <WatchlistView />
}
