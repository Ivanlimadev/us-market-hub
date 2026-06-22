import type { Metadata } from 'next'
import { FinanceClient } from './FinanceClient'

export const metadata: Metadata = {
  title: 'Finance — Personal Finance Manager',
  description: 'Track your accounts, net worth and spending — all in one place.',
  robots: { index: false, follow: false },
}

export default function FinancePage() {
  return <FinanceClient />
}
