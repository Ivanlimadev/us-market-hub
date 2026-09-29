import { createClient } from '@supabase/supabase-js'

// Structured signal derived from our own blog posts (green: own content). We
// return the machine-useful signal a robot actually wants (verdict, tickers,
// link, summary), NOT the prose. The verdict is parsed from the bold
// BUY/HOLD/AVOID marker the posts carry in their conclusion.

export interface BlogSignal {
  slug: string
  url: string
  title: string
  publishedAt: string
  category: string
  tickers: string[]
  verdict: 'BUY' | 'HOLD' | 'AVOID' | null
  summary: string
}

export interface BlogAnalysisResult {
  ok: boolean
  data: BlogSignal[]
  error?: string
}

interface Row {
  slug: string
  title: string
  excerpt: string | null
  published_at: string
  category: string
  tickers: string[] | null
  content: string | null
}

function extractVerdict(content: string): BlogSignal['verdict'] {
  const m = content.match(/\*\*\s*(BUY|HOLD|AVOID)\s*\*\*/i)
  return m ? (m[1].toUpperCase() as 'BUY' | 'HOLD' | 'AVOID') : null
}

/** Recent published posts as structured analysis signal, optionally filtered by ticker. */
export async function getBlogAnalysis(opts: { symbol?: string; limit?: number }): Promise<BlogAnalysisResult> {
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  let query = supabase
    .from('blog_posts')
    .select('slug, title, excerpt, published_at, category, tickers, content')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(limit)

  if (opts.symbol) query = query.contains('tickers', [opts.symbol.toUpperCase()])

  const { data, error } = await query
  if (error) return { ok: false, data: [], error: error.message }

  const rows = (data ?? []) as Row[]
  const signals: BlogSignal[] = rows.map((p) => ({
    slug: p.slug,
    url: `/blog/${p.slug}`,
    title: p.title,
    publishedAt: p.published_at,
    category: p.category,
    tickers: p.tickers ?? [],
    verdict: extractVerdict(p.content ?? ''),
    summary: p.excerpt ?? '',
  }))

  return { ok: true, data: signals }
}
