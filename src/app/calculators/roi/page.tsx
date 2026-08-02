import type { Metadata } from 'next'
import { ROICalc } from './ROICalc'

export const metadata: Metadata = {
  title: 'ROI Calculator - Return on Investment | Stock Market ROI',
  description: 'Calculate your Return on Investment for any asset or stock trade. See total ROI, annualized CAGR, and how your investment compares to the S&P 500 benchmark.',
  alternates: { canonical: 'https://stockmarketroi.com/calculators/roi' },
  openGraph: {
    title: 'ROI Calculator - Return on Investment',
    description: 'Free ROI calculator with CAGR, S&P 500 benchmark comparison, and break-even recovery analysis. For stocks and any investment.',
    type: 'website',
  },
}

export default function Page() {
  return <ROICalc />
}
