import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GLOSSARY, GLOSSARY_SLUGS, getTerm } from '@/lib/glossary'

export const dynamicParams = false

export function generateStaticParams() {
  return GLOSSARY_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const t = getTerm(slug)
  if (!t) return {}
  const label = t.fullName ? `${t.term} (${t.fullName})` : t.term
  return {
    title: `${label}: Definition, Formula & Example | Stock Market ROI`,
    description: t.short,
    alternates: { canonical: `https://stockmarketroi.com/glossary/${t.slug}` },
    openGraph: {
      title: `${label} Explained`,
      description: t.short,
      type: 'article',
    },
  }
}

// Live examples: links to real, indexable stock pages so the glossary feeds
// internal links back into the stock universe (lowercase paths = no 301 hop).
const LIVE_EXAMPLES = ['aapl', 'msft', 'nvda', 'googl']

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const t = getTerm(slug)
  if (!t) notFound()

  const related = t.related.map(getTerm).filter(Boolean)
  const label = t.fullName ? `${t.term} (${t.fullName})` : t.term

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DefinedTerm',
        name: t.term,
        alternateName: t.fullName,
        description: t.short,
        url: `https://stockmarketroi.com/glossary/${t.slug}`,
        inDefinedTermSet: 'https://stockmarketroi.com/glossary',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stockmarketroi.com' },
          { '@type': 'ListItem', position: 2, name: 'Glossary', item: 'https://stockmarketroi.com/glossary' },
          { '@type': 'ListItem', position: 3, name: t.term, item: `https://stockmarketroi.com/glossary/${t.slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `What is ${t.term}?`,
            acceptedAnswer: { '@type': 'Answer', text: t.definition },
          },
          {
            '@type': 'Question',
            name: `What is a good ${t.term}?`,
            acceptedAnswer: { '@type': 'Answer', text: t.goodValue },
          },
        ],
      },
    ],
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/glossary" className="hover:text-zinc-300">Glossary</Link>
        <span className="mx-1.5">/</span>
        <span className="text-zinc-400">{t.term}</span>
      </nav>

      <span className="text-xs font-semibold uppercase tracking-wider text-[#c8a45d]">
        {t.category}
      </span>
      <h1 className="mt-1 mb-2 text-3xl font-bold text-zinc-100">{label}</h1>
      <p className="mb-8 text-lg leading-relaxed text-zinc-300">{t.short}</p>

      <div className="space-y-8 text-[15px] leading-relaxed text-zinc-300">
        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-100">What it means</h2>
          <p>{t.definition}</p>
        </section>

        {t.formula && (
          <section>
            <h2 className="mb-2 text-lg font-bold text-zinc-100">Formula</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-emerald-300">
              {t.formula}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-100">Example</h2>
          <p>{t.example}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-100">What is a good {t.term}?</h2>
          <p>{t.goodValue}</p>
        </section>

        {/* Tool CTA */}
        <Link
          href={t.tool.href}
          className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 transition-colors hover:bg-emerald-500/15"
        >
          <span className="text-sm font-semibold text-emerald-300">{t.tool.label}</span>
          <span className="text-emerald-400">→</span>
        </Link>

        {/* See it live on real stocks */}
        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-100">See it on real stocks</h2>
          <p className="mb-3">
            Every stock analysis page shows {t.term} alongside the other key metrics:
          </p>
          <div className="flex flex-wrap gap-2">
            {LIVE_EXAMPLES.map((sym) => (
              <Link
                key={sym}
                href={`/stocks/${sym}`}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                {sym.toUpperCase()}
              </Link>
            ))}
          </div>
        </section>

        {/* Related terms */}
        {related.length > 0 && (
          <section className="border-t border-zinc-800 pt-6">
            <h2 className="mb-3 text-lg font-bold text-zinc-100">Related terms</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r!.slug}
                  href={`/glossary/${r!.slug}`}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                >
                  {r!.term}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
