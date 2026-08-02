import { NextRequest, NextResponse } from 'next/server'
import { getYFOptions } from '@/lib/yahoo-finance'
import { symbolSchema } from '@/lib/validate'

// Delayed data, so a short cache is fine and shields Yahoo from bursts.
export const revalidate = 300

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const parsed = symbolSchema.safeParse(symbol.toUpperCase())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
  }

  const dateParam = new URL(req.url).searchParams.get('date')
  const date = dateParam && /^\d+$/.test(dateParam) ? Number(dateParam) : undefined

  try {
    const chain = await getYFOptions(parsed.data, date)
    if (!chain) {
      return NextResponse.json({ error: 'No options data' }, { status: 404 })
    }
    return NextResponse.json(chain)
  } catch {
    return NextResponse.json({ error: 'Failed to load options' }, { status: 502 })
  }
}
