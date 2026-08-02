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

const SYMBOL = 'DX-Y.NYB' // ICE US Dollar Index on Yahoo Finance
const NAME = 'US Dollar Index'
const BASE = 'https://stockmarketroi.com'

// ICE US Dollar Index basket (fixed weights since 1999, when the euro replaced
// the five legacy European currencies). The euro dominates, so the DXY is
// largely an EUR/USD trade.
const BASKET = [
  { code: 'EUR', name: 'Euro',            weight: 57.6 },
  { code: 'JPY', name: 'Japanese yen',    weight: 13.6 },
  { code: 'GBP', name: 'British pound',   weight: 11.9 },
  { code: 'CAD', name: 'Canadian dollar', weight: 9.1  },
  { code: 'SEK', name: 'Swedish krona',   weight: 4.2  },
  { code: 'CHF', name: 'Swiss franc',     weight: 3.6  },
]

/** A titled page section - same idiom as the stock/crypto asset pages. */
function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={`space-y-4${id ? ' scroll-mt-24' : ''}`}>
      <h2 className="border-b border-zinc-800 pb-2 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  )
}

async function getDxy(): Promise<{ value: number; prevClose: number } | null> {
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
    title:       `US Dollar Index (DXY) - Live Chart, Price & Analysis ${year}`,
    description: `Live US Dollar Index (DXY) chart and price. See what the dollar index is today, which currencies are in the basket, and what makes the dollar rise or fall - updated in real time.`,
    alternates:  { canonical: `${BASE}/dxy` },
    openGraph: {
      title:       `US Dollar Index (DXY) - Live Chart & Price ${year}`,
      description: `Track the US Dollar Index (DXY) in real time: interactive chart, the six currencies in the basket, and what moves the dollar.`,
    },
    twitter: {
      card:        'summary_large_image',
      title:       `US Dollar Index (DXY) - Live Chart & Price ${year}`,
      description: `Track the US Dollar Index (DXY) in real time: interactive chart, the currency basket, and what moves the dollar.`,
    },
  }
}

