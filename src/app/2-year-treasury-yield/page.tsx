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

const SYMBOL = '2YY=F' // 2-Year US Treasury Yield (continuous) on Yahoo Finance
const NAME = '2-Year Treasury Yield'
const BASE = 'https://stockmarketroi.com'
const PATH = '/2-year-treasury-yield'

const AFFECTS = [
  { label: 'Fed rate expectations', note: 'The market’s cleanest bet on where the Fed is headed.' },
  { label: 'The 2s10s spread', note: 'Vs the 10-year, it’s the classic recession signal.' },
  { label: 'Short-term borrowing', note: 'Anchors car loans, credit and short business debt.' },
  { label: 'Savings & CD rates', note: 'Sets what cash and short CDs can earn.' },
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
    title:       `2-Year Treasury Yield — Live Chart & Rate Today ${year}`,
    description: `Live 2-year US Treasury yield chart and rate. See the 2-year yield today, how it tracks Fed policy, and the 2s10s spread that has warned of every recent recession.`,
    alternates:  { canonical: `${BASE}${PATH}` },
    openGraph: {
      title:       `2-Year Treasury Yield — Live Chart & Rate ${year}`,
      description: `Track the 2-year US Treasury yield in real time: the market’s best read on Fed policy, plus the 2s10s recession signal.`,
    },
    twitter: {
      card:        'summary_large_image',
      title:       `2-Year Treasury Yield — Live Chart & Rate ${year}`,
      description: `Track the 2-year US Treasury yield in real time — the market’s best read on where the Fed is headed.`,
    },
  }
}

export default async function TwoYearYieldPage() {
  const now   = new Date()
  const year  = now.getFullYear()
  const today = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const yld       = await getYield()
  const value     = yld?.value ?? null
  const prevClose = yld?.prevClose ?? value ?? 0
  const changePct = value != null && prevClose ? ((value - prevClose) / prevClose) * 100 : null
  const up        = (changePct ?? 0) >= 0
  const valueStr  = value != null ? `${value.toFixed(2)}%` : '—'
  const changeStr = changePct != null ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '—'

  const faqs = [
    {
      q: 'What is the 2-year Treasury yield today?',
      a: value != null
        ? `As of ${today}, the 2-year US Treasury yield is around ${valueStr}, ${up ? 'up' : 'down'} ${Math.abs(changePct ?? 0).toFixed(2)}% on the day. The rate on this page updates in real time during market hours.`
        : `The 2-year US Treasury yield updates live on this page during market hours.`,
    },
    {
      q: 'What is the 2-year Treasury yield?',
      a: 'It is the interest rate the US government pays to borrow for two years. Because two years is close enough to see where Federal Reserve policy is heading but far enough to price in changes, the 2-year is the market’s best gauge of the expected path of the Fed’s interest rate.',
    },
    {
      q: 'What moves the 2-year yield?',
      a: 'Federal Reserve policy and rate expectations, above all. When markets expect the Fed to hike or stay higher-for-longer, the 2-year rises quickly; when they expect cuts, it falls. It reacts far more to Fed signals and short-term data than the 10-year or 30-year.',
    },
    {
      q: 'What is the 2s10s spread and why does it matter?',
      a: 'The 2s10s spread is the 10-year yield minus the 2-year yield. Normally it is positive (longer loans pay more). When it turns negative — the 2-year rising above the 10-year, an "inverted yield curve" — it has preceded every US recession in recent history, which is why investors watch it so closely.',
    },
    {
      q: 'Why does bond yield rise when the price falls?',
      a: 'A bond pays a fixed coupon. If its market price drops, that fixed payment is a bigger share of the lower price, so the yield goes up. Price and yield always move in opposite directions.',
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id':   `${BASE}${PATH}`,
        url:     `${BASE}${PATH}`,
        name:    `2-Year Treasury Yield — Live Chart & Rate ${year}`,
        description: 'Live 2-year US Treasury yield chart and rate, Fed expectations, and the 2s10s recession signal.',
        isPartOf: { '@id': BASE },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',                  item: BASE },
          { '@type': 'ListItem', position: 2, name: '2-Year Treasury Yield', item: `${BASE}${PATH}` },
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
                  <span className="shrink-0">US2Y</span>
                  <span className="ml-2 truncate text-base font-normal" style={{ color: '#d4d4d4' }}>
                    &mdash; {NAME}
                  </span>
                </h1>
                <p className="truncate text-xs" style={{ color: '#a3a3a3' }}>
                  2-Year US Treasury Yield &middot; Live
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

        <Section title="Why the 2-Year Yield Matters">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              The 2-year is the market&rsquo;s read on the Fed — and half of the most-watched recession signal:
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

        <Section title="About the 2-Year Treasury Yield">
          <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm leading-relaxed text-zinc-400">
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">What is the 2-year Treasury yield?</h3>
              <p>
                The 2-year Treasury yield is the interest rate the US government pays to borrow for two years. Its short
                maturity makes it the market&rsquo;s single best gauge of where the Federal Reserve is likely to take
                interest rates — it tracks Fed expectations more tightly than any other benchmark.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">What moves it?</h3>
              <p>
                The Fed. When investors expect rate hikes or a &ldquo;higher-for-longer&rdquo; stance, the 2-year jumps;
                when they expect cuts, it drops. Inflation prints and jobs data move it fast because they reshape those
                Fed bets. It is far more sensitive to short-term policy than the 10-year or 30-year.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">The 2s10s recession signal</h3>
              <p>
                Subtract the 2-year from the{' '}
                <Link href="/10-year-treasury-yield" className="text-emerald-400 hover:text-emerald-300">10-year yield</Link>{' '}
                and you get the &ldquo;2s10s&rdquo; spread. When it goes negative — the 2-year above the 10-year, an
                inverted curve — it has warned of every US recession in recent decades. That is why a rising 2-year, even
                as long rates lag, makes markets nervous.
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
              { href: '/30-year-treasury-yield', label: '30-Year Yield' },
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
          Data via Yahoo Finance (2-year Treasury yield, continuous), updated in real time during market hours. For
          informational purposes only — not financial advice.
        </p>
      </div>
    </>
  )
}
