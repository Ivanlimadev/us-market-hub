import type { Metadata } from 'next'
import { PercentageCalc } from './PercentageCalc'

export const metadata: Metadata = {
  title: 'Percentage Calculator',
  description: 'Free percentage calculator with 4 modes: find X% of Y, calculate what % X is of Y, measure gains, and measure losses. Essential tool for investors.',
  alternates: { canonical: 'https://stockmarketroi.com/calculators/percentage' },
  openGraph: {
    title: 'Percentage Calculator',
    description: 'Four modes: find a percentage of a value, proportions, gains, and losses. Free for US investors.',
    type: 'website',
  },
}

export default function Page() {
  return <PercentageCalc />
}
