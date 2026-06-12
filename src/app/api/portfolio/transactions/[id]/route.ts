import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as {
    symbol?: string; type?: string; quantity?: number
    pricePerShare?: number; date?: string; fees?: number
  }

  const { error } = await supabase
    .from('portfolio_transactions')
    .update({
      ...(body.symbol        !== undefined && { symbol: body.symbol }),
      ...(body.type          !== undefined && { type: body.type }),
      ...(body.quantity      !== undefined && { quantity: body.quantity }),
      ...(body.pricePerShare !== undefined && { price_per_share: body.pricePerShare }),
      ...(body.date          !== undefined && { date: body.date }),
      ...(body.fees          !== undefined && { fees: body.fees }),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('portfolio_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
