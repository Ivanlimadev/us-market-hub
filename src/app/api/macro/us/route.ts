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
}

const SERIES: SeriesCfg[] = [
  { id: 'FEDFUNDS', label: 'Fed Funds Rate',      unit: '%', section: 'fed',       direction: -1, limit: 13, transform: 'raw' },
  { id: 'UNRATE',   label: 'Unemployment Rate',   unit: '%', section: 'labor',     direction: -1, limit: 13, transform: 'raw' },
  { id: 'PAYEMS',   label: 'Job Gains',           unit: 'K', section: 'labor',     direction:  1, limit: 14, transform: 'mom_diff' },
  { id: 'CPIAUCSL', label: 'CPI Inflation (YoY)', unit: '%', section: 'inflation', direction: -1, limit: 25, transform: 'yoy' },
  { id: 'GDPC1',    label: 'Real GDP (YoY)',      unit: '%', section: 'growth',    direction:  1, limit: 9,  transform: 'yoy_4' },
  { id: 'DGS10',    label: '10-Year Treasury',    unit: '%', section: 'bonds',     direction: -1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'T10Y2Y',   label: 'Yield Curve (10Y-2Y)', unit: '%', section: 'bonds',   direction:  1, limit: 13, transform: 'raw', frequency: 'm' },
  { id: 'RSXFS',    label: 'Retail Sales (MoM)',  unit: '%', section: 'consumer',  direction:  1, limit: 14, transform: 'mom_pct' },
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
    case 'raw': {
      return {
        value:   obs[0],
        prev:    obs[1] ?? obs[0],
        history: obs.slice(0, 12).reverse(),
      }
    }
    case 'mom_diff': {
      // Absolute MoM change (e.g. thousands of jobs)
      const diffs = obs.slice(0, 13).map((v, i) => (i < 12 ? v - obs[i + 1] : 0)).slice(0, 12)
      return {
        value:   diffs[0],
        prev:    diffs[1],
        history: diffs.slice(0, 12).reverse(),
      }
    }
    case 'mom_pct': {
      const pcts = obs.slice(0, 13).map((v, i) => (i < 12 ? (v - obs[i + 1]) / obs[i + 1] * 100 : 0)).slice(0, 12)
      return {
        value:   pcts[0],
        prev:    pcts[1],
        history: pcts.slice(0, 12).reverse(),
      }
    }
    case 'yoy': {
      // Monthly YoY — obs[i] vs obs[i+12]; needs limit=25 (obs[0..24])
      const yoys = Array.from({ length: 13 }, (_, i) => (obs[i] - obs[i + 12]) / obs[i + 12] * 100)
      return {
        value:   yoys[0],
        prev:    yoys[1],
        history: yoys.slice(0, 12).reverse(),
      }
    }
    case 'yoy_4': {
      // Quarterly YoY — obs[i] vs obs[i+4]; needs limit=9 (obs[0..8])
      const yoys = Array.from({ length: 5 }, (_, i) => (obs[i] - obs[i + 4]) / obs[i + 4] * 100)
      return {
        value:   yoys[0],
        prev:    yoys[1],
        history: yoys.slice(0, 5).reverse(),
      }
    }
  }
}

function round2(n: number) { return Math.round(n * 100) / 100 }

export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'FRED API key not configured' }, { status: 503 })
  }

  try {
    const results = await Promise.all(
      SERIES.map(async (s) => {
        const obs = await fetchObs(s, apiKey)
        const { value, prev, history } = applyTransform(obs, s.transform)
        const change = value - prev
        return {
          id:        s.id,
          label:     s.label,
          unit:      s.unit,
          section:   s.section,
          direction: s.direction,
          value:     round2(value),
          change:    round2(change),
          history:   history.map(round2),
        }
      })
    )

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('[macro/us]', err)
    return NextResponse.json({ error: 'Macro data unavailable' }, { status: 502 })
  }
}
