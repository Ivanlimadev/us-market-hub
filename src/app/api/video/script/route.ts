import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Phase 1 of the social-video pipeline: turn a published blog post into a
// ready-to-shoot TikTok/Reels script + a YouTube script, narrated by one of two
// fixed presenters. Voice/avatar generation is a later phase; this only writes
// the scripts. Guarded by CRON_SECRET so the paid Anthropic call isn't public.

type AuthorKey = 'maya' | 'jennifer'

const AUTHORS: Record<AuthorKey, { name: string; persona: string }> = {
  // News/markets anchor — recaps, macro, single-ticker analysis
  maya: {
    name: 'Maya Bennett',
    persona:
      'a sharp, credible markets & breaking-news anchor. Energetic and punchy but never clickbait — she respects the viewer and the numbers.',
  },
  // Educator — explainers, how-tos, evergreen investing concepts
  jennifer: {
    name: 'Jennifer Moore',
    persona:
      'a warm, clear investing educator who makes complex ideas simple. Approachable and encouraging, with a "let me show you" energy.',
  },
}

function pickAuthor(category: string | null): AuthorKey {
  const c = (category ?? '').toLowerCase()
  if (['markets', 'economics', 'stocks', 'crypto'].includes(c)) return 'maya'
  return 'jennifer' // Investing, Finance, Technology, and anything else
}

const OUTPUT_SHAPE = `Return ONLY a raw JSON object (no markdown, no code fences, no commentary) with EXACTLY this shape:
{
  "tiktok": {
    "hookText": "the 0-3s on-screen hook, max ~7 words, a pattern interrupt",
    "durationSeconds": 60,
    "scenes": [
      { "time": "0-4s", "visual": "avatar on camera | b-roll of ... | chart of ...", "voiceover": "what the presenter says", "onScreenText": "big caption on screen" }
    ],
    "socialCaption": "the post caption for TikTok/Reels/Shorts, ending with 4-6 relevant hashtags"
  },
  "youtube": {
    "title": "SEO title for YouTube, <70 chars",
    "description": "2-3 sentence description with 1 link line to https://stockmarketroi.com and relevant hashtags",
    "script": "the full spoken narration for a ~3 minute video, in short paragraphs: cold-open hook, then the body beats, then a CTA close"
  }
}`

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const provided =
    req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-cron-secret')
  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Anthropic not configured' }, { status: 503 })
  }

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug param required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, content, category, tickers')
    .eq('slug', slug)
    .eq('status', 'published')
    .single<{
      title: string
      excerpt: string | null
      content: string
      category: string | null
      tickers: string[] | null
    }>()

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const authorKey = pickAuthor(post.category)
  const author = AUTHORS[authorKey]
  const tickers = (post.tickers ?? []).join(', ')

  const system = `You are the head social-video writer for Stock Market ROI (stockmarketroi.com), a US-focused investing brand with an iOS app. You turn a blog post into two short-form video scripts narrated by a fixed on-camera presenter.

PRESENTER: ${author.name} — ${author.persona}

FORMAT — hybrid: the presenter appears on camera for the hook and the closing CTA; the middle is voiceover over dynamic b-roll (animated charts, big numbers, stock logos, tickers). Every scene must specify a concrete visual.

RULES:
- US audience, English. Finance-credible tone: energetic and scroll-stopping, but accurate and never clickbait or hype that would erode trust.
- Use only facts present in the article. Never invent numbers.
- Fast cuts (a new scene roughly every 3-4 seconds). On-screen text is short and punchy.
- Always end with a call to action to read the full breakdown on the blog and/or track it live in the Stock Market ROI iOS app.
- Keep the TikTok script tight — aim for ~60 seconds.

${OUTPUT_SHAPE}`

  const userPrompt = `Write the two video scripts for this article.

TITLE: ${post.title}
CATEGORY: ${post.category ?? 'General'}
TICKERS: ${tickers || '(none)'}
EXCERPT: ${post.excerpt ?? ''}

ARTICLE (Markdown):
${post.content}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let raw = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 6000,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    })
    raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
  } catch (err) {
    console.error('[video/script] Anthropic error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 502 })
  }

  // Strip any accidental code fences, then parse.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  let scripts: unknown
  try {
    scripts = JSON.parse(cleaned)
  } catch {
    // Fall back to returning the raw text so a bad-JSON run is still usable.
    return NextResponse.json(
      { slug, author: author.name, authorKey, raw, warning: 'Model did not return valid JSON' },
      { status: 200 },
    )
  }

  return NextResponse.json({
    slug,
    title: post.title,
    author: author.name,
    authorKey,
    tickers: post.tickers ?? [],
    scripts,
  })
}
