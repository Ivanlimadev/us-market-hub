import { getBlogAnalysis, type BlogSignal } from '@/lib/blog-analysis'
import { OracleFetchError, type OracleAdapter } from '@/lib/oracle/types'

// content.analysis — structured signal from our own blog (green). A robot can
// ask "latest analysis on NVDA" and get verdict + tickers + link, not prose.
export const analysisAdapter: OracleAdapter<{ symbol?: string; limit?: string }, BlogSignal[]> = {
  key: 'content.analysis',
  meta: {
    title: 'Structured analysis signal from our blog (verdict, tickers, link)',
    category: 'content',
    source: 'own analysis',
    license: 'green',
    status: 'live',
    toll: 0.002,
    params: [
      { name: 'symbol', required: false, type: 'string (filter by ticker, e.g. NVDA)' },
      { name: 'limit', required: false, type: 'number (default 10, max 50)' },
    ],
  },
  async fetch({ symbol, limit }) {
    const n = limit != null && limit !== '' ? Number(limit) : undefined
    const r = await getBlogAnalysis({ symbol, limit: Number.isFinite(n as number) ? n : undefined })
    if (!r.ok) throw new OracleFetchError(r.error ?? 'blog query failed', 502)

    const latest = r.data[0]?.publishedAt
    const asOf = latest ? new Date(latest).toISOString() : new Date().toISOString()
    return { data: r.data, asOf }
  },
}
