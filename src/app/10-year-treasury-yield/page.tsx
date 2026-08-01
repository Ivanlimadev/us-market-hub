import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { getYFChart } from '@/lib/yahoo-finance'
import { PriceChart } from '@/components/stock/PriceChart'
import { WatchlistButton } from '@/components/watchlist/WatchlistButton'
import { AlertButton } from '@/components/watchlist/AlertButton'
import { WidgetBoundary } from '@/components/ui/WidgetBoundary'

// ISR: render on first request, refresh the live hero value every 5 minutes.
export const revalidate = 300

const SYMBOL = '^TNX' // CBOE 10-Year US Treasury Note Yield on Yahoo Finance
const NAME = '10-Year Treasury Yield'
const BASE = 'https://stockmarketroi.com'
const PATH = '/10-year-treasury-yield'

// What the 10-year yield sets the price of — a quick "why it matters" panel.
const AFFECTS = [
  { label: 'Mortgage rates', note: '30-year mortgages track the 10-year closely.' },
  { label: 'Stock valuations', note: 'Higher yields lower the value of future profits (P/E).' },
  { label: 'The US dollar', note: 'Rising yields tend to strengthen the dollar.' },
  { label: 'Savings & CDs', note: 'Sets the floor for “risk-free” returns you can earn.' },
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
    title:       `10-Year Treasury Yield — Live Chart & Rate Today ${year}`,
    description: `Live 10-year US Treasury yield chart and rate. See the 10-year yield today, what moves it, and why it drives mortgage rates, stocks and the dollar — updated in real time.`,
    alternates:  { canonical: `${BASE}${PATH}` },
    openGraph: {
      title:       `10-Year Treasury Yield — Live Chart & Rate ${year}`,
      description: `Track the 10-year US Treasury yield in real time: interactive chart and what moves the most important interest rate in markets.`,
    },
    twitter: {
      card:        'summary_large_image',
      title:       `10-Year Treasury Yield — Live Chart & Rate ${year}`,
      description: `Track the 10-year US Treasury yield in real time and see why it drives mortgages, stocks and the dollar.`,
    },
  }
}

