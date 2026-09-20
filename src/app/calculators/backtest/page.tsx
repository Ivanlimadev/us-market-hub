import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BacktestCalc } from './BacktestCalc'

export const metadata: Metadata = {
  title: 'Backtest Calculator - Test a Stock or ETF Strategy',
  description:
    'Free backtesting calculator. Test how a stock or ETF strategy (buy & hold or dollar-cost averaging) would have performed with 10 years of historical data - CAGR, max drawdown, volatility and a benchmark comparison.',
  alternates: { canonical: 'https://stockmarketroi.com/calculators/backtest' },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  openGraph: {
    title: 'Backtest Calculator - Test a Stock or ETF Strategy',
    description:
      'Backtest buy & hold or DCA on any stock or ETF using real historical data. See CAGR, drawdown, volatility and how it compares to the S&P 500.',
    type: 'website',
    images: ['https://images.pexels.com/photos/6801874/pexels-photo-6801874.jpeg'],
  },
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BacktestCalc />
    </Suspense>
  )
}
