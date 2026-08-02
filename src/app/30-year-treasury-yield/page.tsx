import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { getYFChart } from '@/lib/yahoo-finance'
import { PriceChart } from '@/components/stock/PriceChart'
import { WatchlistButton } from '@/components/watchlist/WatchlistButton'
import { AlertButton } from '@/components/watchlist/AlertButton'
import { WidgetBoundary } from '@/components/ui/WidgetBoundary'

export const revalidate = 300

const SYMBOL = '^TYX' // CBOE 30-Year US Treasury Bond Yield on Yahoo Finance
const NAME = '30-Year Treasury Yield'
const BASE = 'https://stockmarketroi.com'
const PATH = '/30-year-treasury-yield'

const AFFECTS = [
  { label: '30-year mortgage rates', note: 'Long-term home loans track the long bond.' },
  { label: 'Long-term borrowing', note: 'Sets the cost of decades-long corporate & government debt.' },
  { label: 'Pensions & insurers', note: 'Used to value long-dated liabilities.' },
  { label: 'Inflation expectations', note: 'The clearest market read on long-run inflation.' },
]

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={`space-y-4${id ? ' scroll-mt-24' : ''}`}>
      <h2 className="border-b border-zinc-800 pb-2 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  )
}

async function getYield(): Promise<{ value: number; prevClose: number } | null> {
  try {
    const bars = await getYFChart(SYMBOL, '5d', '1d')
    if (!bars.length) return null
    const value = bars[bars.length - 1].close
    const prevClose = bars.length >= 2 ? bars[bars.length - 2].close : value
    return { value, prevClose }
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const year = new Date().getFullYear()
  return {
    title:       `30-Year Treasury Yield - Live Chart & Rate Today ${year}`,
    description: `Live 30-year US Treasury yield chart and rate. See the 30-year yield today, what moves the long bond, and why it drives mortgages and long-term inflation expectations.`,
    alternates:  { canonical: `${BASE}${PATH}` },
    openGraph: {
      title:       `30-Year Treasury Yield - Live Chart & Rate ${year}`,
      description: `Track the 30-year US Treasury yield (the "long bond") in real time: interactive chart and what moves it.`,
    },
    twitter: {
      card:        'summary_large_image',
      title:       `30-Year Treasury Yield - Live Chart & Rate ${year}`,
      description: `Track the 30-year US Treasury yield (the long bond) in real time and see what moves it.`,
    },
  }
}

export default async function ThirtyYearYieldPage() {
  const now   = new Date()
  const year  = now.getFullYear()
  const today = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const yld       = await getYield()
  const value     = yld?.value ?? null
  const prevClose = yld?.prevClose ?? value ?? 0
  const changePct = value != null && prevClose ? ((value - prevClose) / prevClose) * 100 : null
  const up        = (changePct ?? 0) >= 0
  const valueStr  = value != null ? `${value.toFixed(2)}%` : '-'
  const changeStr = changePct != null ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '-'

  const faqs = [
    {
      q: 'What is the 30-year Treasury yield today?',
      a: value != null
        ? `As of ${today}, the 30-year US Treasury yield is around ${valueStr}, ${up ? 'up' : 'down'} ${Math.abs(changePct ?? 0).toFixed(2)}% on the day. The rate on this page updates in real time during market hours.`
        : `The 30-year US Treasury yield updates live on this page during market hours.`,
    },
    {
      q: 'What is the 30-year Treasury yield?',
      a: 'It is the interest rate the US government pays to borrow money for 30 years - the longest standard Treasury, nicknamed the "long bond." It reflects the market’s view of long-run inflation and growth, and it anchors the cost of the longest-dated debt in the economy.',
    },
    {
      q: 'What moves the 30-year yield?',
      a: 'Long-run inflation expectations above all, plus the supply of government debt and demand from long-term investors like pension funds and insurers. It is less sensitive to short-term Fed moves than the 2-year, and more sensitive to the long-term inflation and fiscal outlook.',
    },
    {
      q: 'Why does the 30-year yield matter?',
      a: 'It sets the tone for 30-year mortgage rates and long-term corporate borrowing, and it is the market’s cleanest signal on long-run inflation. A rising long bond can pressure rate-sensitive stocks (utilities, REITs) and long-duration growth names.',
    },
    {
      q: 'What is the difference between the 10-year and 30-year yield?',
      a: 'Both are benchmark rates, but the 10-year is the market’s main reference point while the 30-year captures the longest-term view. The gap between them (the "10s30s" spread) shows how much extra yield investors demand to lend for an extra 20 years - a read on long-run inflation and growth expectations.',
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id':   `${BASE}${PATH}`,
        url:     `${BASE}${PATH}`,
        name:    `30-Year Treasury Yield - Live Chart & Rate ${year}`,
        description: 'Live 30-year US Treasury yield chart and rate, and what moves the long bond.',
        isPartOf: { '@id': BASE },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',                   item: BASE },
          { '@type': 'ListItem', position: 2, name: '30-Year Treasury Yield', item: `${BASE}${PATH}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
        <div className="rounded-2xl bg-neutral-800 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none md:gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-900">
                <span className="text-2xl font-bold text-[#c8a45d]">%</span>
              </div>
              <div className="min-w-0">
                <h1 className="flex items-baseline text-xl font-bold" style={{ color: '#fafafa' }}>
                  <span className="shrink-0">US30Y</span>
                  <span className="ml-2 truncate text-base font-normal" style={{ color: '#d4d4d4' }}>
                    &mdash; {NAME}
                  </span>
                </h1>
                <p className="truncate text-xs" style={{ color: '#a3a3a3' }}>
                  CBOE 30-Year US Treasury Bond Yield &middot; Live
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <div className="font-mono text-2xl font-bold" style={{ color: '#fafafa' }}>{valueStr}</div>
                {changePct != null && (
                  <div className={`text-xs font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {up ? '▲' : '▼'} {changeStr} today
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <WatchlistButton symbol={SYMBOL} name={NAME} asset_type="stock" />
                <AlertButton symbol={SYMBOL} name={NAME} asset_type="stock" currentPrice={value ?? undefined} />
              </div>
            </div>
          </div>
        </div>

        <Section title="Chart">
          <WidgetBoundary label="Price Chart">
            <PriceChart symbol={SYMBOL} currentPrice={value ?? 0} prevClose={prevClose} />
          </WidgetBoundary>
        </Section>

        <Section title="Why the 30-Year Yield Matters">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              The long bond sets the price of the economy&rsquo;s longest-dated money:
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {AFFECTS.map((a) => (
                <div key={a.label} className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3">
                  <p className="text-sm font-semibold text-zinc-200">{a.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{a.note}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="About the 30-Year Treasury Yield">
          <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm leading-relaxed text-zinc-400">
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">What is the 30-year Treasury yield?</h3>
              <p>
                The 30-year Treasury yield is the interest rate the US government pays to borrow for three decades - the
                longest standard Treasury, known as the &ldquo;long bond.&rdquo; Because it locks in a rate for so long,
                it is the market&rsquo;s purest read on long-run inflation and growth expectations.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">What moves it?</h3>
              <p>
                Mostly long-run inflation expectations, the government&rsquo;s borrowing needs (bond supply), and demand
                from long-horizon buyers such as pension funds and insurers. It reacts less to day-to-day Fed decisions
                than short-term yields and more to the big-picture inflation and fiscal outlook.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">Why it matters for markets</h3>
              <p>
                The long bond anchors 30-year mortgage rates and long-term corporate borrowing costs. When it rises, the
                most rate-sensitive corners of the market - utilities, REITs, and long-duration growth stocks whose value
                sits decades out - tend to feel it first.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">10-year vs 30-year</h3>
              <p>
                The 10-year is the market&rsquo;s main benchmark; the 30-year is the long-run view. The spread between
                them shows how much extra yield investors demand to lend for another 20 years - a widening gap signals
                rising long-term inflation or growth expectations. Compare it with the{' '}
                <Link href="/10-year-treasury-yield" className="text-emerald-400 hover:text-emerald-300">10-year yield</Link>.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Frequently Asked Questions">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="divide-y divide-zinc-800/60">
              {faqs.map((f) => (
                <details key={f.q} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-zinc-200 marker:hidden">
                    {f.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Explore more">
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              { href: '/10-year-treasury-yield', label: '10-Year Yield' },
              { href: '/2-year-treasury-yield',  label: '2-Year Yield' },
              { href: '/dxy',                    label: 'US Dollar Index' },
              { href: '/stocks',                 label: 'US Stocks' },
              { href: '/screener',               label: 'Stock Screener' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg border border-zinc-700 px-3 py-1.5 font-medium text-zinc-300 transition-colors hover:bg-zinc-800">
                {l.label}
              </Link>
            ))}
          </div>
        </Section>

        <p className="text-[11px] leading-relaxed text-zinc-600">
          Data via Yahoo Finance (CBOE ^TYX), updated in real time during market hours. For informational purposes only -
          not financial advice.
        </p>
      </div>
    </>
  )
}
