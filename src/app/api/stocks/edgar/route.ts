import { NextResponse } from 'next/server'

export interface EdgarQuarter {
  frame:       string   // e.g. "CY2025Q4"
  label:       string   // e.g. "Q4 2025"
  periodEnd:   string   // ISO date
  filed:       string   // ISO date
  eps:         number | null
  revenue:     number | null
  netIncome:   number | null
  grossProfit: number | null
}

export interface EdgarData {
  symbol:   string
  cik:      string
  name:     string
  quarters: EdgarQuarter[]
}

const UA = 'StockMarketROI contato@ivanlimadev.com'
const TTL_CIK  = 24 * 60 * 60_000  // 24h — CIK map changes rarely
const TTL_DATA =  6 * 60 * 60_000  //  6h — financials change quarterly

let cikMap: Record<string, string> | null = null
let cikMapTs = 0

const dataCache = new Map<string, { data: EdgarData; ts: number }>()

async function getCik(symbol: string): Promise<string | null> {
  if (!cikMap || Date.now() - cikMapTs > TTL_CIK) {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': UA },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const raw: Record<string, { cik_str: number; ticker: string; title: string }> = await res.json()
    cikMap = {}
    for (const v of Object.values(raw)) {
      cikMap[v.ticker.toUpperCase()] = String(v.cik_str).padStart(10, '0')
    }
    cikMapTs = Date.now()
  }
  return cikMap[symbol.toUpperCase()] ?? null
}

function frameLabel(frame: string): string {
  // CY2025Q4 -> "Q4 2025"
  const m = frame.match(/CY(\d{4})Q(\d)/)
  if (m) return `Q${m[2]} ${m[1]}`
  return frame
}

function extractConcept(
  facts: Record<string, { units: Record<string, Array<{ frame?: string; val: number; end: string; filed: string; fp?: string; form?: string }>> }>,
  ...keys: string[]
): Map<string, { val: number; end: string; filed: string }> {
  const map = new Map<string, { val: number; end: string; filed: string }>()
  for (const key of keys) {
    const concept = facts[key]
    if (!concept) continue
    const entries = concept.units?.['USD'] ?? concept.units?.['USD/shares'] ?? []
    for (const e of entries) {
      if (!e.frame?.match(/^CY\d{4}Q\d$/)) continue
      if (e.form && !['10-Q', '10-K'].includes(e.form)) continue
      // Keep most recent filing for each frame
      const existing = map.get(e.frame)
      if (!existing || e.filed > existing.filed) {
        map.set(e.frame, { val: e.val, end: e.end, filed: e.filed })
      }
    }
    if (map.size > 0) break // use first key that has data
  }
  return map
}

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const hit = dataCache.get(symbol)
  if (hit && Date.now() - hit.ts < TTL_DATA) {
    return NextResponse.json(hit.data)
  }

  const cik = await getCik(symbol)
  if (!cik) return NextResponse.json({ error: `CIK not found for ${symbol}` }, { status: 404 })

  const factsRes = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, {
    headers: { 'User-Agent': UA },
    next: { revalidate: 0 },
  })
  if (!factsRes.ok) return NextResponse.json({ error: `SEC EDGAR ${factsRes.status}` }, { status: factsRes.status })

  const factsJson = await factsRes.json()
  const name: string = factsJson.entityName ?? symbol
  const gaap = factsJson.facts?.['us-gaap'] ?? {}

  const epsMap     = extractConcept(gaap, 'EarningsPerShareBasic', 'EarningsPerShareDiluted')
  const revMap     = extractConcept(gaap, 'RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet')
  const niMap      = extractConcept(gaap, 'NetIncomeLoss')
  const gpMap      = extractConcept(gaap, 'GrossProfit')

  // Collect all frames that appear in any concept
  const frames = new Set<string>([
    ...epsMap.keys(), ...revMap.keys(), ...niMap.keys(), ...gpMap.keys(),
  ])

  const quarters: EdgarQuarter[] = [...frames]
    .filter(f => f.match(/^CY\d{4}Q\d$/))
    .sort()
    .slice(-8) // last 8 quarters
    .map(frame => {
      const eps  = epsMap.get(frame)
      const rev  = revMap.get(frame)
      const ni   = niMap.get(frame)
      const gp   = gpMap.get(frame)
      const periodEnd = rev?.end ?? ni?.end ?? eps?.end ?? ''
      const filed     = rev?.filed ?? ni?.filed ?? eps?.filed ?? ''
      return {
        frame,
        label:       frameLabel(frame),
        periodEnd,
        filed,
        eps:         eps?.val ?? null,
        revenue:     rev?.val ?? null,
        netIncome:   ni?.val  ?? null,
        grossProfit: gp?.val  ?? null,
      }
    })

  const data: EdgarData = { symbol, cik, name, quarters }
  dataCache.set(symbol, { data, ts: Date.now() })
  return NextResponse.json(data)
}