export default async function DxyPage() {
  const now   = new Date()
  const year  = now.getFullYear()
  const today = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const dxy       = await getDxy()
  const value     = dxy?.value ?? null
  const prevClose = dxy?.prevClose ?? value ?? 0
  const changePct = value != null && prevClose ? ((value - prevClose) / prevClose) * 100 : null
  const up        = (changePct ?? 0) >= 0
  const valueStr  = value != null ? value.toFixed(2) : '-'
  const changeStr = changePct != null ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '-'

  const faqs = [
    {
      q: 'What is the US Dollar Index (DXY) today?',
      a: value != null
        ? `As of ${today}, the US Dollar Index (DXY) is trading around ${valueStr}, ${up ? 'up' : 'down'} ${Math.abs(changePct ?? 0).toFixed(2)}% on the day. The value on this page updates in real time during market hours.`
        : `The US Dollar Index (DXY) updates live on this page during market hours.`,
    },
    {
      q: 'What is the US Dollar Index?',
      a: 'The US Dollar Index (DXY) measures the value of the US dollar against a basket of six major currencies - the euro, Japanese yen, British pound, Canadian dollar, Swedish krona and Swiss franc. It was set to a base of 100 in March 1973, so a reading of 105 means the dollar is about 5% stronger than that baseline against the basket.',
    },
    {
      q: 'Which currencies are in the DXY?',
      a: 'Six: the euro (57.6%), Japanese yen (13.6%), British pound (11.9%), Canadian dollar (9.1%), Swedish krona (4.2%) and Swiss franc (3.6%). The euro carries by far the largest weight, so the DXY is heavily driven by EUR/USD.',
    },
    {
      q: 'What does a rising DXY mean?',
      a: 'A rising DXY means the dollar is strengthening against the basket. That typically pressures commodities priced in dollars (such as gold and oil), weighs on emerging-market currencies, and can be a headwind for the overseas earnings of US multinationals.',
    },
    {
      q: 'Is a strong dollar good or bad for stocks?',
      a: 'It depends. A strong dollar can dent the reported earnings of US companies with large foreign revenue and pressure commodities, but it also reflects demand for US assets and can cool import-driven inflation. There is no fixed rule - it depends on why the dollar is moving.',
    },
    {
      q: 'How is the US Dollar Index calculated?',
      a: 'The DXY is a geometrically-weighted average of the dollar against its six basket currencies, normalized to a base of 100 from March 1973. Because the euro carries the largest weight, euro moves drive most of the index.',
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id':   `${BASE}/dxy`,
        url:     `${BASE}/dxy`,
        name:    `US Dollar Index (DXY) - Live Chart & Price ${year}`,
        description: 'Live US Dollar Index (DXY) chart and price, the currency basket, and what moves the dollar.',
        isPartOf: { '@id': BASE },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',                  item: BASE },
          { '@type': 'ListItem', position: 2, name: 'US Dollar Index (DXY)', item: `${BASE}/dxy` },
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
        {/* Asset header band - same idiom as the stock/crypto detail pages */}
        <div className="rounded-2xl bg-neutral-800 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none md:gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-900">
                <span className="text-2xl font-bold text-[#c8a45d]">$</span>
              </div>
              <div className="min-w-0">
                <h1 className="flex items-baseline text-xl font-bold" style={{ color: '#fafafa' }}>
                  <span className="shrink-0">DXY</span>
                  <span className="ml-2 truncate text-base font-normal" style={{ color: '#d4d4d4' }}>
                    &mdash; {NAME}
                  </span>
                </h1>
                <p className="truncate text-xs" style={{ color: '#a3a3a3' }}>
                  ICE U.S. Dollar Index &middot; Live
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

        {/* Currency basket */}
        <Section title="Currency Basket">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              The index tracks the dollar against these six currencies, at fixed weights.
            </p>
            <div className="mt-4 divide-y divide-zinc-800/60">
              {BASKET.map((c) => (
                <div key={c.code} className="flex items-center gap-3 py-2.5">
                  <span className="w-12 shrink-0 rounded-md bg-zinc-800 px-2 py-1 text-center text-xs font-bold text-zinc-200">
                    {c.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">{c.name}</span>
                  <span className="w-16 shrink-0 text-right font-mono text-sm font-semibold text-white">
                    {c.weight.toFixed(1)}%
                  </span>
                  <div className="hidden w-40 shrink-0 sm:block">
                    <div className="h-2 rounded-full bg-zinc-800">
                      <div className="h-2 rounded-full bg-emerald-500/70" style={{ width: `${c.weight}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* SEO explainer */}
        <Section title="About the US Dollar Index">
          <div className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm leading-relaxed text-zinc-400">
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">What is the US Dollar Index?</h3>
              <p>
                The US Dollar Index (ticker <strong className="text-zinc-300">DXY</strong>) measures the strength of
                the US dollar against a weighted basket of six major currencies. Created in 1973 with a base value of
                100, it&rsquo;s the most widely-watched gauge of the dollar&rsquo;s overall value - a reading above 100
                means the dollar has gained versus the basket since that baseline, and below 100 means it has weakened.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">What moves the US Dollar Index?</h3>
              <p>
                The dollar index is driven mostly by relative interest rates and growth. When the Federal Reserve raises
                rates or is expected to stay higher-for-longer, dollar-denominated assets pay more and the DXY tends to
                rise. Risk sentiment matters too: in times of stress, investors buy dollars as a safe haven. Because the
                euro is 57.6% of the basket, anything that moves EUR/USD - European Central Bank policy, eurozone growth
                - moves the index almost as much as US data does.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">Is a strong dollar good or bad?</h3>
              <p>
                A stronger dollar makes imports cheaper for Americans and helps cool inflation, but it also makes US
                exports pricier abroad and shrinks the overseas earnings of large US multinationals when converted back
                to dollars. It usually weighs on commodities and emerging markets. Whether it&rsquo;s &ldquo;good&rdquo;
                depends on why it&rsquo;s moving and which side of the trade you&rsquo;re on.
              </p>
            </div>
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">DXY vs EUR/USD</h3>
              <p>
                Because the euro dominates the basket, the DXY and EUR/USD move almost as mirror images: when the euro
                falls against the dollar, the DXY rises, and vice-versa. If you follow the euro, you already have a good
                read on where the dollar index is heading.
              </p>
            </div>
          </div>
        </Section>

        {/* FAQ - native <details> so it&rsquo;s crawlable and works without JS */}
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
              { href: '/stocks',      label: 'US Stocks' },
              { href: '/screener',    label: 'Stock Screener' },
              { href: '/crypto',      label: 'Crypto' },
              { href: '/heatmap',     label: 'Market Heatmap' },
              { href: '/calculators', label: 'Calculators' },
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
          Data from ICE via Yahoo Finance, updated in real time during market hours. For informational purposes only -
          not financial advice.
        </p>
      </div>
    </>
  )
}
