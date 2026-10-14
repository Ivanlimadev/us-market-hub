import { ScreenerView } from './ScreenerView'
import { PageTracker } from '@/components/PageTracker'

export const metadata = {
  title: 'Real-Time Stock Screener & Scanner: Filter US Stocks by Fundamentals',
  description:
    'Free real-time stock screener and scanner. Sort and filter 100+ US stocks by daily price movement, market cap, P/E, P/B, dividend yield and ROE to spot opportunities fast.',
  alternates: { canonical: 'https://stockmarketroi.com/screener' },
}

// FAQPage schema targets the scanner/screener opportunity queries (Bing AI
// Performance): what a screener is, finding the biggest daily movers, and an
// honest answer on volume/float scanning (which this tool does not do).
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a stock screener?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A stock screener is a tool that filters and sorts stocks by criteria like valuation, market cap, dividend yield and daily price movement, so you can quickly find stocks that match what you are looking for.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I find the biggest stock movers today?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sort the screener by Change to rank stocks by their daily price movement, putting the biggest gainers and losers at the top.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I filter stocks by volume, price action, or float?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our screener filters and sorts US stocks by fundamentals and daily price movement, including market cap, P/E, P/B, dividend yield, ROE and daily change. It does not currently offer intraday volume or float based scanning.',
      },
    },
  ],
}

export default function ScreenerPage() {
  return (
    <>
      <PageTracker path="/screener" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Real-Time Stock Screener &amp; Scanner</h1>
          <p className="text-sm text-zinc-400">
            Screen and scan 100+ US stocks in real time. Sort by daily price movement, market cap, valuation,
            dividend yield and ROE to spot opportunities.
          </p>
        </div>
        <ScreenerView />
      </div>
    </>
  )
}
