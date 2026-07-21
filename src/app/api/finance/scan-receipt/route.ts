import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getIp } from '@/lib/rate-limit'

const anthropic = new Anthropic()

const VALID_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type ValidMime = typeof VALID_MIMES[number]

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 10, 60 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json() as { image?: unknown; mimeType?: unknown }
  if (typeof body.image !== 'string' || !body.image) {
    return NextResponse.json({ error: 'image required' }, { status: 400 })
  }
  const mimeType: ValidMime = VALID_MIMES.includes(body.mimeType as ValidMime)
    ? (body.mimeType as ValidMime)
    : 'image/jpeg'

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: body.image },
            },
            {
              type: 'text',
              text: `Extract expense data from this receipt image. Return ONLY valid JSON — no markdown, no explanation:
{
  "amount": <total amount as number, or null>,
  "date": <"YYYY-MM-DD" or null>,
  "merchant": <store/restaurant name as string, or null>,
  "category": <one of: "Food & Dining", "Shopping", "Transportation", "Entertainment", "Health", "Utilities", "Travel", "Other" — or null>,
  "note": <brief 1-line description, or null>
}`,
            },
          ],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>

    return NextResponse.json({
      amount:   typeof parsed.amount === 'number' ? parsed.amount : null,
      date:     typeof parsed.date === 'string' ? parsed.date : null,
      merchant: typeof parsed.merchant === 'string' ? parsed.merchant : null,
      category: typeof parsed.category === 'string' ? parsed.category : null,
      note:     typeof parsed.note === 'string' ? parsed.note : null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 })
  }
}
