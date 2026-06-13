import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Transaction } from '@/types/portfolio'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 200 })

  const { data, error } = await supabase
    .from('portfolio_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const transactions: Transaction[] = (data ?? []).map((r) => ({
    id:            r.id,
    symbol:        r.symbol,
    type:          r.type,
    quantity:      Number(r.quantity),
    pricePerShare: Number(r.price_per_share),
    date:          r.date,
    fees:          Number(r.fees),
    asset_type:    r.asset_type ?? 'stock',
    coingeckoId:   r.coingecko_id ?? undefined,
  }))

  return NextResponse.json(transactions)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json() as { transactions?: Transaction[]; transaction?: Transaction }

  // Bulk insert (migration from localStorage)
  if (body.transactions) {
    const rows = body.transactions.map((tx) => ({
      id:              tx.id,
      user_id:         user.id,
      symbol:          tx.symbol,
      type:            tx.type,
      quantity:        tx.quantity,
      price_per_share: tx.pricePerShare,
      date:            tx.date,
      fees:            tx.fees,
      asset_type:      tx.asset_type ?? 'stock',
      coingecko_id:    tx.coingeckoId ?? null,
    }))

    const { error } = await supabase.from('portfolio_transactions').upsert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Single insert
  const tx = body.transaction
  if (!tx) return NextResponse.json({ error: 'Missing transaction' }, { status: 400 })

  const { error } = await supabase.from('portfolio_transactions').insert({
    id:              tx.id,
    user_id:         user.id,
    symbol:          tx.symbol,
    type:            tx.type,
    quantity:        tx.quantity,
    price_per_share: tx.pricePerShare,
    date:            tx.date,
    fees:            tx.fees,
    asset_type:      tx.asset_type ?? 'stock',
    coingecko_id:    tx.coingeckoId ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
