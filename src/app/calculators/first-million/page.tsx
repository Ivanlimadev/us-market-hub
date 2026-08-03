import type { Metadata } from 'next'
import { FirstMillionCalc } from './FirstMillionCalc'

export const metadata: Metadata = {
  title: 'First Million Calculator',
  description: 'Calculate how long it takes to reach $1,000,000 - or find out what monthly investment you need to get there by your target date. Free tool for US investors.',
  alternates: { canonical: 'https://stockmarketroi.com/calculators/first-million' },
  openGraph: {
    title: 'First Million Calculator',
    description: 'How long until you reach $1,000,000? Enter your savings rate and return to find out.',
    type: 'website',
  },
}

export default function Page() {
  return <FirstMillionCalc />
}
