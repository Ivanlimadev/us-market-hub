// Yahoo Finance unofficial client — crumb-based auth, server-side only
let _crumb: string | null = null
let _cookies: string | null = null
let _crumbFetchedAt = 0
const CRUMB_TTL_MS = 30 * 60 * 1000 // 30 min

async function getYFSession(): Promise<{ crumb: string; cookie: string }> {
  if (_crumb && _cookies && Date.now() - _crumbFetchedAt < CRUMB_TTL_MS) {
    return { crumb: _crumb, cookie: _cookies }
  }

  // Step 1: hit fc.yahoo.com to get cookies
  const initRes = await fetch('https://fc.yahoo.com', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    redirect: 'follow',
  })
  const rawCookies = initRes.headers.getSetCookie?.() ?? []
  const cookieHeader = rawCookies.map((c) => c.split(';')[0]).join('; ')

  // Step 2: get crumb
  const crumbRes = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Cookie: cookieHeader,
    },
  })
  const crumb = await crumbRes.text()

  _crumb = crumb.trim()
  _cookies = cookieHeader
  _crumbFetchedAt = Date.now()
  return { crumb: _crumb, cookie: _cookies }
}

async function yfGet(url: string): Promise<Record<string, unknown>> {
  const { crumb, cookie } = await getYFSession()
  const fullUrl = `${url}${url.includes('?') ? '&' : '?'}crumb=${encodeURIComponent(crumb)}`
  const res = await fetch(fullUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', Cookie: cookie },
  })
  if (!res.ok) throw new Error(`YF ${res.status}: ${url}`)
  return res.json()
}

function raw(obj: unknown): number | null {
  if (obj && typeof obj === 'object' && 'raw' in obj) return (obj as { raw: number }).raw
  return null
}

function fmt(obj: unknown): string | null {
  if (obj && typeof obj === 'object' && 'fmt' in obj) return (obj as { fmt: string }).fmt
  return null
}

export interface YFSummary {
  // Real-time price (prefer these over Marketstack for currentPrice)
  regularMarketPrice: number | null
  regularMarketPreviousClose: number | null
  regularMarketChangePercent: number | null
  // Identity
  sector: string | null
  industry: string | null
  description: string | null
  website: string | null
  employees: number | null
  country: string | null
  city: string | null
  // Valuation
  marketCap: number | null
  pe: number | null
  eps: number | null
  priceToBook: number | null
  forwardPE: number | null
  pegRatio: number | null
  // Performance
  beta: number | null
  week52High: number | null
  week52Low: number | null
  avgVolume10d: number | null
  avgVolume3m: number | null
  // Dividend
  dividendYield: number | null
  dividendRate: number | null
  exDividendDate: string | null
  dividendDate: string | null
  payoutRatio: number | null
  // Upcoming events
  nextEarningsDate: string | null
  // Extra valuation
  bookValue: number | null
  // Profitability
  profitMargin: number | null
  operatingMargin: number | null
  roe: number | null
  roa: number | null
  revenueGrowth: number | null
  earningsGrowth: number | null
  // Balance sheet
  totalRevenue: number | null
  totalDebt: number | null
  debtToEquity: number | null
  currentRatio: number | null
  freeCashflow: number | null
}

