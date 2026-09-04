'use client'
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

/**
 * "The Story of [Company]" card shown on a stock page when we have a full
 * long-form biography post for that ticker. Shows a ~150-word preview and links
 * to the complete history article. Static by design (no fetch): we only have a
 * handful of biographies, so hardcoding the preview is robust and zero-risk, and
 * keeps the full content living only in the blog post (good for SEO).
 */

type Story = { company: string; slug: string; preview: string }

const STORIES: Record<string, Story> = {
  NVDA: {
    company: 'Nvidia',
    slug: 'nvidia-complete-history-1993-2026-gpu-to-ai-empire',
    preview:
      'Few company stories are as improbable as Nvidia’s. On January 25, 1993, Jensen Huang, Chris Malachowsky and Curtis Priem founded the company at a Denny’s restaurant in San Jose, naming it after "invidia," the Latin word for envy. The early years were brutal: its first chip flopped and it nearly went bankrupt. But in 1999 Nvidia went public and launched the GeForce 256, billed as the world’s first GPU. Its 2006 bet on CUDA, a way to use gaming chips for general computing, looked like a distraction at the time. It became the deepest moat in tech, and the foundation of the AI revolution that would one day make Nvidia the most valuable company on Earth.',
  },
  TSLA: {
    company: 'Tesla',
    slug: 'tesla-complete-history-2003-2026-roadster-to-robotaxi',
    preview:
      'No company divides opinion like Tesla. Founded on July 1, 2003 by Martin Eberhard and Marc Tarpenning, it was nearly bankrupt by Christmas Eve 2008, when Elon Musk poured in his last personal funds to save it. It went public in 2010, the first American automaker to IPO since Ford in 1956. The Model S proved electric cars could be desirable, and the Model 3 pushed Tesla through "production hell" to become the best-selling EV in the world. After blowing past a $1 trillion valuation, Tesla is now reinventing itself again, betting its future on robotaxis and humanoid robots rather than just cars.',
  },
  AAPL: {
    company: 'Apple',
    slug: 'apple-complete-history-1976-2026-garage-to-trillions',
    preview:
      'Apple’s story is the ultimate business epic. Founded on April 1, 1976 by Steve Jobs, Steve Wozniak and Ronald Wayne in a Los Altos garage, it struck gold with the Apple II before going public in 1980. But by 1997 Apple was roughly 90 days from bankruptcy, saved only when Steve Jobs returned and rival Microsoft invested $150 million to keep it alive. What followed was the greatest comeback in business history: the iMac, the iPod, and in 2007 the iPhone, which created the modern world. From a garage to the first company worth over $4 trillion, no journey in business is quite like it.',
  },
}

export function CompanyStoryCard({ symbol }: { symbol: string }) {
  const story = STORIES[symbol.toUpperCase()]
  if (!story) return null

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/40 p-6">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#c8a45d]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#c8a45d]">
          The Story of {story.company}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">{story.preview}</p>
      <Link
        href={`/blog/${story.slug}`}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#c8a45d] px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-[#d9b86e]"
      >
        Read the full story
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
