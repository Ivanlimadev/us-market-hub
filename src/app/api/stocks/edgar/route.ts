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

export interface EdgarAnnual {
  year:        number
  label:       string   // e.g. "2025"
  operatingCf: number | null
  capex:       number | null
  fcf:         number | null
  rdExpense:   number | null
  revenue:     number | null  // annual, for R&D margin
}

export interface EdgarBalanceSheet {
  year:         number
  label:        string
  assets:       number | null
  liabilities:  number | null
  cash:         number | null
  longTermDebt: number | null
  equity:       number | null
}

export interface EdgarCapitalReturns {
  year:              number
  label:             string
  buybacks:          number | null  // absolute value (cash outflow)
  dividendsPaid:     number | null  // absolute value
  totalReturned:     number | null
  sharesOutstanding: number | null  // raw share count
}

export interface EdgarData {
  symbol:         string
  cik:            string
  name:           string
  quarters:       EdgarQuarter[]
  annual:         EdgarAnnual[]
  balanceSheet:   EdgarBalanceSheet[]
  capitalReturns: EdgarCapitalReturns[]
}

const UA = 'StockMarketROI contato@ivanlimadev.com'
const TTL_CIK  = 24 * 60 * 60_000
const TTL_DATA =  6 * 60 * 60_000

let cikMap: Record<string, string> | null = null
let cikMapTs = 0

const dataCache = new Map<string, { data: EdgarData; ts: number }>()