export async function getYFSummary(symbol: string): Promise<YFSummary> {
  const modules = [
    'summaryProfile',
    'defaultKeyStatistics',
    'summaryDetail',
    'financialData',
    'price',
    'calendarEvents',
  ].join(',')

  const data = await yfGet(
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`
  )

  const result = (data as { quoteSummary?: { result?: unknown[] } })?.quoteSummary?.result?.[0] as
    | Record<string, unknown>
    | undefined

  if (!result) return emptyYFSummary()

  const profile = (result.summaryProfile ?? {}) as Record<string, unknown>
  const detail = (result.summaryDetail ?? {}) as Record<string, unknown>
  const stats = (result.defaultKeyStatistics ?? {}) as Record<string, unknown>
  const fin = (result.financialData ?? {}) as Record<string, unknown>
  const priceModule = (result.price ?? {}) as Record<string, unknown>
  const cal = ((result.calendarEvents as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>
  const calEarnings = (cal.earnings as Record<string, unknown> | undefined) ?? {}
  const earningsDates = (calEarnings.earningsDate as Array<{ fmt?: string }> | undefined) ?? []

  return {
    regularMarketPrice: raw(priceModule.regularMarketPrice),
    regularMarketPreviousClose: raw(priceModule.regularMarketPreviousClose),
    regularMarketChangePercent: raw(priceModule.regularMarketChangePercent),
    sector: (profile.sector as string) ?? null,
    industry: (profile.industry as string) ?? null,
    description: (profile.longBusinessSummary as string) ?? null,
    website: (profile.website as string) ?? null,
    employees: (profile.fullTimeEmployees as number) ?? null,
    country: (profile.country as string) ?? null,
    city: (profile.city as string) ?? null,
    marketCap: raw(detail.marketCap),
    pe: raw(detail.trailingPE),
    eps: raw(stats.trailingEps),
    priceToBook: raw(detail.priceToBook),
    forwardPE: raw(detail.forwardPE),
    pegRatio: raw(stats.pegRatio),
    beta: raw(detail.beta),
    week52High: raw(detail.fiftyTwoWeekHigh),
    week52Low: raw(detail.fiftyTwoWeekLow),
    avgVolume10d: raw(detail.averageVolume10days ?? detail.averageDailyVolume10Day),
    avgVolume3m: raw(detail.averageVolume),
    dividendYield: raw(detail.dividendYield),
    dividendRate: raw(detail.dividendRate),
    exDividendDate: fmt(detail.exDividendDate),
    dividendDate: fmt(cal.dividendDate),
    payoutRatio: raw(detail.payoutRatio),
    nextEarningsDate: earningsDates[0]?.fmt ?? null,
    bookValue: raw(stats.bookValue),
    profitMargin: raw(fin.profitMargins),
    operatingMargin: raw(fin.operatingMargins),
    roe: raw(fin.returnOnEquity),
    roa: raw(fin.returnOnAssets),
    revenueGrowth: raw(fin.revenueGrowth),
    earningsGrowth: raw(fin.earningsGrowth),
    totalRevenue: raw(fin.totalRevenue),
    totalDebt: raw(fin.totalDebt),
    debtToEquity: raw(fin.debtToEquity),
    currentRatio: raw(fin.currentRatio),
    freeCashflow: raw(fin.freeCashflow),
  }
}

function emptyYFSummary(): YFSummary {
  return {
    regularMarketPrice: null, regularMarketPreviousClose: null, regularMarketChangePercent: null,
    sector: null, industry: null, description: null, website: null,
    employees: null, country: null, city: null, marketCap: null,
    pe: null, eps: null, priceToBook: null, forwardPE: null, pegRatio: null,
    beta: null, week52High: null, week52Low: null, avgVolume10d: null, avgVolume3m: null,
    dividendYield: null, dividendRate: null, exDividendDate: null, dividendDate: null, payoutRatio: null,
    nextEarningsDate: null, bookValue: null,
    profitMargin: null, operatingMargin: null, roe: null, roa: null,
    revenueGrowth: null, earningsGrowth: null, totalRevenue: null,
    totalDebt: null, debtToEquity: null, currentRatio: null, freeCashflow: null,
  }
}

// ── Financials (income statement history) ──────────────────────────────────

export interface YFFinancialRow {
  date: string          // fiscal year/quarter end  e.g. "2023-09-30"
  revenue: number | null
  grossProfit: number | null
  operatingIncome: number | null
  netIncome: number | null
  eps: number | null    // diluted EPS
}

export interface YFFinancials {
  annual: YFFinancialRow[]
  quarterly: YFFinancialRow[]
  cagr5yRevenue: number | null
  cagr5yNetIncome: number | null
}

function parseStatements(list: unknown[]): YFFinancialRow[] {
  return (list as Array<Record<string, unknown>>)
    .map((s) => ({
      date: (s.endDate as { fmt?: string } | null)?.fmt ?? '',
      revenue: raw(s.totalRevenue),
      grossProfit: raw(s.grossProfit),
      operatingIncome: raw(s.ebit),
      netIncome: raw(s.netIncome),
      eps: raw(s.dilutedEps),
    }))
    .filter((r) => r.date)
    .reverse() // oldest → newest
}

function cagr(rows: YFFinancialRow[], field: keyof YFFinancialRow): number | null {
  const vals = rows
    .map((r) => r[field] as number | null)
    .filter((v): v is number => v !== null && v > 0)
  if (vals.length < 2) return null
  const years = vals.length - 1
  return (Math.pow(vals[vals.length - 1] / vals[0], 1 / years) - 1) * 100
}

export async function getYFFinancials(symbol: string): Promise<YFFinancials> {
  const modules = 'incomeStatementHistory,incomeStatementHistoryQuarterly'
  const data = await yfGet(
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`
  )

  const result = (data as { quoteSummary?: { result?: unknown[] } })
    ?.quoteSummary?.result?.[0] as Record<string, unknown> | undefined

  if (!result) return { annual: [], quarterly: [], cagr5yRevenue: null, cagr5yNetIncome: null }

  const annualList =
    ((result.incomeStatementHistory as Record<string, unknown> | undefined)
      ?.incomeStatementHistory as unknown[]) ?? []
  const quarterlyList =
    ((result.incomeStatementHistoryQuarterly as Record<string, unknown> | undefined)
      ?.incomeStatementHistory as unknown[]) ?? []

  const annual = parseStatements(annualList)
  const quarterly = parseStatements(quarterlyList)

  return {
    annual,
    quarterly,
    cagr5yRevenue: cagr(annual, 'revenue'),
    cagr5yNetIncome: cagr(annual, 'netIncome'),
  }
}

