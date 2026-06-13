import { NextResponse } from 'next/server'

export interface StockNewsItem {
  title:       string
  url:         string
  image:       string | null
  source:      string
  publishedAt: string
  summary:     string
  sentiment:   'Positive' | 'Negative' | 'Neutral'
  tickers:     string[]
}

const TTL = 15 * 60_000
const cache = new Map<string, { data: StockNewsItem[]; ts: number }>()

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('symbol')?.toUpperCase()
  if (!raw) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  // Support multiple comma-separated tickers: ?symbol=AAPL,MSFT,TSLA
  const symbol = raw.split(',').map(s => s.trim()).filter(Boolean).sort().join(',')
  const multi  = symbol.includes(',')

  const hit = cache.get(symbol)
  if (hit && Date.now() - hit.ts < TTL) {
    return NextResponse.json(hit.data)
  }

  const key = process.env.STOCKNEWS_API_KEY
  if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const items = multi ? 20 : 10
  const url = `https://stocknewsapi.com/api/v1?tickers=${symbol}&items=${items}&sortby=rank&token=${key}`
  const res = await fetch(url, {
    next: { revalidate: 0 },
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockMarketROI/1.0)' },
  })

  if (!res.ok) {
    return NextResponse.json({ error: `StockNewsAPI ${res.status}` }, { status: res.status })
  }

  const json = await res.json()
  const articles: Array<{
    title:       string
    news_url:    string
    image_url?:  string
    source_name: string
    date:        string
    text:        string
    sentiment:   string
    tickers:     string[]
  }> = json.data ?? []

  const data: StockNewsItem[] = articles.map(a => ({
    title:       a.title,
    url:         a.news_url,
    image:       a.image_url ?? null,
    source:      a.source_name,
    publishedAt: a.date,
    summary:     a.text?.slice(0, 160) ?? '',
    sentiment:   (a.sentiment === 'Positive' || a.sentiment === 'Negative')
                   ? a.sentiment
                   : 'Neutral',
    tickers:     a.tickers ?? [],
  }))

  cache.set(symbol, { data, ts: Date.now() })
  return NextResponse.json(data)
}
