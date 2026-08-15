# Manual Blog Post Guide (Stock Market ROI)

Checklist for **hand-written** posts (the AI robot is paused for AdSense quality).
These are the conventions the site expects so a manual post looks and behaves
exactly like the curated ones. Posts live in the Supabase `blog_posts` table.

## Golden rule: link every ticker

**Every company/asset mentioned in the body must link to its `/stocks/SYMBOL`
page on its first mention** (later mentions can stay plain). This is the biggest
thing that separates a "real" post from a thin one - it builds internal links
(SEO) and keeps readers on-site.

- Pattern: `[Exxon Mobil (XOM)](/stocks/xom)`, `[JPMorgan](/stocks/jpm)`.
  Use a **lowercase** symbol in the URL - it matches each stock page's canonical
  and avoids a 301 hop (the proxy redirects uppercase → lowercase). Display text
  keeps the uppercase ticker in parens; only the path is lowercase.
- Bold + link is fine: `[**Micron (MU)**](/stocks/mu)` renders as a bold link.
- Root-relative paths only (`/stocks/xom`), never full URLs - so links work
  **in the app too** (the app navigates `/stocks/**` in-app; absolute URLs open
  Safari and leave the app).
- Only link tickers that are real, data-backed pages (in the curated universe).
  Do **not** link non-tickers that happen to be uppercase in parens: `(CPI)`,
  `(PPI)`, `(CEO)`, `(FIRE)`, `(AI)`.
- A daily market recap should end up with ~10-14 inline `/stocks/` links.

## Required fields (blog_posts row)

| Field | Rule |
|---|---|
| `slug` | kebab-case, keyword-rich, dated for recaps: `stock-market-today-<theme>-july-13-2026` |
| `title` | Primary keyword + year. Recaps: `Stock Market Today (July 13, 2026): <hook>` |
| `seo_title` | ≤ ~60 chars, with a hook: `Stock Market Today (Jul 13): Oil Jumps, Chips Slide` |
| `seo_description` | ~150-160 chars, keyword + what moved + tease |
| `excerpt` | 220-340 chars; open with a specific data point/tension, tease the verdict |
| `content` | Markdown (see structure below) |
| `category` | `Markets` for recaps; else `Stocks`/`Investing`/`Economics`/`Technology`/`Finance`/`Crypto` |
| `tickers` | text[] of every symbol discussed - drives the ticker chips **and** the push audience |
| `author_slug` | `ivan-lima` (single-author for E-E-A-T) |
| `status` | `published` (needed for the site + the new-post push) |
| `published_at` | `now()` (push only fires within 35 min of this) |
| `image_url` | landscape Pexels image (`https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&h=650&w=940`) - verify it 200s + view it |
| `image_alt` | descriptive, keyword-aware |

## Content structure (Markdown)

1. 1-2 sentence lede stating what happened and why.
2. `## H2` sections; `### H3` sub-sections. Primary keyword in the opening
   paragraph and in at least one `## H2`.
3. **Link every ticker** on first mention (golden rule above).
4. One mid-article contextual CTA to a `/stocks/SYMBOL` page.
5. One tool CTA near the end to `/screener` (or `/compare`, `/calendar`).
6. End with a `## Bottom Line` - a clear, opinionated BUY/HOLD/AVOID-style verdict.
7. YMYL disclaimer last line:
   `*This article is for informational purposes only and is not financial advice. Always do your own research before investing.*`

## Data honesty (YMYL + AdSense)

- Use **real** numbers. If writing intraday (market not closed), say
  "in Monday afternoon trading" and use "around / roughly" - don't state a close
  you can't confirm. Update exact closing figures once the session ends.
- No invented quotes, price targets presented as fact, or fake sources.

## After inserting

- The new-post **push** fires from the `notify-blog-posts` edge function via the
  `notify-blog-posts-30min` cron (or trigger manually with
  `SELECT net.http_post('…/functions/v1/notify-blog-posts', …)`). It needs
  `status='published'`, `published_at` within 35 min, `notified_at IS NULL`, and
  at least one registered device in `user_fcm_tokens`.
- Blog pages are ISR - edits show within the revalidate window (~60s).