// ── Chart history (split + dividend adjusted) ──────────────────────────────

export interface YFChartBar {
  date: string         // 'YYYY-MM-DD'
  open: number
  high: number
  low: number
  close: number
  adj_close: number   // split + dividend adjusted — use for charts & performance
  volume: number
}

/**
 * Fetch OHLCV bars from Yahoo Finance with proper split-adjusted prices.
 * range:    5d | 1mo | 3mo | 6mo | 1y | 2y | 5y | 10y | ytd | max
 * interval: 1d | 1wk | 1mo  (5m for intraday)
 */
export async function getYFChart(
  symbol: string,
  range: string,
  interval: string
): Promise<YFChartBar[]> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?interval=${interval}&range=${range}&includeAdjustedClose=true`

  const data = await yfGet(url)

  const result = (
    (data as { chart?: { result?: unknown[] } }).chart?.result?.[0]
  ) as Record<string, unknown> | undefined

  if (!result) return []

  const timestamps = (result.timestamp as number[] | undefined) ?? []
  const quote = (
    (result.indicators as Record<string, unknown> | undefined)
      ?.quote as Array<Record<string, number[]>> | undefined
  )?.[0] ?? {}
  const adjArr = (
    (result.indicators as Record<string, unknown> | undefined)
      ?.adjclose as Array<{ adjclose: (number | null)[] }> | undefined
  )?.[0]?.adjclose ?? []

  const opens   = (quote.open   as (number | null)[]) ?? []
  const highs   = (quote.high   as (number | null)[]) ?? []
  const lows    = (quote.low    as (number | null)[]) ?? []
  const closes  = (quote.close  as (number | null)[]) ?? []
  const volumes = (quote.volume as (number | null)[]) ?? []

  const bars: YFChartBar[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const c = closes[i]
    if (c == null || c <= 0) continue
    const adj = adjArr[i] ?? c
    bars.push({
      date:      new Date(timestamps[i] * 1000).toISOString().split('T')[0],
      open:      opens[i]   ?? c,
      high:      highs[i]   ?? c,
      low:       lows[i]    ?? c,
      close:     c,
      adj_close: adj > 0 ? adj : c,
      volume:    volumes[i] ?? 0,
    })
  }
  return bars
}

// ── Intraday bars (5m/15m interval, today only) ────────────────────────────

export interface YFIntradayBar {
  timestamp: number // Unix seconds — UTCTimestamp for lightweight-charts
  value: number
}

/** Fetch today's intraday bars. interval: "5m" | "15m" | "1m" */
export async function getYFIntraday(
  symbol: string,
  interval = '5m'
): Promise<YFIntradayBar[]> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?interval=${interval}&range=1d`

  const data = await yfGet(url)

  const result = (
    (data as { chart?: { result?: unknown[] } }).chart?.result?.[0]
  ) as Record<string, unknown> | undefined

  if (!result) return []

  const timestamps = (result.timestamp as number[] | undefined) ?? []
  const closes = (
    (result.indicators as Record<string, unknown> | undefined)
      ?.quote as Array<Record<string, (number | null)[]>> | undefined
  )?.[0]?.close ?? []

  const bars: YFIntradayBar[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const v = closes[i]
    if (v == null || v <= 0) continue
    bars.push({ timestamp: timestamps[i], value: v })
  }
  return bars
}

