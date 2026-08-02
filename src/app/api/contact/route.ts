import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit, getIp } from '@/lib/rate-limit'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const TO = 'contact@stockmarketroi.com'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  // 3 messages per 10 min per IP.
  if (!rateLimit(getIp(req), 3, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 })
  }

  const b = await req.json().catch(() => null) as
    | { name?: string; email?: string; subject?: string; message?: string; company?: string }
    | null
  if (!b) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  // Honeypot - real users never fill the hidden 'company' field.
  if (b.company) return NextResponse.json({ success: true })

  const name    = (b.name ?? '').trim().slice(0, 120)
  const email   = (b.email ?? '').trim().slice(0, 200)
  const subject = (b.subject ?? 'General Question').trim().slice(0, 160)
  const message = (b.message ?? '').trim().slice(0, 5000)

  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return NextResponse.json(
      { error: 'Please provide your name, a valid email and a message (at least 10 characters).' },
      { status: 400 },
    )
  }

  if (!resend) {
    return NextResponse.json({ error: 'Email service is temporarily unavailable.' }, { status: 503 })
  }

  const { error } = await resend.emails.send({
    from:    'Stock Market ROI <support@stockmarketroi.com>',
    to:      TO,
    replyTo: email,
    subject: `[Contact] ${subject} - ${name}`,
    text:
      `New contact message from stockmarketroi.com\n\n` +
      `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n`,
  })

  if (error) {
    console.error('[contact] Resend error:', error)
    return NextResponse.json(
      { error: 'Could not send your message right now. Please email us directly at contact@stockmarketroi.com.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
