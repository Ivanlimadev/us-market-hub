import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIp } from '@/lib/rate-limit'

export const revalidate = 3600

const FRED = 'https://api.stlouisfed.org/fred/series/observations'

type Transform = 'raw' | 'mom_diff' | 'mom_pct' | 'yoy' | 'yoy_4'

interface SeriesCfg {
  id: string
  label: string
  unit: string
  section: string
  direction: 1 | -1
  limit: number
  transform: Transform
  frequency?: string
  postScale?: number
}

const SERIES: SeriesCfg[] = [
  // ── Federal Reserve ──────────────────────────────────────────────────────────
  { id: 'FEDFUNDS',      label: 'Fed Funds Rate',               unit: '%',   section: 'fed',       direction: -1, limit: 13, transform: 'raw' },
  // ── Labor Market ─────────────────────────────────────────────────────────────
  { id: 'UNRATE',        label: 'Unemployment Rate',            unit: '%',   section: 'labor',     direction: -1, limit: 13, transform: 'raw' },
  { id: 'U6RATE',        label: 'U-6 Underemployment',          unit: '%',   section: 'labor',     direction: -1, limit: 13, transform: 'raw' },
  { id: 'PAYEMS',        label: 'Nonfarm Payrolls (MoM)',       unit: 'K',   section: 'labor',     direction:  1, limit: 14, transform: 'mom_diff' },
  { id: 'ICSA',          label: 'Initial Jobless Claims',       unit: 'K',   section: 'labor',     direction: -1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'CIVPART',       label: 'Labor Force Participation',    unit: '%',   section: 'labor',     direction:  1, limit: 13, transform: 'raw' },
  { id: 'JTSJOL',        label: 'Job Openings (JOLTS)',         unit: 'K',   section: 'labor',     direction:  1, limit: 13, transform: 'raw' },
  { id: 'JTSQUR',        label: 'Quits Rate',                   unit: '%',   section: 'labor',     direction:  1, limit: 13, transform: 'raw' },
  // ── Inflation ─────────────────────────────────────────────────────────────────
  { id: 'CPIAUCSL',      label: 'CPI Inflation (YoY)',          unit: '%',   section: 'inflation', direction: -1, limit: 25, transform: 'yoy' },
  { id: 'CPILFESL',      label: 'Core CPI (ex Food & Energy)',  unit: '%',   section: 'inflation', direction: -1, limit: 25, transform: 'yoy' },
  { id: 'PCEPILFE',      label: 'Core PCE (Fed Target)',        unit: '%',   section: 'inflation', direction: -1, limit: 25, transform: 'yoy' },
  { id: 'MICH',         label: 'Inflation Expectations 1Y',    unit: '%',   section: 'inflation', direction: -1, limit: 13, transform: 'raw' },
  // ── Economic Growth ───────────────────────────────────────────────────────────
  { id: 'GDPC1',         label: 'Real GDP (YoY)',               unit: '%',   section: 'growth',    direction:  1, limit: 9,  transform: 'yoy_4' },
  { id: 'INDPRO',        label: 'Industrial Production (MoM)',  unit: '%',   section: 'growth',    direction:  1, limit: 14, transform: 'mom_pct' },
  // ── Consumer ─────────────────────────────────────────────────────────────────
  { id: 'RSXFS',         label: 'Retail Sales (MoM)',           unit: '%',   section: 'consumer',  direction:  1, limit: 14, transform: 'mom_pct' },
  { id: 'UMCSENT',       label: 'Consumer Sentiment (UMich)',   unit: 'pts', section: 'consumer',  direction:  1, limit: 13, transform: 'raw' },
  { id: 'PSAVERT',       label: 'Personal Savings Rate',        unit: '%',   section: 'consumer',  direction:  1, limit: 13, transform: 'raw' },
  // ── Fixed Income ─────────────────────────────────────────────────────────────
  { id: 'DGS2',          label: '2-Year Treasury Yield',        unit: '%',   section: 'bonds',     direction: -1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'DGS10',         label: '10-Year Treasury Yield',       unit: '%',   section: 'bonds',     direction: -1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'DGS30',         label: '30-Year Treasury Yield',       unit: '%',   section: 'bonds',     direction: -1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'T10Y2Y',        label: 'Yield Curve (10Y–2Y)',         unit: '%',   section: 'bonds',     direction:  1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'T10YIE',       label: 'Breakeven Inflation 10Y',      unit: '%',   section: 'bonds',     direction: -1, limit: 13, transform: 'raw', frequency: 'm' },
  // ── Financial Markets ─────────────────────────────────────────────────────────
  { id: 'VIXCLS',        label: 'VIX — Volatility Index',       unit: 'pts', section: 'markets',   direction: -1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'BAMLH0A0HYM2',  label: 'High Yield Spread (OAS)',      unit: '%',   section: 'markets',   direction: -1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'DTWEXBGS',      label: 'US Dollar Index',              unit: 'idx', section: 'markets',   direction:  1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'MORTGAGE30US',  label: '30-Year Mortgage Rate',        unit: '%',   section: 'markets',   direction: -1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'SP500',        label: 'S&P 500 Index',                unit: 'pts', section: 'markets',   direction:  1, limit: 13, transform: 'raw', frequency: 'm' },
  // ── Leading Indicators ────────────────────────────────────────────────────────
  { id: 'RECPROUSM156N', label: 'NY Fed Recession Probability', unit: '%',   section: 'leading',   direction: -1, limit: 13, transform: 'raw' },
  { id: 'PERMIT',        label: 'Building Permits',             unit: 'K',   section: 'leading',   direction:  1, limit: 13, transform: 'raw' },
  // ── Fiscal Policy ─────────────────────────────────────────────────────────────
  { id: 'WALCL',         label: 'Fed Balance Sheet',            unit: 'T',   section: 'fiscal',    direction:  1, limit: 13, transform: 'raw', frequency: 'm', postScale: 0.000001 },
  { id: 'GFDEGDQ188S',   label: 'Federal Debt / GDP',           unit: '%',   section: 'fiscal',    direction: -1, limit: 6,  transform: 'raw' },
  // ── Housing ───────────────────────────────────────────────────────────────────
  { id: 'HOUST',         label: 'Housing Starts',               unit: 'K',   section: 'housing',   direction:  1, limit: 13, transform: 'raw' },
  { id: 'CSUSHPISA',     label: 'Case-Shiller HPI (YoY)',       unit: '%',   section: 'housing',   direction:  1, limit: 25, transform: 'yoy' },
  { id: 'HSN1F',         label: 'New Home Sales',               unit: 'K',   section: 'housing',   direction:  1, limit: 13, transform: 'raw' },
  // ── Money Supply ──────────────────────────────────────────────────────────────
  { id: 'M2SL',          label: 'M2 Money Supply (YoY)',        unit: '%',   section: 'money',     direction:  1, limit: 25, transform: 'yoy' },
  // ── Commodities ───────────────────────────────────────────────────────────────
  { id: 'DCOILWTICO',   label: 'WTI Crude Oil',                unit: '$',   section: 'commodities', direction: -1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'PCOPPUSDM',    label: 'Copper ($/lb)',                 unit: '$',   section: 'commodities', direction:  1, limit: 13, transform: 'raw', postScale: 0.000454 },
]

