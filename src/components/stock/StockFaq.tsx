import { ChevronDown } from 'lucide-react'
import type { StockFaq } from '@/lib/stock-seo'

/** Server-rendered intro paragraph - crawlable long-tail content. */
export function StockSeoIntro({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm leading-relaxed text-zinc-400">
      {text}
    </p>
  )
}

/** Server-rendered FAQ accordion using native <details> (works without JS). */
export function StockFaqSection({ faqs, symbol }: { faqs: StockFaq[]; symbol: string }) {
  if (!faqs.length) return null
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="mb-4 text-base font-semibold text-zinc-200">
        {symbol} - Frequently Asked Questions
      </h2>
      <div className="divide-y divide-zinc-800/60">
        {faqs.map((f) => (
          <details key={f.question} className="group py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-zinc-200 marker:hidden">
              {f.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
