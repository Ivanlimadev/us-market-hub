export interface NewsItem {
  title:       string
  link:        string
  pubDate:     string
  description: string
  source:      string
}

const RSS_FEEDS = [
  { url: 'https://finance.yahoo.com/rss/topfinstories', source: 'Yahoo Finance' },
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US', source: 'Yahoo Finance · S&P 500' },
]

function extractTag(xml: string, tag: string): string {
  const cdataMatch  = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  const plainMatch  = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return (cdataMatch?.[1] ?? plainMatch?.[1] ?? '').trim()
}

function parseItems(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1]
    const title       = extractTag(block, 'title')
    const link        = extractTag(block, 'link')
    const pubDate     = extractTag(block, 'pubDate')
    const description = extractTag(block, 'description')
      .replace(/<[^>]+>/g, '')   // strip HTML tags
      .slice(0, 200)
    if (title && link) items.push({ title, link, pubDate, description, source })
  }
  return items
}

export async function getMarketNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, source }) => {
      const res = await fetch(url, { next: { revalidate: 900 } })
      if (!res.ok) return []
      const xml = await res.text()
      return parseItems(xml, source)
    })
  )

  const all: NewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  // Deduplicate by title and sort by date descending
  const seen = new Set<string>()
  return all
    .filter((n) => { const key = n.title.slice(0, 60); if (seen.has(key)) return false; seen.add(key); return true })
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 30)
}
