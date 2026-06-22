import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FinanceBudget } from '@/types/finance'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('finance_budgets').select('id, category_id, amount, period').eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const budgets: FinanceBudget[] = (data ?? []).map((r) => ({
    id: r.id, category_id: r.category_id, amount: Number(r.amount), period: r.period,
  }))
  return NextResponse.json(budgets)
}

// Upsert a monthly budget for a category. amount <= 0 removes it.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const b = await req.json() as { category_id?: string; amount?: number }
  if (!b.category_id) return NextResponse.json({ error: 'category_id required' }, { status: 400 })
  const amount = Number(b.amount) || 0

  if (amount <= 0) {
    const { error } = await supabase.from('finance_budgets')
      .delete().eq('user_id', user.id).eq('category_id', b.category_id).eq('period', 'monthly')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, removed: true })
  }

  const { error } = await supabase.from('finance_budgets').upsert(
    { user_id: user.id, category_id: b.category_id, amount, period: 'monthly' },
    { onConflict: 'user_id,category_id,period' },
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
