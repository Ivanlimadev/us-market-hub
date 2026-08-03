import type { Metadata } from 'next'
import Link from 'next/link'
import { GLOSSARY, GLOSSARY_CATEGORIES } from '@/lib/glossary'

export const metadata: Metadata = {
  title: 'Stock Market Glossary: Key Ratios & Terms Explained',
  description:
    'Plain-English definitions of the stock market metrics that matter: P/E, P/B, PEG, dividend yield, EPS, ROE, market cap, beta and more. With formulas and examples.',
  alternates: { canonical: 'https://stockmarketroi.com/glossary' },
  openGraph: {
    title: 'Stock Market Glossary: Key Ratios & Terms Explained',
    description:
      'Plain-English definitions of the stock market metrics that matter, with formulas and examples.',
    type: 'website',
  },
}

export default function GlossaryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Stock Market Glossary',
    url: 'https://stockmarketroi.com/glossary',
    hasDefinedTerm: GLOSSARY.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.short,
      url: `https://stockmarketroi.com/glossary/${t.slug}`,
    })),
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="mb-3 text-3xl font-bold text-zinc-100">Stock Market Glossary</h1>
      <p className="mb-10 max-w-2xl leading-relaxed text-zinc-400">
        The metrics behind every stock, explained in plain English. Each term includes a clear
        definition, the formula, a worked example, and what counts as a good value. New to investing?
        Start with the{' '}
        <Link href="/glossary/pe-ratio" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
          P/E ratio
        </Link>{' '}
        and{' '}
        <Link href="/glossary/dividend-yield" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
          dividend yield
        </Link>
        .
      </p>

      {GLOSSARY_CATEGORIES.map((cat) => {
        const terms = GLOSSARY.filter((t) => t.category === cat)
        if (!terms.length) return null
        return (
          <section key={cat} className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#c8a45d]">
              {cat}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {terms.map((t) => (
                <Link
                  key={t.slug}
                  href={`/glossary/${t.slug}`}
                  className="group flex flex-col gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
                >
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-bold text-zinc-100 group-hover:text-white">
                      {t.term}
                    </h3>
                    {t.fullName && (
                      <span className="text-xs text-zinc-500">{t.fullName}</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-400">{t.short}</p>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      <section className="mt-6 border-t border-zinc-800 pt-8 text-sm leading-relaxed text-zinc-400">
        <p>
          Understanding these ratios turns a wall of numbers into a story about a business. See them
          live on any{' '}
          <Link href="/stocks/AAPL" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
            stock analysis page
          </Link>
          , or filter the whole market by them with the{' '}
          <Link href="/screener" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
            stock screener
          </Link>
          .
        </p>
      </section>
    </main>
  )
}
