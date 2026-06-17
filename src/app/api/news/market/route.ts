import { NextResponse } from 'next/server'
import type { StockNewsItem } from '@/app/api/stocks/news/route'

const TTL = 15 * 60_000
let cache: { data: StockNewsItem[]; ts: number } | null = null

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data)
  }

  const key = process.env.STOCKNEWS_API_KEY
  if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const res = await fetch(
    `https://stocknewsapi.com/api/v1/category?section=general&items=20&sortby=rank&token=${key}`,
    { next: { revalidate: 900 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: `StockNewsAPI ${res.status}` }, { status: res.status })
  }

  const json = await res.json()
  const articles: Array<{
    news_url:    string
    image_url?:  string
    title:       string
    text:        string
    source_name: string
    date:        string
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

  cache = { data, ts: Date.now() }
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=300' },
  })
}
