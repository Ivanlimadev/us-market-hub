import type { Metadata } from 'next'
import { GlobalCryptoStats } from '@/components/crypto/GlobalCryptoStats'
import { CryptoHeatmap } from '@/components/crypto/CryptoHeatmap'
import { CryptoTable } from '@/components/crypto/CryptoTable'

export const metadata: Metadata = {
  title: 'Crypto | Stock Market ROI',
  description: 'Live cryptocurrency prices, heatmap, and market data powered by CoinGecko and Binance.',
}

export default function CryptoPage() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Cryptocurrency Market</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Live prices via Binance · Market data via CoinGecko
        </p>
      </div>

      <GlobalCryptoStats />
      <CryptoHeatmap />
      <CryptoTable />
    </main>
  )
}
