import type { Metadata } from 'next'
import CalendarView from './CalendarView'

export const metadata: Metadata = {
  title: 'Earnings & Dividends Calendar — Upcoming Events | Stock Market ROI',
  description: 'Track upcoming US stock earnings reports and dividend ex-dates. Never miss an earnings announcement or dividend payment with our real-time calendar.',
  alternates: { canonical: 'https://stockmarketroi.com/calendar' },
}

export default function CalendarPage() {
  return <CalendarView />
}
