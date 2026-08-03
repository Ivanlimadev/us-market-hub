import type { Metadata } from 'next'
import { CompoundCalc } from './CompoundCalc'

export const metadata: Metadata = {
  title: 'Compound Interest Calculator',
  description: 'Free compound interest calculator for investors. Enter initial capital, monthly contributions, and rate to see your projected balance with a year-by-year breakdown.',
  alternates: { canonical: 'https://stockmarketroi.com/calculators/compound-interest' },
  openGraph: {
    title: 'Compound Interest Calculator',
    description: 'See how your investments grow with compound interest. Includes monthly contributions and a period-by-period breakdown.',
    type: 'website',
  },
}

export default function Page() {
  return <CompoundCalc />
}
