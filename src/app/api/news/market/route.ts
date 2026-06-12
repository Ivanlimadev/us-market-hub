import { NextResponse } from 'next/server'
import { getMarketNews } from '@/lib/news-feed'

export const revalidate = 900 // 15 minutes

export async function GET() {
  try {
    const news = await getMarketNews()
    return NextResponse.json(news, {
      headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