async function fetchObs(cfg: SeriesCfg, apiKey: string): Promise<number[]> {
  const params = new URLSearchParams({
    series_id: cfg.id,
    api_key:   apiKey,
    sort_order: 'desc',
    limit:     String(cfg.limit),
    file_type: 'json',
    ...(cfg.frequency ? { frequency: cfg.frequency } : {}),
  })
  const res = await fetch(`${FRED}?${params}`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`FRED ${cfg.id}: ${res.status}`)
  const data = await res.json()
  return (data.observations as { value: string }[])
    .map(o => parseFloat(o.value))
    .filter(v => !isNaN(v))
}

function applyTransform(obs: number[], kind: Transform) {
  switch (kind) {
    case 'raw':
      return { value: obs[0], prev: obs[1] ?? obs[0], history: obs.slice(0, 12).reverse() }
    case 'mom_diff': {
      const diffs = obs.slice(0, 13).map((v, i) => i < 12 ? v - obs[i + 1] : 0).slice(0, 12)
      return { value: diffs[0], prev: diffs[1], history: diffs.slice(0, 12).reverse() }
    }
    case 'mom_pct': {
      const pcts = obs.slice(0, 13).map((v, i) => i < 12 ? (v - obs[i + 1]) / obs[i + 1] * 100 : 0).slice(0, 12)
      return { value: pcts[0], prev: pcts[1], history: pcts.slice(0, 12).reverse() }
    }
    case 'yoy': {
      const yoys = Array.from({ length: 13 }, (_, i) => (obs[i] - obs[i + 12]) / obs[i + 12] * 100)
      return { value: yoys[0], prev: yoys[1], history: yoys.slice(0, 12).reverse() }
    }
    case 'yoy_4': {
      const yoys = Array.from({ length: 5 }, (_, i) => (obs[i] - obs[i + 4]) / obs[i + 4] * 100)
      return { value: yoys[0], prev: yoys[1], history: yoys.slice(0, 5).reverse() }
    }
  }
}

function round2(n: number) { return Math.round(n * 100) / 100 }

export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'FRED API key not configured' }, { status: 503 })

  type IndicatorResult = {
    id: string; label: string; unit: string; section: string
    direction: number; value: number; change: number; history: number[]
  }

  const settled = await Promise.allSettled(
    SERIES.map(async (s): Promise<IndicatorResult> => {
      const obs = await fetchObs(s, apiKey)
      const { value, prev, history } = applyTransform(obs, s.transform)
      const scale = s.postScale ?? 1
      return {
        id:        s.id,
        label:     s.label,
        unit:      s.unit,
        section:   s.section,
        direction: s.direction,
        value:     round2(value * scale),
        change:    round2((value - prev) * scale),
        history:   history.map(v => round2(v * scale)),
      }
    })
  )

  const results = settled
    .filter((r): r is PromiseFulfilledResult<IndicatorResult> => r.status === 'fulfilled')
    .map(r => r.value)

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' },
  })
}
