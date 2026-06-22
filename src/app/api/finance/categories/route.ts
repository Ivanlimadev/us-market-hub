import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_CATEGORIES, type FinanceCategory } from '@/types/finance'

function map(rows: { id: string; name: string; kind: string; icon: string | null; color: string | null }[]): FinanceCategory[] {
  return rows.map((r) => ({ id: r.id, name: r.name, kind: r.kind as FinanceCategory['kind'], icon: r.icon, color: r.color }))
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const sel = 'id, name, kind, icon, color'
  const { data, error } = await supabase
    .from('finance_categories').select(sel).eq('user_id', user.id).order('kind').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Seed defaults on first use.
  if (!data || data.length === 0) {
    const rows = DEFAULT_CATEGORIES.map((c) => ({ user_id: user.id, name: c.name, kind: c.kind }))
    const { data: seeded, error: seedErr } = await supabase.from('finance_categories').insert(rows).select(sel)
    if (seedErr) return NextResponse.json({ error: seedErr.message }, { status: 500 })
    return NextResponse.json(map(seeded ?? []))
  }

  return NextResponse.json(map(data))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const b = await req.json() as Partial<FinanceCategory>
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('finance_categories')
    .insert({ user_id: user.id, name: b.name.trim(), kind: b.kind ?? 'expense' })
    .select('id, name, kind, icon, color').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
