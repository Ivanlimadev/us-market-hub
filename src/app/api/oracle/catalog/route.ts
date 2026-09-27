import { NextResponse } from 'next/server'
import { ADAPTERS } from '@/lib/oracle/registry'
import type { CatalogEntry } from '@/lib/oracle/types'

// GET /api/oracle/catalog
// Machine-readable index of what the oracle serves. Consumers read this to
// discover available data. Only green (freely distributable) adapters are
// exposed; yellow/red are registered for the roadmap but withheld until
// licensing is in place.
export async function GET() {
  const catalog: CatalogEntry[] = ADAPTERS
    .filter((a) => a.meta.license === 'green')
    .map((a) => ({ key: a.key, ...a.meta }))

  return NextResponse.json(
    { count: catalog.length, data: catalog },
    { headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1800' } },
  )
}
