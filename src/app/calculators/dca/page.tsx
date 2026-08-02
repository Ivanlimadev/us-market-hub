import type { Metadata } from 'next'
import { DCACalc } from './DCACalc'

export const metadata: Metadata = {
  title: 'DCA Calculator - Dollar-Cost Averaging | Stock Market ROI',
  description: 'Free Dollar-Cost Averaging (DCA) calculator. Simulate weekly, bi-weekly, or monthly investments over time and compare DCA vs lump sum investing - with a full year-by-year breakdown.',
  alternates: { canonical: 'https://stockmarketroi.com/calculators/dca' },
  openGraph: {
    title: 'DCA Calculator - Dollar-Cost Averaging',
    description: 'See how regular investments grow over time and how DCA compares to lump sum investing. Free calculator for US investors.',
    type: 'website',
  },
}

export default function Page() {
  return <DCACalc />
}
