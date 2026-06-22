import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FinanceAccount } from '@/types/finance'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const b = await req.json() as Partial<FinanceAccount>
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (b.name !== undefined)        patch.name = b.name.trim()
  if (b.type !== undefined)        patch.type = b.type
  if (b.balance !== undefined)     patch.balance = Number(b.balance) || 0
  if (b.currency !== undefined)    patch.currency = b.currency
  if (b.institution !== undefined) patch.institution = b.institution
  if (b.archived !== undefined)    patch.archived = b.archived

  const { error } = await supabase
    .from('finance_accounts')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { error } = await supabase
    .from('finance_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
