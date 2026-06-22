import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FinanceTransaction } from '@/types/finance'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('finance_transactions')
    .select('id, account_id, category_id, type, amount, date, note')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const txns: FinanceTransaction[] = (data ?? []).map((r) => ({
    id: r.id, account_id: r.account_id, category_id: r.category_id,
    type: r.type, amount: Number(r.amount), date: r.date, note: r.note,
  }))
  return NextResponse.json(txns)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json() as Partial<FinanceTransaction> & { transactions?: Partial<FinanceTransaction>[] }

  // Bulk insert (CSV import)
  if (Array.isArray(body.transactions)) {
    const rows = body.transactions
      .filter((t) => Number(t.amount) > 0 && t.date)
      .slice(0, 1000)
      .map((t) => ({
        user_id:     user.id,
        account_id:  t.account_id ?? null,
        category_id: t.category_id ?? null,
        type:        t.type ?? 'expense',
        amount:      Number(t.amount),
        date:        t.date,
        note:        t.note ?? null,
      }))
    if (!rows.length) return NextResponse.json({ error: 'No valid rows' }, { status: 400 })
    const { error } = await supabase.from('finance_transactions').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, inserted: rows.length })
  }

  const b = body
  const amount = Number(b.amount)
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Amount must be > 0' }, { status: 400 })
  if (!b.date) return NextResponse.json({ error: 'Date required' }, { status: 400 })

  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({
      user_id:     user.id,
      account_id:  b.account_id ?? null,
      category_id: b.category_id ?? null,
      type:        b.type ?? 'expense',
      amount,
      date:        b.date,
      note:        b.note ?? null,
    })
    .select('id, account_id, category_id, type, amount, date, note')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
