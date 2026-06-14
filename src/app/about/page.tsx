import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, BarChart2, Calendar, Layers, ShieldCheck, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us — Stock Market ROI',
  description: 'Learn about Stock Market ROI — a real-time US stock market data platform.',
}

const FEATURES = [
  { icon: TrendingUp, title: 'Real-Time Quotes',    desc: 'Live prices, changes and volume for stocks, ETFs and indices.' },
  { icon: BarChart2,  title: 'Interactive Charts',   desc: 'Intraday and historical charts from 1 day to 15 years.' },
  { icon: Calendar,   title: 'Earnings & Dividends', desc: 'Upcoming earnings and dividend calendars for S&P 500 stocks.' },
  { icon: Layers,     title: 'Portfolio Tracker',    desc: 'Track your holdings with real-time P&L and allocation charts.' },
  { icon: ShieldCheck,title: 'Privacy First',        desc: 'Portfolio data stays in your browser — nothing is sent to our servers.' },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-12 space-y-12">

      {/* Hero */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-emerald-400" />
          <h1 className="text-3xl font-bold text-white">Stock Market ROI</h1>
        </div>
        <p className="text-lg text-zinc-300 leading-relaxed">
          A free, real-time US stock market data platform built for investors and
          enthusiasts who want professional-grade market intelligence without the
          subscription fees.
        </p>
      </section>

      {/* Mission */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Our Mission</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          We believe that access to quality financial market data should be open and
          accessible to everyone. Stock Market ROI aggregates real-time and historical
          data from trusted providers and presents it through a clean, fast interface —
          so you can focus on making informed decisions, not on navigating complex tools.
        </p>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">What we offer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">{title}</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data sources */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Data Sources</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Market data is sourced from <strong className="text-zinc-200">Yahoo Finance</strong> (real-time
          quotes, intraday charts, earnings timestamps) and{' '}
          <strong className="text-zinc-200">Marketstack</strong> (historical end-of-day prices,
          dividend events). Data is provided for informational purposes only and may be
          delayed or subject to the providers' terms of service.
        </p>
      </section>

      {/* Contact */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Contact</h2>
        <p className="text-sm text-zinc-400">
          Questions, feedback or data corrections? Reach us at:
        </p>
        <a
          href="mailto:contact@stockmarketroi.com"
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Mail className="h-4 w-4" />
          contact@stockmarketroi.com
        </a>
      </section>

      {/* Legal note */}
      <p className="text-xs text-zinc-600 leading-relaxed">
        Stock Market ROI does not provide investment, tax or legal advice. All content
        is for informational purposes only. See our{' '}
        <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-400">Terms of Use</Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-400">Privacy Policy</Link>.
      </p>
    </div>
  )
}
