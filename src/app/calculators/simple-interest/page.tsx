import type { Metadata } from 'next'
import { SimpleCalc } from './SimpleCalc'

export const metadata: Metadata = {
  title: 'Simple Interest Calculator',
  description: 'Calculate simple interest returns on fixed-income investments. Enter principal, rate, and period to see your final amount with a period-by-period table.',
  alternates: { canonical: 'https://stockmarketroi.com/calculators/simple-interest' },
  openGraph: {
    title: 'Simple Interest Calculator',
    description: 'Calculate linear investment returns without compounding. Free tool for US investors.',
    type: 'website',
  },
}

export default function Page() {
  return <SimpleCalc />
}
