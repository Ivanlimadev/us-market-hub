import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FinanceTransaction } from '@/types/finance'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const b = await req.json() as Partial<FinanceTransaction>
  const patch: Record<string, unknown> = {}
  if (b.type !== undefined)        patch.type = b.type
  if (b.amount !== undefined) {
    const amount = Number(b.amount)
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Amount must be > 0' }, { status: 400 })
    patch.amount = amount
  }
  if (b.date !== undefined)        patch.date = b.date
  if (b.account_id !== undefined)  patch.account_id = b.account_id
  if (b.category_id !== undefined) patch.category_id = b.category_id
  if (b.note !== undefined)        patch.note = b.note

  const { error } = await supabase.from('finance_transactions').update(patch).eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { error } = await supabase
    .from('finance_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
