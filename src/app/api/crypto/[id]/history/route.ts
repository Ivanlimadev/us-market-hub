import { NextRequest, NextResponse } from 'next/server'
import { cgHistory } from '@/lib/coingecko'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const days = Number(req.nextUrl.searchParams.get('days') ?? 30)

  try {
    const data = await cgHistory(id, Math.min(days, 365))
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
