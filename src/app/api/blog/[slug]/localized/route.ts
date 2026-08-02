import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Languages we machine-translate blog content into (matches the app's locale
// switcher). English is the source and is always served as-is.
const SUPPORTED = new Set(['pt', 'es'])

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Google Translate (text mode) can mangle Markdown links like
// `[Nvidia (NVDA)](/stocks/NVDA)`, breaking our internal ticker links. Swap them
// for private-use-area sentinels the translator passes through untouched, then
// restore them afterwards (the link label stays English, which is fine - they're
// company/asset names). Also covers images `![alt](url)`.
//
// The sentinels are U+E000 / U+E001 - private-use code points that never appear
// in real content, so they can't collide with numbers like "$126,000" or "2010".
const SENT_A = String.fromCodePoint(0xe000)
const SENT_B = String.fromCodePoint(0xe001)

function protectLinks(md: string): { text: string; links: string[] } {
  const links: string[] = []
  const linkRe = /!?\[[^\]]*\]\([^)]*\)/g
  const text = md.replace(linkRe, (m) => {
    links.push(m)
    return `${SENT_A}${links.length - 1}${SENT_B}`
  })
  return { text, links }
}

function restoreLinks(text: string, links: string[]): string {
  const tokenRe = new RegExp(`${SENT_A}(\\d+)${SENT_B}`, 'g')
  return text.replace(tokenRe, (_, i) => links[Number(i)] ?? '')
}

async function googleTranslate(texts: string[], target: string): Promise<string[]> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!key) throw new Error('GOOGLE_TRANSLATE_API_KEY not set')
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, source: 'en', target, format: 'text' }),
    },
  )
  if (!res.ok) {
    throw new Error(`Google Translate ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
  const json = (await res.json()) as {
    data: { translations: { translatedText: string }[] }
  }
  return json.data.translations.map((t) => t.translatedText)
}

/**
 * Returns a published blog post localized to `?lang=` (pt|es), translated on the
 * first request via Google Translate and cached in `blog_post_translations`
 * thereafter. Any unsupported lang, or a translation failure, falls back to the
 * original English post so the app always renders something.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const lang = (req.nextUrl.searchParams.get('lang') ?? '').toLowerCase()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, content, image_url, image_alt, category, published_at, tickers, author_slug, youtube_id',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const cacheHeaders = { 'Cache-Control': 's-maxage=900, stale-while-revalidate=3600' }

  // English or any unsupported language → original post, untouched.
  if (!SUPPORTED.has(lang)) {
    return NextResponse.json({ ...post, lang: 'en', translated: false }, { headers: cacheHeaders })
  }

  const svc = serviceClient()

  // Serve a cached translation if we already have one.
  const { data: cached } = await svc
    .from('blog_post_translations')
    .select('title, excerpt, content')
    .eq('post_id', post.id)
    .eq('lang', lang)
    .maybeSingle()

  if (cached) {
    return NextResponse.json(
      { ...post, ...cached, lang, translated: true },
      { headers: cacheHeaders },
    )
  }

  // Translate once, then cache.
  try {
    const { text: guardedContent, links } = protectLinks(post.content ?? '')
    const [tTitle, tExcerpt, tContent] = await googleTranslate(
      [post.title ?? '', post.excerpt ?? '', guardedContent],
      lang,
    )
    const translated = {
      title: tTitle,
      excerpt: tExcerpt,
      content: restoreLinks(tContent, links),
    }

    // Best-effort cache write - never block the response on it.
    await svc
      .from('blog_post_translations')
      .upsert(
        { post_id: post.id, lang, ...translated, updated_at: new Date().toISOString() },
        { onConflict: 'post_id,lang' },
      )

    return NextResponse.json({ ...post, ...translated, lang, translated: true })
  } catch (e) {
    // Translation unavailable (e.g. key not set / quota) → fall back to English.
    return NextResponse.json({
      ...post,
      lang: 'en',
      translated: false,
      error: (e as Error).message,
    })
  }
}
