import type { Metadata } from 'next'
import CalendarView from './CalendarView'

export const metadata: Metadata = {
  title: 'Earnings Calendar & Dividend Calendar 2026: Upcoming US Stock Events',
  description:
    'Free earnings calendar and dividend calendar for US stocks. Track upcoming earnings reports and ex-dividend dates so you never miss a key event.',
  alternates: { canonical: 'https://stockmarketroi.com/calendar' },
}

// FAQPage schema targets the "earning calendar" opportunity query (Bing AI
// Performance).
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is an earnings calendar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An earnings calendar lists the dates companies are scheduled to report quarterly results, so investors can prepare for the volatility those reports often bring.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I find stocks going ex-dividend this week?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Open the Dividends tab to see upcoming ex-dividend dates. To receive a dividend, you must own the shares before the ex-dividend date.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the earnings and dividend calendar free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Our earnings and dividend calendar is free and updates automatically with upcoming US stock events.',
      },
    },
  ],
}

export default function CalendarPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <CalendarView />
    </>
  )
}
