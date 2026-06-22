import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FinanceAccount } from '@/types/finance'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('finance_accounts')
    .select('id, name, type, balance, currency, institution, archived')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const accounts: FinanceAccount[] = (data ?? []).map((r) => ({
    id: r.id, name: r.name, type: r.type, balance: Number(r.balance),
    currency: r.currency, institution: r.institution, archived: r.archived,
  }))
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const b = await req.json() as Partial<FinanceAccount>
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('finance_accounts')
    .insert({
      user_id:     user.id,
      name:        b.name.trim(),
      type:        b.type ?? 'checking',
      balance:     Number(b.balance) || 0,
      currency:    b.currency ?? 'USD',
      institution: b.institution ?? null,
    })
    .select('id, name, type, balance, currency, institution, archived')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
