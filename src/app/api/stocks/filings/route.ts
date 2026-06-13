import { NextResponse } from 'next/server'

export interface SecFiling {
  form:        string
  filingDate:  string   // "2025-11-01"
  reportDate:  string   // "2025-09-28" (period end)
  description: string
  url:         string   // direct link to primary document
  indexUrl:    string   // filing index page
}

const UA       = 'StockMarketROI contato@ivanlimadev.com'
const TTL_CIK  = 24 * 60 * 60_000
const TTL_DATA =  2 * 60 * 60_000   // filings don't change often

let cikMap: Record<string, string> | null = null
let cikMapTs = 0
const cache = new Map<string, { data: SecFiling[]; ts: number }>()

async function getCik(symbol: string): Promise<string | null> {
  if (!cikMap || Date.now() - cikMapTs > TTL_CIK) {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': UA },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const raw: Record<string, { cik_str: number; ticker: string }> = await res.json()
    cikMap = {}
    for (const v of Object.values(raw)) {
      cikMap[v.ticker.toUpperCase()] = String(v.cik_str).padStart(10, '0')
    }
    cikMapTs = Date.now()
  }
  return cikMap[symbol.toUpperCase()] ?? null
}

const WANTED_FORMS = new Set(['10-K', '10-Q', '8-K', 'DEF 14A'])
const FORM_LABELS: Record<string, string> = {
  '10-K':    'Annual Report',
  '10-Q':    'Quarterly Report',
  '8-K':     'Material Event',
  'DEF 14A': 'Proxy Statement',
}

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const hit = cache.get(symbol)
  if (hit && Date.now() - hit.ts < TTL_DATA) return NextResponse.json(hit.data)

  const cik = await getCik(symbol)
  if (!cik) return NextResponse.json({ error: `CIK not found for ${symbol}` }, { status: 404 })

  const subRes = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
    headers: { 'User-Agent': UA },
    next: { revalidate: 0 },
  })
  if (!subRes.ok) return NextResponse.json({ error: `SEC ${subRes.status}` }, { status: subRes.status })

  const sub = await subRes.json()
  const recent = sub.filings?.recent ?? {}

  const forms:         string[] = recent.form              ?? []
  const filingDates:   string[] = recent.filingDate        ?? []
  const reportDates:   string[] = recent.reportDate        ?? []
  const accessions:    string[] = recent.accessionNumber   ?? []
  const primaryDocs:   string[] = recent.primaryDocument   ?? []
  const descriptions:  string[] = recent.primaryDocDescription ?? []

  const cikInt = parseInt(cik, 10).toString()   // no leading zeros for URLs

  const filings: SecFiling[] = []
  for (let i = 0; i < forms.length; i++) {
    if (!WANTED_FORMS.has(forms[i])) continue
    const accNoDash = accessions[i].replace(/-/g, '')
    const doc = primaryDocs[i] ?? ''
    filings.push({
      form:        forms[i],
      filingDate:  filingDates[i]  ?? '',
      reportDate:  reportDates[i]  ?? '',
      description: descriptions[i] || FORM_LABELS[forms[i]] || forms[i],
      url:         doc
        ? `https://www.sec.gov/Archives/edgar/data/${cikInt}/${accNoDash}/${doc}`
        : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${encodeURIComponent(forms[i])}&dateb=&owner=include&count=5`,
      indexUrl:    `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${encodeURIComponent(forms[i])}&dateb=&owner=include&count=5`,
    })
    if (filings.length >= 30) break
  }

  cache.set(symbol, { data: filings, ts: Date.now() })
  return NextResponse.json(filings)
}