// ── Batch quotes (screener / rankings / heatmap) ────────────────────────────

export interface YFBatchQuote {
  symbol: string
  name: string
  price: number
  changePct: number
  marketCap: number | null
  pe: number | null
  forwardPE: number | null
  pb: number | null
  dividendYield: number | null
  roe: number | null
  beta: number | null
  week52High: number | null
  week52Low: number | null
  avgVolume: number | null
  sector: string | null
  industry: string | null
  eps: number | null
}

function num(v: unknown): number | null {
  return typeof v === 'number' && isFinite(v) ? v : null
}

export async function getYFBatchQuotes(symbols: string[]): Promise<YFBatchQuote[]> {
  if (!symbols.length) return []
  const fields = [
    'regularMarketPrice', 'regularMarketChangePercent', 'marketCap',
    'trailingPE', 'forwardPE', 'priceToBook', 'trailingAnnualDividendYield',
    'returnOnEquity', 'beta', 'fiftyTwoWeekHigh', 'fiftyTwoWeekLow',
    'averageDailyVolume3Month', 'sector', 'industry', 'longName', 'shortName',
    'epsCurrentYear',
  ].join(',')

  const data = await yfGet(
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}&fields=${fields}`
  )
  const results = (
    (data as { quoteResponse?: { result?: unknown[] } }).quoteResponse?.result ?? []
  ) as Array<Record<string, unknown>>

  return results.map((q) => ({
    symbol: String(q.symbol ?? ''),
    name: String(q.longName ?? q.shortName ?? q.symbol ?? ''),
    price: num(q.regularMarketPrice) ?? 0,
    changePct: num(q.regularMarketChangePercent) ?? 0,
    marketCap: num(q.marketCap),
    pe: num(q.trailingPE),
    forwardPE: num(q.forwardPE),
    pb: num(q.priceToBook),
    dividendYield: num(q.trailingAnnualDividendYield),
    roe: num(q.returnOnEquity),
    beta: num(q.beta),
    week52High: num(q.fiftyTwoWeekHigh),
    week52Low: num(q.fiftyTwoWeekLow),
    avgVolume: num(q.averageDailyVolume3Month),
    sector: (q.sector as string | null) ?? null,
    industry: (q.industry as string | null) ?? null,
    eps: num(q.epsCurrentYear),
  }))
}
