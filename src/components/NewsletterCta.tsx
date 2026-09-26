import { Mail, ArrowRight } from 'lucide-react'

// Low-friction capture: a free-newsletter CTA that sends readers to our Substack
// subscribe page. This is the missing top-of-funnel step that turns a one-time
// visitor (paid or organic) into a subscriber who comes back.
const SUBSTACK_SUBSCRIBE = 'https://stockmarketroi.substack.com/subscribe'

export function NewsletterCta() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/40 p-6">
      <div className="mb-3 flex items-center gap-2">
        <Mail className="h-4 w-4 text-[#c8a45d]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#c8a45d]">
          Free newsletter
        </span>
      </div>
      <h3 className="text-lg font-bold text-white">Get the weekly market breakdown</h3>
      <p className="mt-1 text-sm leading-relaxed text-zinc-300">
        Real numbers, plain English, no hype. The stories and data that actually move stocks and
        crypto, straight to your inbox.
      </p>
      <a
        href={SUBSTACK_SUBSCRIBE}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#c8a45d] px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-[#d9b86e]"
      >
        Subscribe free
        <ArrowRight className="h-4 w-4" />
      </a>
    </section>
  )
}
