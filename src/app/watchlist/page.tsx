import type { Metadata } from 'next'
import { WatchlistView } from './WatchlistView'

export const metadata: Metadata = {
  title: 'Watchlist',
  description: 'Track your favorite stocks and crypto assets with price alerts.',
  robots: { index: false, follow: false },
}

export default function WatchlistPage() {
  return <WatchlistView />
}
