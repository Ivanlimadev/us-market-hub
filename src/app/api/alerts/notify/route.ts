import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function formatCondition(alert: {
  condition: string
  targetPrice: number
  targetPct?: number
  referencePrice?: number
}): string {
  if (alert.condition === 'above') return `reached above $${alert.targetPrice.toFixed(2)}`
  if (alert.condition === 'below') return `dropped below $${alert.targetPrice.toFixed(2)}`
  if (alert.condition === 'change_up') return `rose ${alert.targetPct}% from $${alert.referencePrice?.toFixed(2)}`
  if (alert.condition === 'change_down') return `fell ${alert.targetPct}% from $${alert.referencePrice?.toFixed(2)}`
  return ''
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { alertId, currentPrice } = await req.json() as { alertId: string; currentPrice: number }

  const { data: alert } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('id', alertId)
    .eq('user_id', user.id)
    .single()

  if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 })

  const conditionText = formatCondition({
    condition:      alert.condition,
    targetPrice:    Number(alert.target_price),
    targetPct:      alert.target_pct ?? undefined,
    referencePrice: alert.reference_price ?? undefined,
  })

  const subject = `🔔 Alert: ${alert.name} (${alert.symbol}) ${conditionText}`

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#09090b;color:#f4f4f5;border-radius:12px;overflow:hidden">
      <div style="background:#059669;padding:20px 24px">
        <h1 style="margin:0;font-size:18px;color:#fff">Price Alert Triggered</h1>
      </div>
      <div style="padding:24px">
        <p style="font-size:15px;margin:0 0 16px">Your alert for <strong>${alert.name} (${alert.symbol})</strong> was triggered.</p>
        <div style="background:#18181b;border-radius:8px;padding:16px;margin-bottom:20px">
          <p style="margin:0 0 8px;color:#a1a1aa;font-size:13px">CONDITION</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#f4f4f5">${alert.name} ${conditionText}</p>
        </div>
        <div style="background:#18181b;border-radius:8px;padding:16px;margin-bottom:28px">
          <p style="margin:0 0 8px;color:#a1a1aa;font-size:13px">CURRENT PRICE</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#34d399">$${currentPrice.toFixed(2)}</p>
        </div>
        <div style="text-align:center;margin-bottom:24px">
          <a href="https://stockmarketroi.com/${alert.asset_type === 'crypto' ? 'crypto' : 'stocks'}/${alert.asset_type === 'crypto' ? (alert.coingecko_id ?? alert.symbol.toLowerCase()) : alert.symbol}"
            style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:16px;letter-spacing:0.01em">
            Ver ${alert.symbol} no site →
          </a>
        </div>
        <p style="margin:0;font-size:11px;color:#52525b;text-align:center">
          This alert has been marked as triggered. You can create a new alert anytime.<br>
          <a href="https://stockmarketroi.com" style="color:#059669">stockmarketroi.com</a>
        </p>
      </div>
    </div>
  `

  if (!resend) return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  const { error } = await resend.emails.send({
    from:    'Stock Market ROI <alerts@stockmarketroi.com>',
    to:      user.email,
    subject,
    html,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
