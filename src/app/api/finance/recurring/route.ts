import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FinanceRecurring } from '@/types/finance'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('finance_recurring')
    .select('id, name, amount, category_id, frequency, next_due, type, active')
    .eq('user_id', user.id)
    .order('next_due', { ascending: true, nullsFirst: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows: FinanceRecurring[] = (data ?? []).map((r) => ({
    id: r.id, name: r.name, amount: Number(r.amount), category_id: r.category_id,
    frequency: r.frequency, next_due: r.next_due, type: r.type, active: r.active,
  }))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const b = await req.json() as Partial<FinanceRecurring>
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('finance_recurring')
    .insert({
      user_id:     user.id,
      name:        b.name.trim(),
      amount:      Number(b.amount) || 0,
      category_id: b.category_id ?? null,
      frequency:   b.frequency ?? 'monthly',
      next_due:    b.next_due ?? null,
      type:        b.type ?? 'expense',
      active:      b.active ?? true,
    })
    .select('id, name, amount, category_id, frequency, next_due, type, active').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
