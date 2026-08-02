import { NextResponse } from 'next/server'

/**
 * Insider transactions (SEC Form 4). The submissions API lists a company's
 * filings; each Form 4 is a small XML we fetch and parse for the reported
 * owner, role and non-derivative transactions. Codes P (open-market buy) and
 * S (open-market sell) carry the real sentiment signal; A/M/F/G are routine
 * compensation events.
 */

export interface InsiderTx {
  date:     string
  owner:    string
  role:     string
  code:     string
  type:     'buy' | 'sell' | 'award' | 'option' | 'tax' | 'gift' | 'other'
  shares:   number | null
  price:    number | null
  value:    number | null
}

export interface InsiderData {
  symbol:       string
  cik:          string
  transactions: InsiderTx[]
  summary: {
    months:    number
    buys:      number
    sells:     number
    buyValue:  number
    sellValue: number
    netValue:  number
  }
}

const UA = 'StockMarketROI contato@ivanlimadev.com'
const TTL_CIK  = 24 * 60 * 60_000
const TTL_DATA =  6 * 60 * 60_000
const MAX_FILINGS = 18      // most recent Form 4s to fetch
const WINDOW_MONTHS = 6     // sentiment window

let cikMap: Record<string, string> | null = null
let cikMapTs = 0
const dataCache = new Map<string, { data: InsiderData; ts: number }>()

async function getCik(symbol: string): Promise<string | null> {
  if (!cikMap || Date.now() - cikMapTs > TTL_CIK) {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': UA },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const raw: Record<string, { cik_str: number; ticker: string }> = await res.json()
    cikMap = {}
    for (const v of Object.values(raw)) cikMap[v.ticker.toUpperCase()] = String(v.cik_str).padStart(10, '0')
    cikMapTs = Date.now()
  }
  return cikMap[symbol.toUpperCase()] ?? null
}

const tag = (xml: string, name: string): string | null => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))
  return m ? m[1].trim() : null
}
const valTag = (xml: string, name: string): string | null => {
  const block = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))
  return block ? tag(block[1], 'value') : null
}

function classify(code: string): InsiderTx['type'] {
  switch (code) {
    case 'P': return 'buy'
    case 'S': return 'sell'
    case 'A': return 'award'
    case 'M': return 'option'
    case 'F': return 'tax'
    case 'G': return 'gift'
    default:  return 'other'
  }
}

function parseForm4(xml: string): InsiderTx[] {
  const owner = tag(xml, 'rptOwnerName') ?? 'Insider'
  const isDir = /<isDirector>\s*(1|true)\s*<\/isDirector>/i.test(xml)
  const isOff = /<isOfficer>\s*(1|true)\s*<\/isOfficer>/i.test(xml)
  const isTen = /<isTenPercentOwner>\s*(1|true)\s*<\/isTenPercentOwner>/i.test(xml)
  const title = tag(xml, 'officerTitle')
  const roles: string[] = []
  if (isOff) roles.push(title || 'Officer')
  if (isDir) roles.push('Director')
  if (isTen) roles.push('10% Owner')
  const role = roles.join(' · ') || '-'

  const blocks = xml.split('<nonDerivativeTransaction>').slice(1).map(b => b.split('</nonDerivativeTransaction>')[0])
  const out: InsiderTx[] = []
  for (const b of blocks) {
    const code = tag(b, 'transactionCode') ?? ''
    const date = valTag(b, 'transactionDate')
    const shares = valTag(b, 'transactionShares')
    const price = valTag(b, 'transactionPricePerShare')
    if (!date) continue
    const sh = shares != null ? Number(shares) : null
    const pr = price != null ? Number(price) : null
    out.push({
      date,
      owner,
      role,
      code,
      type: classify(code),
      shares: sh,
      price: pr,
      value: sh != null && pr != null ? sh * pr : null,
    })
  }
  return out
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit)
    out.push(...await Promise.all(batch.map(fn)))
  }
  return out
}

export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const hit = dataCache.get(symbol)
  if (hit && Date.now() - hit.ts < TTL_DATA) return NextResponse.json(hit.data)

  const cik = await getCik(symbol)
  if (!cik) return NextResponse.json({ error: `CIK not found for ${symbol}` }, { status: 404 })

  const subRes = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
    headers: { 'User-Agent': UA },
    next: { revalidate: 0 },
  })
  if (!subRes.ok) return NextResponse.json({ error: `SEC ${subRes.status}` }, { status: subRes.status })

  const sub = await subRes.json()
  const r = sub.filings?.recent ?? {}
  const forms: string[] = r.form ?? []
  const accs: string[] = r.accessionNumber ?? []
  const docs: string[] = r.primaryDocument ?? []
  const cikNum = String(parseInt(cik, 10))

  const f4: { acc: string; doc: string }[] = []
  for (let i = 0; i < forms.length && f4.length < MAX_FILINGS; i++) {
    if (forms[i] === '4') f4.push({ acc: accs[i], doc: docs[i] })
  }

  const txLists = await mapLimit(f4, 5, async ({ acc, doc }) => {
    const accNo = acc.replace(/-/g, '')
    const docName = doc.replace(/^xslF345X\d+\//, '')
    const url = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accNo}/${docName}`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, next: { revalidate: 0 } })
      if (!res.ok) return []
      return parseForm4(await res.text())
    } catch {
      return []
    }
  })

  const transactions = txLists.flat().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40)

  // 6-month sentiment from open-market buys (P) vs sells (S)
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - WINDOW_MONTHS)
  const cutoffIso = cutoff.toISOString().slice(0, 10)
  let buys = 0, sells = 0, buyValue = 0, sellValue = 0
  for (const t of transactions) {
    if (t.date < cutoffIso) continue
    if (t.type === 'buy')  { buys++;  buyValue  += t.value ?? 0 }
    if (t.type === 'sell') { sells++; sellValue += t.value ?? 0 }
  }

  const data: InsiderData = {
    symbol, cik,
    transactions,
    summary: { months: WINDOW_MONTHS, buys, sells, buyValue, sellValue, netValue: buyValue - sellValue },
  }
  dataCache.set(symbol, { data, ts: Date.now() })
  return NextResponse.json(data)
}