async function getCik(symbol: string): Promise<string | null> {
  if (!cikMap || Date.now() - cikMapTs > TTL_CIK) {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': UA },
      next: { revalidate: 300 },
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
  const m = frame.match(/CY(\d{4})Q(\d)/)
  if (m) return `Q${m[2]} ${m[1]}`
  return frame
}

function extractConcept(
  facts: Record<string, { units: Record<string, Array<{ frame?: string; val: number; end: string; filed: string; fp?: string; form?: string }>> }>,
  pattern: RegExp,
  ...keys: string[]
): Map<string, { val: number; end: string; filed: string }> {
  const map = new Map<string, { val: number; end: string; filed: string }>()
  for (const key of keys) {
    const concept = facts[key]
    if (!concept) continue
    const entries = concept.units?.['USD'] ?? concept.units?.['USD/shares'] ?? concept.units?.['shares'] ?? []
    for (const e of entries) {
      if (!e.frame?.match(pattern)) continue
      if (e.form && !['10-Q', '10-K'].includes(e.form)) continue
      const existing = map.get(e.frame)
      if (!existing || e.filed > existing.filed) {
        map.set(e.frame, { val: e.val, end: e.end, filed: e.filed })
      }
    }
    if (map.size > 0) break
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

  const QR  = /^CY\d{4}Q\d$/       // quarterly duration  e.g. CY2025Q4
  const YR  = /^CY\d{4}$/           // annual duration     e.g. CY2025
  const BSI = /^CY\d{4}Q4I$/        // year-end instant    e.g. CY2025Q4I

  // Quarterly income statement
  const epsMap = extractConcept(gaap, QR, 'EarningsPerShareBasic', 'EarningsPerShareDiluted')
  const revMap = extractConcept(gaap, QR, 'RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet')
  const niMap  = extractConcept(gaap, QR, 'NetIncomeLoss')
  const gpMap  = extractConcept(gaap, QR, 'GrossProfit')

  // Annual cash flow (FCF)
  const ocfMap   = extractConcept(gaap, YR, 'NetCashProvidedByUsedInOperatingActivities')
  const capexMap = extractConcept(gaap, YR, 'PaymentsToAcquirePropertyPlantAndEquipment')

  // Annual R&D and revenue (for R&D margin)
  const rdMap    = extractConcept(gaap, YR, 'ResearchAndDevelopmentExpense')
  const revYrMap = extractConcept(gaap, YR, 'RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet')

  // Annual capital returns (cash flow statement)
  const buybackMap = extractConcept(gaap, YR, 'PaymentsForRepurchaseOfCommonStock')
  const divPaidMap = extractConcept(gaap, YR,
    'PaymentsOfDividendsCommonStock',
    'PaymentsOfDividends',
    'PaymentOfDividendsCommonStock',
    'PaymentsOfDividendsAndDividendEquivalentsOnCommonStockAndPreferredStock',
  )

  // Year-end shares outstanding (instant, "shares" unit)
  const sharesMap  = extractConcept(gaap, BSI, 'CommonStockSharesOutstanding', 'CommonStockSharesOutstandingBasic')

  // Year-end balance sheet (instant values at Q4)
  const assetsMap  = extractConcept(gaap, BSI, 'Assets')
  const liabMap    = extractConcept(gaap, BSI, 'Liabilities')
  const cashMap    = extractConcept(gaap, BSI, 'CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsAndShortTermInvestments', 'Cash')
  const ltDebtMap  = extractConcept(gaap, BSI, 'LongTermDebt', 'LongTermDebtNoncurrent', 'LongTermNotesPayable')
  const equityMap  = extractConcept(gaap, BSI, 'StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest')

  // Build quarters
  const qFrames = new Set<string>([...epsMap.keys(), ...revMap.keys(), ...niMap.keys(), ...gpMap.keys()])
  const quarters: EdgarQuarter[] = [...qFrames]
    .sort().slice(-8)
    .map(frame => ({
      frame,
      label:       frameLabel(frame),
      periodEnd:   revMap.get(frame)?.end ?? niMap.get(frame)?.end ?? epsMap.get(frame)?.end ?? '',
      filed:       revMap.get(frame)?.filed ?? niMap.get(frame)?.filed ?? epsMap.get(frame)?.filed ?? '',
      eps:         epsMap.get(frame)?.val ?? null,
      revenue:     revMap.get(frame)?.val ?? null,
      netIncome:   niMap.get(frame)?.val  ?? null,
      grossProfit: gpMap.get(frame)?.val  ?? null,
    }))

  // Build annual FCF + R&D
  const yFrames = new Set<string>([...ocfMap.keys(), ...capexMap.keys(), ...rdMap.keys()])
  const annual: EdgarAnnual[] = [...yFrames]
    .sort().slice(-6)
    .map(frame => {
      const ocf = ocfMap.get(frame)?.val ?? null
      const cx  = capexMap.get(frame)?.val ?? null
      const rd  = rdMap.get(frame)?.val ?? null
      const rev = revYrMap.get(frame)?.val ?? null
      return {
        year:        parseInt(frame.replace('CY', '')),
        label:       frame.replace('CY', ''),
        operatingCf: ocf,
        capex:       cx != null ? -cx : null,
        fcf:         ocf != null && cx != null ? ocf - cx : null,
        rdExpense:   rd,
        revenue:     rev,
      }
    })

  // Build balance sheet (year-end snapshots)
  const bsFrames = new Set<string>([...assetsMap.keys(), ...liabMap.keys()])
  const balanceSheet: EdgarBalanceSheet[] = [...bsFrames]
    .sort().slice(-6)
    .map(frame => {
      const year = parseInt(frame.match(/CY(\d{4})/)?.[1] ?? '0')
      return {
        year,
        label:        String(year),
        assets:       assetsMap.get(frame)?.val  ?? null,
        liabilities:  liabMap.get(frame)?.val    ?? null,
        cash:         cashMap.get(frame)?.val     ?? null,
        longTermDebt: ltDebtMap.get(frame)?.val  ?? null,
        equity:       equityMap.get(frame)?.val   ?? null,
      }
    })

  // Build capital returns
  const crFrames = new Set<string>([...buybackMap.keys(), ...divPaidMap.keys()])
  const capitalReturns: EdgarCapitalReturns[] = [...crFrames]
    .sort().slice(-6)
    .map(frame => {
      const year    = parseInt(frame.replace('CY', ''))
      const bb      = buybackMap.get(frame)?.val ?? null
      const div     = divPaidMap.get(frame)?.val ?? null
      const bbAbs   = bb  != null ? Math.abs(bb)  : null
      const divAbs  = div != null ? Math.abs(div) : null
      const shares  = sharesMap.get(`CY${year}Q4I`)?.val ?? null
      return {
        year,
        label:             String(year),
        buybacks:          bbAbs,
        dividendsPaid:     divAbs,
        totalReturned:     bbAbs != null || divAbs != null ? (bbAbs ?? 0) + (divAbs ?? 0) : null,
        sharesOutstanding: shares,
      }
    })

  const data: EdgarData = { symbol, cik, name, quarters, annual, balanceSheet, capitalReturns }
  dataCache.set(symbol, { data, ts: Date.now() })
  return NextResponse.json(data)
}
