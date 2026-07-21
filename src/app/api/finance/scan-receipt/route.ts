import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getIp } from '@/lib/rate-limit'

const anthropic = new Anthropic()

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const VALID_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type ValidMime = typeof VALID_MIMES[number]

export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), 10, 60 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Mobile app sends Bearer token; SSR cookie client won't see it.
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: { user } } = await serviceClient().auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const body = await req.json() as { image?: unknown; mimeType?: unknown }
    console.log('[scan-receipt] body keys:', Object.keys(body ?? {}), 'image type:', typeof body?.image, 'image length:', typeof body?.image === 'string' ? (body.image as string).length : 'N/A')
    if (typeof body.image !== 'string' || !body.image) {
      return NextResponse.json({ error: 'image required', detail: `body keys: ${Object.keys(body ?? {}).join(',')}, image type: ${typeof body?.image}` }, { status: 400 })
    }
    const mimeType: ValidMime = VALID_MIMES.includes(body.mimeType as ValidMime)
      ? (body.mimeType as ValidMime)
      : 'image/jpeg'
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[scan-receipt] error:', msg)
    return NextResponse.json({ error: 'Failed to process receipt', detail: msg }, { status: 500 })
  }
}
