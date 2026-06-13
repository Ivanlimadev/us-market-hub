import { NextResponse } from 'next/server'
import { getAllArticles } from '@/lib/articles'

export async function GET() {
  try {
    const articles = getAllArticles()
    return NextResponse.json(articles)
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
