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

const SYMBOL = 'GC=F' // COMEX Gold Futures (continuous) on Yahoo Finance
const NAME = 'Gold Price'
const BASE = 'https://stockmarketroi.com'
const PATH = '/gold-price'

const AFFECTS = [
  { label: 'Inflation hedge', note: 'Investors buy gold to protect purchasing power.' },
  { label: 'The US dollar', note: 'Gold usually moves inverse to the dollar.' },
  { label: 'Real interest rates', note: 'Higher real yields make non-paying gold less attractive.' },
  { label: 'Safe-haven demand', note: 'Fear and crisis send money into gold.' },
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
    title:       `Gold Price Today — Live Gold Chart & Price per Ounce ${year}`,
    description: `Live gold price and interactive chart. See the price of gold today per ounce, what moves it, and why gold trades as an inflation hedge and safe haven — updated in real time.`,
    alternates:  { canonical: `${BASE}${PATH}` },
    openGraph: {
      title:       `Gold Price Today — Live Chart & Price per Ounce ${year}`,
      description: `Track the gold price in real time: interactive chart and what moves gold — the dollar, real rates and safe-haven demand.`,
    },
    twitter: {
      card:        'summary_large_image',
      title:       `Gold Price Today — Live Chart & Price per Ounce ${year}`,
      description: `Track the gold price in real time and see what moves it.`,
    },
  }
}

export default async function GoldPage() {
  const now   = new Date()
  const year  = now.getFullYear()
  const today = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const q         = await getPrice()
  const value     = q?.value ?? null
  const prevClose = q?.prevClose ?? value ?? 0
  const changePct = value != null && prevClose ? ((value - prevClose) / prevClose) * 100 : null
  const up        = (changePct ?? 0) >= 0
  const valueStr  = value != null ? usd(value) : '—'
  const changeStr = changePct != null ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '—'

  const faqs = [
    {
      q: 'What is the price of gold today?',
      a: value != null
        ? `As of ${today}, gold is trading around ${valueStr} per troy ounce, ${up ? 'up' : 'down'} ${Math.abs(changePct ?? 0).toFixed(2)}% on the day. The price on this page updates in real time during market hours.`
        : `The gold price updates live on this page during market hours.`,
    },
    {
      q: 'What moves the gold price?',
      a: 'Four big forces: the US dollar (gold usually moves inverse to it), real interest rates (higher real yields make non-yielding gold less attractive), inflation expectations, and safe-haven demand during crises. Central bank buying and jewelry/industrial demand matter too.',
    },
    {
      q: 'Is gold a good inflation hedge?',
      a: 'Over long periods gold has broadly held its purchasing power, which is why it is seen as an inflation hedge. Over shorter windows it can lag — especially when real interest rates rise — so it protects against currency debasement better than against every inflationary episode.',
    },
    {
      q: 'Why does gold go up when the dollar falls?',
      a: 'Gold is priced in dollars, so a weaker dollar makes gold cheaper for buyers using other currencies, lifting demand and the price. A stronger dollar does the reverse. That inverse link is one of the most reliable relationships in markets.',
    },
    {
      q: 'How can I invest in gold?',
      a: 'Common routes are physical gold (coins/bars), gold ETFs such as GLD or IAU, gold-mining stocks, and futures. Each has different costs and risks — ETFs are the simplest for most investors, while miners add company-specific and leverage risk.',
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id':   `${BASE}${PATH}`,
        url:     `${BASE}${PATH}`,
        name:    `Gold Price Today — Live Chart & Price per Ounce ${year}`,
        description: 'Live gold price and chart, and what moves gold.',
        isPartOf: { '@id': BASE },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',       item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Gold Price', item: `${BASE}${PATH}` },
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
                <span className="text-xl font-bold text-[#c8a45d]">Au</span>
              </div>
              <div className="min-w-0">
                <h1 className="flex items-baseline text-xl font-bold" style={{ color: '#fafafa' }}>
                  <span className="shrink-0">GOLD</span>
                  <span className="ml-2 truncate text-base font-normal" style={{ color: '#d4d4d4' }}>
                    &mdash; {NAME}
                  </span>
                </h1>
                <p className="truncate text-xs" style={{ color: '#a3a3a3' }}>
                  COMEX Gold Futures &middot; per troy ounce &middot; Live
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

        <Section title="What Moves the Gold Price">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Gold has no earnings — its price is set by these forces:</p>
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

        <Section title="About Gold">
          <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm leading-relaxed text-zinc-400">
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">What drives the price of gold?</h3>
              <p>
                Because gold pays no interest or dividends, its price is driven by what it is measured against. A weaker
                US dollar and lower real interest rates make gold more attractive; a stronger dollar and higher real
                yields do the opposite. Layer in inflation fears and safe-haven demand during crises, and you have the
                core of every gold move.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">Gold vs the US dollar</h3>
              <p>
                Gold and the{' '}
                <Link href="/dxy" className="text-emerald-400 hover:text-emerald-300">US Dollar Index</Link>{' '}
                tend to move in opposite directions. When the dollar weakens, gold priced in dollars becomes cheaper for
                the rest of the world, boosting demand — and vice-versa.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">Gold vs interest rates</h3>
              <p>
                Gold&rsquo;s biggest competitor is the &ldquo;risk-free&rdquo; yield on Treasuries. When the{' '}
                <Link href="/10-year-treasury-yield" className="text-emerald-400 hover:text-emerald-300">10-year yield</Link>{' '}
                rises (after inflation), holding non-yielding gold costs more in forgone interest, which usually caps its
                price. Falling real rates are gold&rsquo;s best friend.
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
              { href: '/oil-price',              label: 'Oil Price' },
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
          Data via Yahoo Finance (COMEX GC=F, continuous), updated in real time during market hours. For informational
          purposes only — not financial advice.
        </p>
      </div>
    </>
  )
}
