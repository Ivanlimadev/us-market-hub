import { NextResponse } from 'next/server'
import { getDefiTVL } from '@/lib/defillama'

// Thin HTTP wrapper. Logic lives in `@/lib/defillama` so the oracle gateway
// adapter can reuse it without an internal HTTP hop.
export async function GET() {
  const r = await getDefiTVL()
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json(r.data)
}
