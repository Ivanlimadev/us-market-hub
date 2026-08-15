# API Reference

Backend API for **Stock Market ROI** (`stockmarketroi.com/api`). Next.js App Router
route handlers under `src/app/api/`. Consumed by the website and by the Flutter app
(`stock_market_roi_app`).

## How data flows

- **Market/crypto/news routes** proxy external providers (below) and cache/normalize
  the response. Provider keys live in env (`process.env.*`); calls go through helpers
  in `src/lib/` (`marketstack.ts`, `yahoo-finance.ts`, `coingecko.ts`, …).
- **User-data routes** read/write **Supabase** directly and require an authenticated
  session (RLS scopes rows to the user).
- **AI routes** call **Anthropic/Claude** and cache the result in Supabase.

## Data providers

| Provider | Env key | Used by |
|---|---|---|
| **Yahoo Finance** (`src/lib/yahoo-finance.ts`) | — (unofficial) | **10 routes**: screener, market, batch-quotes, trending, stock-history, calendar/earnings, calendar/dividends, stocks/[symbol]/financials, stocks/[symbol]/history, stocks/[symbol] (hybrid) |
| **Marketstack** (`src/lib/marketstack.ts`) | `MARKETSTACK_API_KEY` | **5 routes**: quotes, history, intraday, tickers, dividends, stocks/[symbol] (hybrid) |
| **CoinGecko** (`src/lib/coingecko.ts`) | — | all `crypto/*` except funding/longshort/fear-greed |
| **OKX** | — | crypto/funding, crypto/longshort |
| **alternative.me** | — | crypto/fear-greed |
| **DeFiLlama** (`api.llama.fi`) | — | defi/tvl |
| **FRED** (St. Louis Fed) | `FRED_API_KEY` | macro/us, macro/us/[id] |
| **SEC EDGAR** (sec.gov) | — | stocks/edgar, stocks/filings, stocks/insiders |
| **Stock News API** | `STOCKNEWS_API_KEY` | news/market, stocks/news, blog generation |
| **Tavily** (web search) | `TAVILY_API_KEY` | blog/generate, blog/rewrite |
| **Pexels** (images) | `PEXELS_API_KEY` | blog/generate, blog/rewrite, blog/update-images |
| **Anthropic / Claude** | `ANTHROPIC_API_KEY` | stocks/[symbol]/insight, crypto/[id]/insight, blog/generate, blog/rewrite |
| **Cloudflare Turnstile** | `TURNSTILE_SECRET_KEY` | auth/verify-turnstile |
| **Resend** | `RESEND_API_KEY` | contact |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | all user-data + blog CRUD |

> ⚠️ **Stock data is split Yahoo + Marketstack and overlaps.** Yahoo (unofficial,
> no license) powers more core routes than the paid Marketstack plan. Consolidating
> the stock routes onto Marketstack would reduce ToS/reliability risk and actually
> use the plan you pay for. (Edge functions in the Supabase project were already
> migrated off Yahoo onto this API.)

---

## Stocks & market

| Route | Methods | Source | Purpose |
|---|---|---|---|
| `market` | GET | Yahoo | Index summary (Dow, Nasdaq, Russell, VIX) for the home cards |
| `screener` | GET | Yahoo + stock-universe | Full stock list with price + fundamentals |
| `quotes` | GET | Marketstack | Quote(s) by symbol |
| `batch-quotes` | GET | Yahoo | Many quotes in one call |
| `tickers` | GET | Marketstack | Ticker search / universe |
| `history` | GET | Marketstack | EOD price history |
| `stock-history` | GET | Yahoo | Price history (alternate) |
| `intraday` | GET | Marketstack | Intraday bars |
| `dividends` | GET | Marketstack | Dividend data |
| `trending` | GET | **Yahoo** | Top movers (gainers/losers/active) |
| `stocks/[symbol]` | GET | Marketstack + Yahoo | Stock detail (price, info, dividends) |
| `stocks/[symbol]/financials` | GET | Yahoo | Revenue / net income / margins |
| `stocks/[symbol]/history` | GET | Yahoo | Price history for a symbol |
| `stocks/[symbol]/intraday` | GET | Marketstack | Intraday for a symbol |
| `stocks/[symbol]/insight` | GET | Claude + Supabase | AI analysis (cached) |
| `stocks/edgar` | GET | SEC EDGAR | Company filings index |
| `stocks/filings` | GET | SEC EDGAR | Recent SEC filings |
| `stocks/insiders` | GET | SEC EDGAR | Insider (Form 4) trades |
| `stocks/news` | GET | Stock News API | News for a symbol |
| `calendar/earnings` | GET | Yahoo | Upcoming earnings |
| `calendar/dividends` | GET | Yahoo | Upcoming ex-dividend dates |

## Crypto

| Route | Methods | Source | Purpose |
|---|---|---|---|
| `crypto/markets` | GET | CoinGecko | Coin list with prices |
| `crypto/global` | GET | CoinGecko | Global market cap / dominance |
| `crypto/trending` | GET | CoinGecko | Trending coins |
| `crypto/[id]` | GET | CoinGecko | Coin detail |
| `crypto/[id]/history` | GET | CoinGecko | Price history |
| `crypto/[id]/tickers` | GET | CoinGecko | Exchange tickers |
| `crypto/[id]/insight` | GET | Claude + Supabase | AI analysis (cached) |
| `crypto/funding` | GET | OKX | Perp funding rates |
| `crypto/longshort` | GET | OKX | Long/short ratio |
| `crypto/fear-greed` | GET | alternative.me | Fear & Greed index |

## Macro, DeFi, news

| Route | Methods | Source | Purpose |
|---|---|---|---|
| `macro/us` | GET | FRED (+Supabase cache) | US macro indicators |
| `macro/us/[id]` | GET | FRED | A single indicator series |
| `defi/tvl` | GET | DeFiLlama | Total value locked / protocols |
| `news/market` | GET | Stock News API | General market news |

## Blog (content robot)

| Route | Methods | Source | Purpose |
|---|---|---|---|
| `blog/latest` | GET | Supabase | Published posts |
| `blog/by-ticker` | GET | Supabase | Posts tagged with a ticker |
| `blog/generate` | POST | Tavily + Stock News + Pexels + Claude → Supabase | Generate a new post |
| `blog/rewrite` | POST | Tavily + Pexels + Claude → Supabase | Rewrite/refresh a post |
| `blog/publish` | PATCH | Supabase | Flip a post to published |
| `blog/update-images` | GET | Pexels + Supabase | Backfill post images |

## User data (Supabase, auth required)

| Route | Methods | Purpose |
|---|---|---|
| `alerts`, `alerts/[id]` | GET/POST, DELETE/PATCH | Price alerts CRUD |
| `alerts/notify` | POST | Trigger alert notification |
| `portfolio/transactions`, `…/[id]` | GET/POST, PATCH/DELETE | Portfolio transactions |
| `watchlist`, `watchlist/[id]` | GET/POST, DELETE | Watchlist |
| `finance/accounts` `…/budgets` `…/categories` `…/goals` `…/recurring` `…/transactions` (+ `/[id]`) | GET/POST, PATCH/DELETE | Personal finance manager |

## Auth & misc

| Route | Methods | Source | Purpose |
|---|---|---|---|
| `auth/verify-turnstile` | POST | Cloudflare Turnstile | Captcha verification |
| `auth/delete-account` | DELETE | Supabase | Account + data deletion |
| `contact` | POST | Resend | Contact form email |

---

*Generated by reading the route handlers; regenerate when routes/providers change.*
