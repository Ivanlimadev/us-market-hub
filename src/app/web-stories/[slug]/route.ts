import { WEB_STORIES, type WebStory } from '@/lib/web-stories'

// Google Web Stories are AMP documents, not React pages. We serve them as raw
// valid AMP HTML from a Route Handler so Next.js does not wrap them in its own
// <html> shell (which would break AMP validation).

export const dynamic = 'force-static'

const BASE = 'https://stockmarketroi.com'
const PUBLISHER_LOGO = `${BASE}/ivan-lima.jpg` // square-ish brand logo (AMP requires publisher-logo-src)
const GA_ID = 'G-XV8QGQ8JS9' // same GA4 property as the main site (layout.tsx)

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function renderStory(story: WebStory): string {
  const storyUrl = `${BASE}/web-stories/${story.slug}`
  // CTA target: an asset page (ctaHref) when provided, otherwise the source blog post.
  const articleUrl = story.ctaHref ? `${BASE}${story.ctaHref}` : `${BASE}/blog/${story.articleSlug}`
  const ctaLabel = story.ctaLabel ?? 'Read the full story'
  const poster = story.slides[0].image

  const pages = story.slides
    .map((slide, i) => {
      const isLast = i === story.slides.length - 1
      const cta = isLast
        ? `<amp-story-cta-layer><a href="${articleUrl}" class="cta">${esc(ctaLabel)} &rarr;</a></amp-story-cta-layer>`
        : ''
      return `
    <amp-story-page id="p${i}">
      <amp-story-grid-layer template="fill">
        <amp-img src="${slide.image}" width="720" height="1280" layout="responsive" alt="${esc(slide.heading)}"></amp-img>
      </amp-story-grid-layer>
      <amp-story-grid-layer template="vertical" class="content">
        <div class="scrim"></div>
        <h1>${esc(slide.heading)}</h1>
        ${slide.text ? `<p>${esc(slide.text)}</p>` : ''}
      </amp-story-grid-layer>
      ${cta}
    </amp-story-page>`
    })
    .join('')

  return `<!doctype html>
<html ⚡ lang="en">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <script async custom-element="amp-story-auto-analytics" src="https://cdn.ampproject.org/v0/amp-story-auto-analytics-0.1.js"></script>
  <title>${esc(story.title)} | ${esc(story.publisher)}</title>
  <meta name="description" content="${esc(story.title)} - a visual story from ${esc(story.publisher)}.">
  <link rel="canonical" href="${storyUrl}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta property="og:title" content="${esc(story.title)}">
  <meta property="og:image" content="${poster}">
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    amp-story { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .content { align-content: end; padding: 32px 28px 64px; }
    .scrim { position: absolute; left: 0; right: 0; bottom: 0; height: 60%;
      background: linear-gradient(to top, rgba(9,9,11,0.92), rgba(9,9,11,0.55) 45%, rgba(9,9,11,0)); }
    h1 { color: #fff; font-size: 30px; line-height: 1.2; font-weight: 800; margin: 0 0 10px; position: relative; }
    p { color: #e4e4e7; font-size: 18px; line-height: 1.45; margin: 0; position: relative; }
    .cta { display: inline-block; background: #c8a45d; color: #09090b; font-weight: 700;
      font-size: 16px; text-decoration: none; padding: 12px 22px; border-radius: 10px; }
  </style>
</head>
<body>
  <amp-story standalone
    title="${esc(story.title)}"
    publisher="${esc(story.publisher)}"
    publisher-logo-src="${PUBLISHER_LOGO}"
    poster-portrait-src="${poster}">${pages}
    <amp-story-auto-analytics gtag-id="${GA_ID}"></amp-story-auto-analytics>
  </amp-story>
</body>
</html>`
}

export function generateStaticParams() {
  return Object.keys(WEB_STORIES).map((slug) => ({ slug }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const story = WEB_STORIES[slug]
  if (!story) return new Response('Not found', { status: 404 })
  return new Response(renderStory(story), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Short browser cache so a stale copy from before a fix expires quickly;
      // Google caches the story on its own side regardless.
      'cache-control': 'public, max-age=60, s-maxage=600, stale-while-revalidate=60',
    },
  })
}
