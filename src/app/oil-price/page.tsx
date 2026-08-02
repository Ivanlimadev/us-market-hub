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

const SYMBOL = 'CL=F' // NYMEX WTI Crude Oil Futures (continuous) on Yahoo Finance
const NAME = 'Crude Oil Price'
const BASE = 'https://stockmarketroi.com'
const PATH = '/oil-price'

const AFFECTS = [
  { label: 'Gas & fuel prices', note: 'Crude is the main input in what you pay at the pump.' },
  { label: 'Inflation', note: 'Energy feeds straight into CPI and the cost of everything.' },
  { label: 'Energy stocks', note: 'Exxon, Chevron & drillers rise and fall with crude.' },
  { label: 'Airlines & transport', note: 'Fuel is a huge cost - cheap oil helps, dear oil hurts.' },
]

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={`space-y-4${id ? ' scroll-mt-24' : ''}`}>
      <h2 className="border-b border-zinc-800 pb-2 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  )
}

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function getPrice(): Promise<{ value: number; prevClose: number } | null> {
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
    title:       `Oil Price Today - Live WTI Crude Oil Chart & Price ${year}`,
    description: `Live crude oil price (WTI) and interactive chart. See the oil price today per barrel, what moves it - OPEC, supply, demand and geopolitics - updated in real time.`,
    alternates:  { canonical: `${BASE}${PATH}` },
    openGraph: {
      title:       `Oil Price Today - Live WTI Crude Oil Chart & Price ${year}`,
      description: `Track the WTI crude oil price in real time: interactive chart and what moves oil - OPEC, supply, demand and geopolitics.`,
    },
    twitter: {
      card:        'summary_large_image',
      title:       `Oil Price Today - Live WTI Crude Oil Chart & Price ${year}`,
      description: `Track the WTI crude oil price in real time and see what moves it.`,
    },
  }
}

export default async function OilPage() {
  const now   = new Date()
  const year  = now.getFullYear()
  const today = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const q         = await getPrice()
  const value     = q?.value ?? null
  const prevClose = q?.prevClose ?? value ?? 0
  const changePct = value != null && prevClose ? ((value - prevClose) / prevClose) * 100 : null
  const up        = (changePct ?? 0) >= 0
  const valueStr  = value != null ? usd(value) : '-'
  const changeStr = changePct != null ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '-'

  const faqs = [
    {
      q: 'What is the price of oil today?',
      a: value != null
        ? `As of ${today}, WTI crude oil is trading around ${valueStr} per barrel, ${up ? 'up' : 'down'} ${Math.abs(changePct ?? 0).toFixed(2)}% on the day. The price on this page updates in real time during market hours.`
        : `The WTI crude oil price updates live on this page during market hours.`,
    },
    {
      q: 'What moves the oil price?',
      a: 'Supply and demand, plus geopolitics. On supply: OPEC+ production decisions, US shale output, and disruptions from conflict or sanctions. On demand: global growth, especially China. A stronger dollar also tends to weigh on oil, since crude is priced in dollars.',
    },
    {
      q: 'What is the difference between WTI and Brent crude?',
      a: 'Both are benchmark oil prices. WTI (West Texas Intermediate) is the US benchmark, priced at Cushing, Oklahoma. Brent is the international benchmark, priced in the North Sea. Brent usually trades a few dollars above WTI and reflects global conditions more directly.',
    },
    {
      q: 'Why does the oil price matter for stocks?',
      a: 'Oil ripples through the whole market. Rising crude lifts energy stocks like ExxonMobil and Chevron but squeezes airlines, shippers and consumers, and it pushes up inflation - which can force central banks to keep rates higher. Cheap oil does the reverse.',
    },
    {
      q: 'Why does oil affect inflation?',
      a: 'Energy is an input to almost everything - transport, manufacturing, food. When crude rises, those costs pass through to prices across the economy, lifting headline inflation. That is why an oil spike often shows up in the next CPI report.',
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id':   `${BASE}${PATH}`,
        url:     `${BASE}${PATH}`,
        name:    `Oil Price Today - Live WTI Crude Oil Chart & Price ${year}`,
        description: 'Live WTI crude oil price and chart, and what moves oil.',
        isPartOf: { '@id': BASE },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',      item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Oil Price', item: `${BASE}${PATH}` },
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
                <span className="text-lg font-bold text-[#c8a45d]">WTI</span>
              </div>
              <div className="min-w-0">
                <h1 className="flex items-baseline text-xl font-bold" style={{ color: '#fafafa' }}>
                  <span className="shrink-0">OIL</span>
                  <span className="ml-2 truncate text-base font-normal" style={{ color: '#d4d4d4' }}>
                    &mdash; {NAME} (WTI)
                  </span>
                </h1>
                <p className="truncate text-xs" style={{ color: '#a3a3a3' }}>
                  WTI Crude Oil Futures &middot; per barrel &middot; Live
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

        <Section title="What Moves the Oil Price">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Crude is set by a global tug-of-war between supply, demand and politics:</p>
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

        <Section title="About Crude Oil">
          <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm leading-relaxed text-zinc-400">
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">What drives the oil price?</h3>
              <p>
                Supply, demand and geopolitics. OPEC+ output cuts or increases, US shale production, and conflict or
                sanctions set supply; global growth - especially China - sets demand. Because oil is priced in dollars, a
                stronger{' '}
                <Link href="/dxy" className="text-emerald-400 hover:text-emerald-300">US dollar</Link>{' '}
                tends to push crude lower, and a weaker one lifts it.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">WTI vs Brent</h3>
              <p>
                WTI (West Texas Intermediate) is the US oil benchmark; Brent is the global one, priced in the North Sea.
                Brent usually trades a few dollars above WTI and reflects international supply/demand more directly. This
                page tracks WTI, the reference for US markets.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">Oil, inflation and stocks</h3>
              <p>
                Energy is an input to nearly everything, so a spike in crude lifts inflation and can keep interest rates
                higher for longer. Rising oil boosts energy stocks like ExxonMobil and Chevron but pressures airlines,
                shippers and consumers - one reason a sharp oil move can swing the whole market.
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
              { href: '/gold-price',             label: 'Gold Price' },
              { href: '/dxy',                    label: 'US Dollar Index' },
              { href: '/10-year-treasury-yield', label: '10-Year Yield' },
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
          Data via Yahoo Finance (NYMEX CL=F, continuous), updated in real time during market hours. For informational
          purposes only - not financial advice.
        </p>
      </div>
    </>
  )
}
