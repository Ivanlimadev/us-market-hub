import { NextResponse } from 'next/server'

export interface FearGreedPoint {
  value: number
  classification: string
  timestamp: number
}

export async function GET() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=30', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`FNG ${res.status}`)
    const raw = await res.json() as {
      data: Array<{ value: string; value_classification: string; timestamp: string }>
    }
    const points: FearGreedPoint[] = raw.data.map((d) => ({
      value:          parseInt(d.value, 10),
      classification: d.value_classification,
      timestamp:      parseInt(d.timestamp, 10),
    }))
    return NextResponse.json(points, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
