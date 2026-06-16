import { NextRequest, NextResponse } from 'next/server'
import { cgHistory } from '@/lib/coingecko'
import { parseCryptoId, badRequest } from '@/lib/validate'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: raw } = await params
  const { value: id, error } = parseCryptoId(raw)
  if (error) return badRequest(error)
  const days = Math.min(Math.max(1, Number(req.nextUrl.searchParams.get('days') ?? 30) || 30), 365)

  try {
    const data = await cgHistory(id, days)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
