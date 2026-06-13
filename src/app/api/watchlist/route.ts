import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { WatchlistItem } from '@/types/watchlist'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 200 })

  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items: WatchlistItem[] = (data ?? []).map((r) => ({
    id:          r.id,
    symbol:      r.symbol,
    asset_type:  r.asset_type ?? 'stock',
    coingeckoId: r.coingecko_id ?? undefined,
    name:        r.name,
    image:       r.image ?? undefined,
    addedAt:     r.added_at,
  }))

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json() as { item?: WatchlistItem; items?: WatchlistItem[] }

  // Bulk insert (migration from localStorage)
  if (body.items) {
    const rows = body.items.map((item) => ({
      id:          item.id,
      user_id:     user.id,
      symbol:      item.symbol,
      asset_type:  item.asset_type ?? 'stock',
      coingecko_id: item.coingeckoId ?? null,
      name:        item.name,
      image:       item.image ?? null,
      added_at:    item.addedAt,
    }))
    const { error } = await supabase.from('watchlist').upsert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Single insert
  const item = body.item
  if (!item) return NextResponse.json({ error: 'Missing item' }, { status: 400 })

  const { error } = await supabase.from('watchlist').insert({
    id:          item.id,
    user_id:     user.id,
    symbol:      item.symbol,
    asset_type:  item.asset_type ?? 'stock',
    coingecko_id: item.coingeckoId ?? null,
    name:        item.name,
    image:       item.image ?? null,
    added_at:    item.addedAt,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
