@AGENTS.md

# Stock Market ROI — Project Context for Claude

## Project
Next.js 15 App Router, hosted on VPS (self-hosted GitHub Actions runner), PM2 process manager.  
Live site: https://stockmarketroi.com  
GitHub: https://github.com/Ivanlimadev/us-market-hub

## Owner
Ivan Lima — founder, full-stack dev, active US stock investor since 2018.  
Instagram: @ivan_lima_dev | LinkedIn: ivanlimadev | Email: contato@ivanlimadev.com  
Photo: `/public/ivan-lima.jpg`

## Deploy
```
git push origin main   # triggers GitHub Actions → VPS deploy via PM2
```
Workflow: `.github/workflows/deploy.yml`  
Pattern on VPS: `git pull → npm ci → npm run build → pm2 delete → pm2 start ecosystem.config.js → pm2 save`  
**Never** run `rm -rf .next` before build — it killed CSS in a previous incident.  
Concurrency lock: `group: deploy, cancel-in-progress: false` prevents parallel builds.

## Architecture

### Data flow
- Stocks: Yahoo Finance (quotes, fundamentals) + Marketstack (EOD history)
- Crypto: CoinGecko API
- Blog: Claude claude-sonnet-4-6 AI + Tavily news + Pexels images, stored in Supabase
- Auth/Portfolio/Watchlist: Supabase

### Key files
| File | Purpose |
|---|---|
| `src/app/stocks/[symbol]/page.tsx` | ISR (revalidate=60s) — fetches server-side via `fetchStockData()` |
| `src/lib/stock-server.ts` | Shared server-only data fetcher for stock pages (SSR/ISR) |
| `src/lib/hooks/useStockDetail.ts` | Client hook — accepts `initialData` from server for hydration |
| `src/app/blog/[slug]/page.tsx` | Blog post page with JSON-LD Article schema + Ivan Lima author card |
| `src/app/about/page.tsx` | Author page with Ivan Lima bio, photo, social links |
| `src/app/sitemap.ts` | Dynamic sitemap — static routes + all stocks + crypto + blog posts |
| `src/app/robots.ts` | robots.txt — blocks /auth/, /account, /portfolio, /watchlist, /api/ |
| `src/app/api/blog/generate/route.ts` | Blog AI generator — max 3 posts/day, 4-layer SEO prompt |
| `src/app/api/blog/rewrite/route.ts` | Bulk rewriter with same 4-layer SEO prompt |
| `.github/workflows/blog-cron.yml` | Cron: calls /api/blog/generate 3× per day (09:00, 14:00, 20:00 UTC) |

### SSR/ISR on stock pages
`page.tsx` calls `fetchStockData(symbol)` server-side and passes `initialData` to `StockDetailClient`.  
React Query on client uses `initialData` for instant render, then refetches after 55s.  
ISR revalidates the server snapshot every 60 seconds.  
This makes stock pages indexable by Google (content visible in HTML, not just client JS).

### Blog AI (4-layer SEO prompt)
1. **Data Integrity** — uses real Yahoo Finance numbers (price, P/E, EPS, market cap, YoY growth)
2. **SEO Structure** — H2/H3 headings, 1000–1400 words, primary keyword in title/intro/H2
3. **Internal CTAs** — mid-article link to `/stocks/[symbol]` + near-end link to `/screener`
4. **Strong Opinion** — BUY/HOLD/AVOID verdict + 12-month price prediction + risk scenario

### Blog cadence
Max 3 posts per day (enforced in `generate/route.ts` via Supabase count check).  
Cron fires at 09:00, 14:00, 20:00 UTC via `.github/workflows/blog-cron.yml`.  
Secret: `CRON_SECRET` GitHub Actions secret (also needed in VPS env).

## SEO Status (as of 2026-06)
- Sitemap submitted to Google Search Console: 341 pages discovered
- JSON-LD: Article + BreadcrumbList on all blog posts; WebPage + BreadcrumbList on stock pages
- Author: Ivan Lima (Person schema) on all blog posts and /about page
- Google notranslate: `translate="no"` on `<html>` + meta google=notranslate
- Twitter card metadata: set per-page on blog, stocks, crypto
- Canonical URLs: set on all dynamic pages

## Security rules (never break these)
- `.env.local` must NEVER be committed
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be client-side
- Binance API must NOT be used (geo-blocked in Brazil)
- API keys must never appear in chat

## lucide-react v0.x caveat
Version in this project does NOT export `Instagram` or `Linkedin` icons.  
Always use inline SVGs for those. Safe to import: `Mail`, `TrendingUp`, `BarChart2`, etc.  
Check before adding any new lucide icon: `grep -r "from 'lucide-react'" src/` then verify the export exists.

## Known incidents
- **CSS 404 (2025)**: `Instagram`/`Linkedin` lucide imports broke build silently → `rm -rf .next` deleted working CSS → cascade failure. Fixed by inline SVGs + removing pre-build cleanup from deploy script.
- **Google Translate bar on mobile**: Portuguese cookie banner triggered Chrome auto-translate. Fixed: English-only UI + `translate="no"` + meta notranslate.
- **PM2 race condition**: `pm2 restart` left stale in-memory `.next`. Fixed: `pm2 delete || true` then `pm2 start ecosystem.config.js`.
