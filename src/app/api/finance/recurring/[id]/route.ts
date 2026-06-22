import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FinanceRecurring } from '@/types/finance'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const b = await req.json() as Partial<FinanceRecurring>
  const patch: Record<string, unknown> = {}
  if (b.name !== undefined)        patch.name = b.name.trim()
  if (b.amount !== undefined)      patch.amount = Number(b.amount) || 0
  if (b.category_id !== undefined) patch.category_id = b.category_id
  if (b.frequency !== undefined)   patch.frequency = b.frequency
  if (b.next_due !== undefined)    patch.next_due = b.next_due
  if (b.type !== undefined)        patch.type = b.type
  if (b.active !== undefined)      patch.active = b.active

  const { error } = await supabase.from('finance_recurring').update(patch).eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { error } = await supabase.from('finance_recurring').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
