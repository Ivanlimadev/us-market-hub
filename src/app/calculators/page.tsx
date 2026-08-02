import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Percent, Target, BarChart2, RefreshCw, ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Free Investment Calculators - Stock Market ROI',
  description: 'Free financial calculators for US investors: compound interest, DCA, simple interest, first million, and percentage. Plan your investments and see how your money grows.',
  alternates: { canonical: 'https://stockmarketroi.com/calculators' },
  openGraph: {
    title: 'Free Investment Calculators - Stock Market ROI',
    description: 'Free financial calculators for investors: compound interest, DCA, simple interest, first million, and percentage.',
    type: 'website',
  },
}

const CALCULATORS = [
  {
    href: '/calculators/compound-interest',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    title: 'Compound Interest',
    description: 'See how your money grows exponentially over time. Includes initial capital, monthly contributions, and a period-by-period breakdown.',
    badge: 'Most popular',
  },
  {
    href: '/calculators/dca',
    icon: RefreshCw,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    title: 'DCA Calculator',
    description: 'Simulate Dollar-Cost Averaging with weekly, bi-weekly, or monthly contributions. Compares DCA vs lump sum so you can see the difference in final value.',
    badge: 'Trending',
  },
  {
    href: '/calculators/roi',
    icon: ArrowUpRight,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    title: 'ROI Calculator',
    description: 'Calculate total ROI and annualized CAGR for any investment or stock trade. Includes S&P 500 benchmark comparison and break-even recovery analysis.',
    badge: null,
  },
  {
    href: '/calculators/first-million',
    icon: Target,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    title: 'First Million',
    description: 'Find out at what age you\'ll reach $1,000,000 - or how much you need to invest monthly to get there by your target date.',
    badge: 'Goal-based',
  },
  {
    href: '/calculators/simple-interest',
    icon: BarChart2,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    title: 'Simple Interest',
    description: 'Calculate returns on fixed-income investments where interest is applied only to the original principal - no compounding effect.',
    badge: null,
  },
  {
    href: '/calculators/percentage',
    icon: Percent,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    title: 'Percentage Calculator',
    description: 'Four calculation modes: find a percentage of a value, calculate proportions, measure gains, or measure losses instantly.',
    badge: null,
  },
]

export default function CalculatorsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <h1 className="mb-3 text-3xl font-bold text-zinc-100">Investment Calculators</h1>
      <p className="mb-10 max-w-2xl text-zinc-400 leading-relaxed">
        Free tools to plan your financial future. Whether you're calculating returns, setting goals,
        or doing quick percentage math - every calculator updates in real time.
      </p>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {CALCULATORS.map((c) => {
          const Icon = c.icon
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
            >
              {c.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  {c.badge}
                </span>
              )}
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${c.bg}`}>
                <Icon className={`h-6 w-6 ${c.color}`} />
              </div>
              <div>
                <h2 className="mb-1.5 text-lg font-bold text-zinc-100 group-hover:text-white transition-colors">
                  {c.title}
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">{c.description}</p>
              </div>
              <span className={`mt-auto text-xs font-semibold ${c.color}`}>
                Open calculator →
              </span>
            </Link>
          )
        })}
      </div>

      {/* SEO content */}
      <section className="mt-14 space-y-6 border-t border-zinc-800 pt-10 text-sm leading-relaxed text-zinc-400">
        <h2 className="text-lg font-bold text-zinc-200">Why use financial calculators?</h2>
        <p>
          Understanding the math behind investing is one of the most important steps toward building
          wealth. Compound interest - often called the "eighth wonder of the world" - turns small,
          consistent contributions into life-changing sums over time. Our calculators make that math
          transparent and interactive.
        </p>
        <p>
          Unlike generic calculators, these tools are built specifically for US investors: dollar
          amounts, annual rates aligned with US market conventions, and results designed to inform
          real portfolio decisions. Use them alongside our{' '}
          <Link href="/stocks/AAPL" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
            stock analysis pages
          </Link>{' '}
          and{' '}
          <Link href="/portfolio" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
            portfolio tracker
          </Link>{' '}
          to make more informed decisions.
        </p>

        <h2 className="text-lg font-bold text-zinc-200">Compound vs. Simple Interest</h2>
        <p>
          Simple interest grows linearly: you earn the same dollar amount every period based solely
          on the original principal. Compound interest snowballs: each period's interest is added to
          the principal, so future interest is calculated on a larger base. Over 20-30 years, the
          difference between the two is enormous - and that's exactly what the compound interest
          calculator visualizes.
        </p>
      </section>
    </main>
  )
}
