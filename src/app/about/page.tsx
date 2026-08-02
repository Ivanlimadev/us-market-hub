import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, TrendingUp, BarChart2, Calendar, Layers, ShieldCheck, BookOpen, Award } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About - Ivan Lima, Founder',
  description: 'Ivan Lima is the founder of Stock Market ROI. Systems Analysis & Development student and active US stock market investor since 2018.',
  alternates: { canonical: 'https://stockmarketroi.com/about' },
}

const FEATURES = [
  { icon: TrendingUp,  title: 'US Stock Quotes',      desc: 'Live prices, changes and volume for stocks, ETFs and indices during market hours.' },
  { icon: BarChart2,   title: 'Interactive Charts',    desc: 'Intraday and historical charts from 1 day to 15 years.' },
  { icon: Calendar,    title: 'Earnings & Dividends',  desc: 'Upcoming earnings and dividend calendars for S&P 500 stocks.' },
  { icon: Layers,      title: 'Portfolio Tracker',     desc: 'Track your holdings with P&L and allocation charts.' },
  { icon: ShieldCheck, title: 'Privacy First',         desc: 'Portfolio data stays in your browser - nothing sent to our servers.' },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-12 space-y-12">

      {/* Author card - E-E-A-T */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Founder & Author</p>
        <div className="flex items-start gap-5">
          <img
            src="/ivan-lima.jpg"
            alt="Ivan Lima"
            width={80}
            height={80}
            className="h-20 w-20 shrink-0 rounded-full object-cover border-2 border-emerald-500/40"
          />
          <div className="space-y-2">
            <p className="text-lg font-bold text-zinc-100">Ivan Lima</p>
            <p className="text-xs text-emerald-400 font-medium">Founder · Stock Market ROI</p>
            <p className="text-sm leading-relaxed text-zinc-400">
              Systems Analysis &amp; Development student and active US stock market investor since 2018.
              Ivan built Stock Market ROI to give retail investors direct access to the same data and
              analytical tools he wished existed when he started. Every article on this site is written
              from the perspective of someone with real skin in the game - tracking earnings, reading
              SEC filings, and following market cycles for over eight years.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="https://www.instagram.com/ivan_lima_dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
                @ivan_lima_dev
              </a>
              <a
                href="https://www.linkedin.com/in/ivanlimadev/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
                LinkedIn
              </a>
              <a
                href="mailto:contato@ivanlimadev.com"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                <Mail className="h-3.5 w-3.5" />
                contato@ivanlimadev.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Stock Market ROI</h1>
        </div>
        <p className="text-base text-zinc-300 leading-relaxed">
          A free US stock market data platform built for investors who want professional-grade
          market intelligence without the subscription fees.
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
          Market data is sourced from <strong className="text-zinc-200">Yahoo Finance</strong> (quotes,
          intraday charts, earnings) and{' '}
          <strong className="text-zinc-200">Marketstack</strong> (historical end-of-day prices,
          dividend events). Data is provided for informational purposes only and may be delayed
          or subject to the providers&apos; terms of service.
        </p>
      </section>

      {/* Editorial standards */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Editorial Standards</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: BookOpen, title: 'Fact-Checked', desc: 'All figures are sourced from public financial data providers and verified before publication.' },
            { icon: Award,    title: 'Independent',  desc: 'No brokerage affiliates or sponsored stock recommendations. Analysis is not influenced by advertisers.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">{title}</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed">
          AI-generated stock insights (powered by Claude) are clearly labeled and intended as a
          starting point for research, not financial advice.
        </p>
      </section>

      {/* Legal */}
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
