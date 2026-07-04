import { NextRequest, NextResponse } from 'next/server'

// Phase 2 of the social-video pipeline: text -> narrated MP3 via ElevenLabs,
// using one of two fixed presenter voices. Returns the audio directly so it can
// feed the FFmpeg/lip-sync step next. Guarded by CRON_SECRET (paid API).
//
// Required env (set on the VPS):
//   ELEVENLABS_API_KEY        — your ElevenLabs key
//   ELEVENLABS_VOICE_MAYA     — voice id for Maya Bennett (markets/news)
//   ELEVENLABS_VOICE_JENNIFER — voice id for Jennifer Moore (education)
// Optional:
//   ELEVENLABS_MODEL          — defaults to eleven_multilingual_v2

const MAX_CHARS = 5000

// Fixed presenter voices from the ElevenLabs library (public voice ids — safe to
// hardcode). Env vars override if you ever want to swap them.
const VOICE_MAYA = process.env.ELEVENLABS_VOICE_MAYA ?? 'Y2pP8eXRDH19yyV1Tslt' // markets/news anchor
const VOICE_JENNIFER = process.env.ELEVENLABS_VOICE_JENNIFER ?? 'IDHS58OMlK9jZvRdhEVy' // education

function resolveVoiceId(voice: string | null): { id: string | null; label: string } {
  const v = (voice ?? 'maya').toLowerCase().trim()
  if (v === 'maya') return { id: VOICE_MAYA, label: 'maya' }
  if (v === 'jennifer') return { id: VOICE_JENNIFER, label: 'jennifer' }
  // Allow passing a raw ElevenLabs voice id directly.
  if (/^[A-Za-z0-9]{16,}$/.test((voice ?? '').trim())) return { id: (voice as string).trim(), label: 'custom' }
  return { id: null, label: v }
}

async function synthesize(text: string, voice: string | null) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ElevenLabs not configured — set ELEVENLABS_API_KEY on the server.' },
      { status: 503 },
    )
  }

  const clean = text.trim().slice(0, MAX_CHARS)
  if (clean.length < 2) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const { id: voiceId, label } = resolveVoiceId(voice)
  if (!voiceId) {
    return NextResponse.json(
      {
        error:
          'Unknown or unconfigured voice. Use voice=maya or voice=jennifer (set ELEVENLABS_VOICE_MAYA / ELEVENLABS_VOICE_JENNIFER), or pass a raw ElevenLabs voice id.',
      },
      { status: 400 },
    )
  }

  const model = process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2'

  let resp: Response
  try {
    resp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: clean,
          model_id: model,
          // Tuned for energetic-but-clear finance narration.
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      },
    )
  } catch (err) {
    console.error('[video/voice] fetch error:', err)
    return NextResponse.json({ error: 'Voice service unreachable' }, { status: 502 })
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '')
    console.error(`[video/voice] ElevenLabs ${resp.status}:`, detail.slice(0, 300))
    return NextResponse.json(
      { error: `ElevenLabs error ${resp.status}`, detail: detail.slice(0, 300) },
      { status: 502 },
    )
  }

  const audio = await resp.arrayBuffer()
  return new NextResponse(audio, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `inline; filename="voice-${label}.mp3"`,
      'Cache-Control': 'no-store',
    },
  })
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // paid endpoint — never open when unconfigured
  const provided = req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-cron-secret')
  return provided === secret
}

// GET — quick tests from the browser: /api/video/voice?voice=maya&text=Hello&secret=...
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const text = req.nextUrl.searchParams.get('text') ?? ''
  const voice = req.nextUrl.searchParams.get('voice')
  return synthesize(text, voice)
}

// POST — pipeline use: { "text": "...", "voice": "maya" }
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { text?: string; voice?: string } | null
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  return synthesize(body.text ?? '', body.voice ?? null)
}
