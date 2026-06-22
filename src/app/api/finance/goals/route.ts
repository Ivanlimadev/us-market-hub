import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FinanceGoal } from '@/types/finance'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('finance_goals')
    .select('id, name, target_amount, current_amount, target_date')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const goals: FinanceGoal[] = (data ?? []).map((r) => ({
    id: r.id, name: r.name, target_amount: Number(r.target_amount),
    current_amount: Number(r.current_amount), target_date: r.target_date,
  }))
  return NextResponse.json(goals)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const b = await req.json() as Partial<FinanceGoal>
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('finance_goals')
    .insert({
      user_id:        user.id,
      name:           b.name.trim(),
      target_amount:  Number(b.target_amount) || 0,
      current_amount: Number(b.current_amount) || 0,
      target_date:    b.target_date ?? null,
    })
    .select('id, name, target_amount, current_amount, target_date').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