export default async function TenYearYieldPage() {
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
      q: 'What is the 10-year Treasury yield today?',
      a: value != null
        ? `As of ${today}, the 10-year US Treasury yield is around ${valueStr}, ${up ? 'up' : 'down'} ${Math.abs(changePct ?? 0).toFixed(2)}% on the day. The rate on this page updates in real time during market hours.`
        : `The 10-year US Treasury yield updates live on this page during market hours.`,
    },
    {
      q: 'What is the 10-year Treasury yield?',
      a: 'It is the interest rate the US government pays to borrow money for 10 years. Because US Treasuries are considered risk-free, the 10-year yield is the benchmark "risk-free rate" that almost every other interest rate — and asset price — is measured against.',
    },
    {
      q: 'What moves the 10-year Treasury yield?',
      a: 'Mainly inflation expectations, Federal Reserve policy, and demand for safe assets. When investors expect higher inflation or a hawkish Fed, they sell bonds and the yield rises. In times of fear, they buy Treasuries as a safe haven, pushing the yield down.',
    },
    {
      q: 'Why does the 10-year yield matter for stocks?',
      a: 'The 10-year yield is the discount rate for future profits. When it rises, those future earnings are worth less today, which compresses stock valuations (P/E ratios) — especially for high-growth companies. It also competes with stocks: a higher risk-free yield makes bonds more attractive versus equities.',
    },
    {
      q: 'Why does bond yield go up when the price goes down?',
      a: 'A bond pays a fixed coupon. If its market price falls, that fixed payment represents a larger percentage of the lower price — so the yield rises. Price and yield always move in opposite directions.',
    },
    {
      q: 'What is the difference between the 2-year, 10-year and 30-year yields?',
      a: 'They are the same idea over different time horizons. The 2-year tracks near-term Fed expectations, the 10-year is the market benchmark, and the 30-year reflects long-run inflation and growth views. When short-term yields rise above long-term ones (an "inverted yield curve"), it has historically warned of recession.',
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id':   `${BASE}${PATH}`,
        url:     `${BASE}${PATH}`,
        name:    `10-Year Treasury Yield — Live Chart & Rate ${year}`,
        description: 'Live 10-year US Treasury yield chart and rate, and what moves the benchmark interest rate.',
        isPartOf: { '@id': BASE },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',                   item: BASE },
          { '@type': 'ListItem', position: 2, name: '10-Year Treasury Yield', item: `${BASE}${PATH}` },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
        {/* Asset header band */}
        <div className="rounded-2xl bg-neutral-800 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none md:gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-900">
                <span className="text-2xl font-bold text-[#c8a45d]">%</span>
              </div>
              <div className="min-w-0">
                <h1 className="flex items-baseline text-xl font-bold" style={{ color: '#fafafa' }}>
                  <span className="shrink-0">US10Y</span>
                  <span className="ml-2 truncate text-base font-normal" style={{ color: '#d4d4d4' }}>
                    &mdash; {NAME}
                  </span>
                </h1>
                <p className="truncate text-xs" style={{ color: '#a3a3a3' }}>
                  CBOE 10-Year US Treasury Note Yield &middot; Live
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

        {/* Chart */}
        <Section title="Chart">
          <WidgetBoundary label="Price Chart">
            <PriceChart symbol={SYMBOL} currentPrice={value ?? 0} prevClose={prevClose} />
          </WidgetBoundary>
        </Section>

        {/* What it affects */}
        <Section title="Why the 10-Year Yield Matters">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              The 10-year is the benchmark rate that ripples through the whole economy — it helps set the price of:
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

        {/* SEO explainer */}
        <Section title="About the 10-Year Treasury Yield">
          <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm leading-relaxed text-zinc-400">
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">What is the 10-year Treasury yield?</h3>
              <p>
                The 10-year Treasury yield is the interest rate the US government pays to borrow money for a decade. Since
                US government debt is treated as risk-free, this yield is the single most-watched interest rate in the
                world — the benchmark against which mortgages, corporate bonds, and even stock valuations are priced.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">What moves it?</h3>
              <p>
                Three forces: inflation expectations, Federal Reserve policy, and safe-haven demand. Hotter inflation or a
                hawkish Fed pushes the yield up as investors demand more to lend long-term; fear and flight-to-safety pull
                it down as buyers pile into Treasuries. Because price and yield move in opposite directions, heavy buying
                lowers the yield and heavy selling raises it.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">Why it matters for stocks</h3>
              <p>
                The 10-year is the discount rate for future earnings. When it rises, tomorrow&rsquo;s profits are worth
                less today, which squeezes valuations — hardest on high-growth names whose value sits far in the future.
                It&rsquo;s also competition: when a risk-free bond yields 4–5%, investors demand more from stocks to
                justify the extra risk. That&rsquo;s why a spike in the 10-year so often triggers a selloff.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">The yield curve (2Y vs 10Y vs 30Y)</h3>
              <p>
                Compare the 10-year with the 2-year and 30-year and you get the &ldquo;yield curve.&rdquo; Normally longer
                maturities pay more. When short-term yields climb above the 10-year — an <em>inverted</em> curve — it has
                preceded every US recession in recent history, which is why investors watch the spread so closely.
              </p>
            </div>
          </div>
        </Section>

        {/* FAQ */}
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

        {/* Internal links */}
        <Section title="Explore more">
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              { href: '/30-year-treasury-yield', label: '30-Year Yield' },
              { href: '/2-year-treasury-yield',  label: '2-Year Yield' },
              { href: '/dxy',                    label: 'US Dollar Index (DXY)' },
              { href: '/stocks',                 label: 'US Stocks' },
              { href: '/screener',               label: 'Stock Screener' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </Section>

        <p className="text-[11px] leading-relaxed text-zinc-600">
          Data via Yahoo Finance (CBOE ^TNX), updated in real time during market hours. For informational purposes only —
          not financial advice.
        </p>
      </div>
    </>
  )
}
