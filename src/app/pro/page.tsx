import type { Metadata } from 'next'
import Link from 'next/link'
import { Bell, Sparkles, Calculator, Wallet, BarChart3, Newspaper, LineChart, PiggyBank, Landmark } from 'lucide-react'
import { APP_STORE_URL, AppStoreBadge } from '@/components/app/AppDownloadCard'

export const metadata: Metadata = {
  title: 'Get the App',
  description:
    'Dividend & price alerts, AI insights, financial calculators, portfolio tracking and more - free on your iPhone. Download Stock Market ROI.',
  alternates: { canonical: 'https://stockmarketroi.com/pro' },
  openGraph: {
    title: 'Get the App - Stock Market ROI',
    description: 'Alerts, AI insights, calculators and portfolio tracking - the full experience, free on your iPhone.',
    type: 'website',
  },
}

const FEATURES = [
  { icon: Bell, title: 'Dividend & price alerts', desc: 'Get notified the moment a stock hits your target price or announces a dividend - never miss a payout or an entry.' },
  { icon: Sparkles, title: 'AI insights', desc: 'An AI agent reads the fundamentals and gives you a clear buy, hold or avoid take on any stock - in seconds.' },
  { icon: LineChart, title: 'Fundamental analysis', desc: 'P/E, EPS, margins, revenue growth, fair value and a buy-hold checklist - the full picture for every stock.' },
  { icon: Newspaper, title: 'Market news', desc: 'Get the news moving the market - earnings, dividends and the headlines behind every ticker, as it happens.' },
  { icon: Calculator, title: 'Financial calculators', desc: 'Compound interest, DCA, first-million and dividend-income calculators to plan every goal.' },
  { icon: PiggyBank, title: 'Personal finance', desc: 'Organize your whole financial life - accounts, budgets, bills, goals and recurring subscriptions in one place.' },
  { icon: Wallet, title: 'Portfolio tracking', desc: 'Add your holdings and track profit, loss and dividends across your whole portfolio, live.' },
  { icon: BarChart3, title: 'Growth comparison', desc: 'See how any stock stacks up against its peers, the major indexes and commodities over time.' },
  { icon: Landmark, title: 'US macro & economy', desc: 'Fed rate, inflation, GDP, jobs - the macro indicators that drive markets, tracked in one dashboard.' },
]

export default function ProPage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 sm:py-14">
      {/* Hero */}
      <section className="flex flex-col items-center gap-8 rounded-3xl border border-zinc-800 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-900 px-6 py-10 text-center sm:px-10 md:flex-row md:text-left">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Free iOS App</p>
          <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">Everything, in your pocket</h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-400 md:mx-0">
            Alerts, AI insights, calculators and portfolio tracking - the full Stock Market ROI
            experience, on your iPhone.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row md:items-center md:justify-start">
            <Link
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download Stock Market ROI on the App Store"
              className="transition-opacity hover:opacity-90"
            >
              <AppStoreBadge className="h-14 w-auto" />
            </Link>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app-qr.svg" alt="QR code to download the app" className="h-40 w-40 rounded-2xl bg-white p-3" />
          <p className="text-xs text-zinc-400">Scan to download</p>
        </div>
      </section>

      {/* Features */}
      <section className="mt-12">
        <h2 className="text-center text-2xl font-bold text-white">Everything you get</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-500">
          The same market intelligence as the site - plus alerts, your portfolio and AI, wherever you are.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{desc}</p>
            </div>
          ))}
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-700 p-6 text-center">
            <p className="text-sm font-semibold text-zinc-400">…and much more.</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA - fixed-dark (neutral, not theme-inverted) so text stays readable */}
      <section
        className="mt-12 flex flex-col items-center gap-5 rounded-3xl border border-[#c8a45d]/30 px-6 py-8 text-center shadow-[0_0_40px_-14px_rgba(200,164,93,0.35)] sm:flex-row sm:justify-between sm:text-left"
        style={{ background: 'linear-gradient(105deg, #171717 0%, #1c1917 45%, rgba(16,185,129,0.14) 78%, rgba(200,164,93,0.22) 100%)' }}
      >
        <div>
          <h2 className="text-xl font-bold text-neutral-50">Ready to start?</h2>
          <p className="mt-1 text-sm text-neutral-300">Download Stock Market ROI and take your portfolio anywhere.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app-qr.svg" alt="QR code to download the app" className="hidden h-20 w-20 rounded-lg bg-white p-1.5 sm:block" />
          <Link
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download Stock Market ROI on the App Store"
            className="transition-opacity hover:opacity-90"
          >
            <AppStoreBadge className="h-12 w-auto" />
          </Link>
        </div>
      </section>
    </div>
  )
}
