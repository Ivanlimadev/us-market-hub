import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PriceAlert } from '@/types/watchlist'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 200 })

  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const alerts: PriceAlert[] = (data ?? []).map((r) => ({
    id:             r.id,
    symbol:         r.symbol,
    asset_type:     r.asset_type ?? 'stock',
    coingeckoId:    r.coingecko_id ?? undefined,
    name:           r.name,
    image:          r.image ?? undefined,
    condition:      r.condition,
    targetPrice:    Number(r.target_price),
    targetPct:      r.target_pct != null ? Number(r.target_pct) : undefined,
    referencePrice: r.reference_price != null ? Number(r.reference_price) : undefined,
    triggered:      Boolean(r.triggered),
    triggeredAt:    r.triggered_at ?? undefined,
    createdAt:      r.created_at,
  }))

  return NextResponse.json(alerts)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json() as { alert?: PriceAlert; alerts?: PriceAlert[] }

  // Bulk insert (migration from localStorage)
  if (body.alerts) {
    const rows = body.alerts.map((a) => ({
      id:              a.id,
      user_id:         user.id,
      symbol:          a.symbol,
      asset_type:      a.asset_type ?? 'stock',
      coingecko_id:    a.coingeckoId ?? null,
      name:            a.name,
      image:           a.image ?? null,
      condition:       a.condition,
      target_price:    a.targetPrice,
      target_pct:      a.targetPct ?? null,
      reference_price: a.referencePrice ?? null,
      triggered:       a.triggered,
      triggered_at:    a.triggeredAt ?? null,
      created_at:      a.createdAt,
    }))
    const { error } = await supabase.from('price_alerts').upsert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Single insert
  const alert = body.alert
  if (!alert) return NextResponse.json({ error: 'Missing alert' }, { status: 400 })

  const { error } = await supabase.from('price_alerts').insert({
    id:              alert.id,
    user_id:         user.id,
    symbol:          alert.symbol,
    asset_type:      alert.asset_type ?? 'stock',
    coingecko_id:    alert.coingeckoId ?? null,
    name:            alert.name,
    image:           alert.image ?? null,
    condition:       alert.condition,
    target_price:    alert.targetPrice,
    target_pct:      alert.targetPct ?? null,
    reference_price: alert.referencePrice ?? null,
    triggered:       alert.triggered,
    triggered_at:    alert.triggeredAt ?? null,
    created_at:      alert.createdAt,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
