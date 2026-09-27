import { NextResponse } from 'next/server'
import { getInsiderData } from '@/lib/insiders'

// Thin HTTP wrapper. The parsing/sourcing logic lives in `@/lib/insiders` so the
// oracle gateway adapter can reuse it without an internal HTTP hop.
export async function GET(req: Request) {
  const symbol = new URL(req.url).searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const r = await getInsiderData(symbol)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json(r.data)
}
