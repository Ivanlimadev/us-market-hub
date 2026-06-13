import { NextResponse } from 'next/server'
import { cgGlobal } from '@/lib/coingecko'

export async function GET() {
  try {
    const data = await cgGlobal()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
