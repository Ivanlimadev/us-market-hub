# Dollar Watch — weekly series template

A recurring weekly recap of the **US dollar vs its major pairs**, with the
differentiator that every currency is tied back to **its impact on stocks** (so
it's not generic FX filler). Funnels to [/dxy](https://stockmarketroi.com/dxy)
and `/screener`. Follows the rules in `blog-manual-post-guide.md`.

## Cadence
Weekly (pick a fixed day, e.g. Saturday). Each edition is a **new, dated post**
so it stays fresh in search.

## Step 1 — get the data
```
node scripts/dollar-watch-data.mjs
```
Prints the DXY (level, week %, 12M %), every major pair with its ~1-week change
and USD direction, an auto **headline** ("dollar FIRM vs … / SOFT vs …"), and
the date string for the slug/title. **Use these real numbers — never invent.**

## Step 2 — fields (blog_posts row)
| Field | Value |
|---|---|
| `slug` | `dollar-vs-major-currencies-this-week-<month>-<day>-<year>` |
| `title` | `Dollar Watch (<Month Day, Year>): USD vs Euro, Real, Yen & More` |
| `seo_title` | `Dollar Watch (<Mon Day>): USD vs Euro, Real, Yen` (≤ ~60 chars) |
| `seo_description` | ~155 chars: the week's headline + "what it means for your stocks" |
| `category` | `Markets` |
| `author_slug` | `ivan-lima` |
| `status` | `published` (fires the push) |
| `tickers` | the ADRs/multinationals you link (e.g. AAPL, MSFT, VALE, PBR, NU, TM) |
| `image_url` | a verified Pexels forex/money landscape (see guide; 200-check + view) |

## Step 3 — structure (Markdown)
1. **Lede** — DXY level + the one-line split (firm vs developed / soft vs LatAm, or whatever the data says).
2. `## The dollar this week (DXY)` — level + link [/dxy](/dxy).
3. One `## H2` per pair: `## Dollar vs <Currency> (<PAIR>): <rate>, <±%>` — the move + **one line on the stock impact** (see angle map below). ~2–4 sentences each.
4. `## The rest of the board` — one paragraph sweeping the smaller pairs (CNY, MXN, CAD).
5. `## What it means for your portfolio` — synthesis + tool CTA to [/dxy](/dxy) and [/screener](/screener).
6. `## Bottom Line` — opinionated HOLD/watch verdict.
7. Disclaimer (exact line from the manual guide).

## The stock-impact angle (what makes it rank)
Link a real `/stocks/<symbol>` page (lowercase) on first mention:
- **EUR/USD** → US multinationals with big Europe revenue: [Apple (AAPL)](/stocks/aapl), [Microsoft (MSFT)](/stocks/msft).
- **USD/BRL** → US-listed Brazilian ADRs (benefit when the real strengthens): [Vale (VALE)](/stocks/vale), [Petrobras (PBR)](/stocks/pbr), [Nubank (NU)](/stocks/nu), [Itaú (ITUB)](/stocks/itub).
- **USD/JPY** → Japanese exporters / carry-trade risk: [Toyota (TM)](/stocks/tm), [Sony (SONY)](/stocks/sony).
- **GBP/USD** → keep short; UK-exposed names optional.
- **USD/CNY / MXN / CAD** → China demand, nearshoring, commodities — link only if a real ticker fits.

Rule of thumb: a strong dollar hurts US multinationals' overseas earnings and
commodities; a weak dollar helps EM / commodity-linked names. Say which side of
that each move lands on.

## Step 4 — insert (Supabase)
Use `execute_sql` on project `ogbramvzqmbkizspeccg`, dollar-quote the text
fields (`$q$ … $q$`) so apostrophes/`$` don't break the SQL, `published_at =
now()`. Publishing fires the new-post push within ~35 min. Verify the post 200s
at `/blog/<slug>` and shows in `/blog` (ISR ~60s).

## Roadmap (v2)
- **Currency pages** like Investidor10's `/moedas/` — each major pair its own
  live page (mirror the `/dxy` build). Then the weekly Dollar Watch links every
  pair to its page = a real internal-linking engine. `/dxy` is the first one.
- `/dxy` v2: currency converter + comparative simulator.
