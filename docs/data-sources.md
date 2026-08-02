# Data Sources & Migration Map

Living document that maps what each external data provider currently gives us, so
we can pick a paid, complete and Terms-of-Service-safe replacement without losing
coverage. Update this whenever a data function is added or changed.

## Current providers

| Provider | Used for | Status | Notes |
|---|---|---|---|
| **Yahoo Finance** (unofficial) | Quotes, fundamentals, charts, dividends, options | Free, primary | Unofficial API. Delayed data, can rate-limit or break. Circuit breaker + retry in `yahoo-finance.ts`. Not officially licensed. |
| **Marketstack** | EOD history (US + TSX) | Paid (Basic) | No options, no intraday on Basic. Downgrades to 10k/mo on 2026-08-06. |
| **CoinGecko** | Crypto | Free tier | Separate concern. |

## Yahoo coverage map (what we would need to replace)

All in `src/lib/yahoo-finance.ts`:

| Function | Endpoint | Returns |
|---|---|---|
| `getYFSummary` | `/v10/finance/quoteSummary` | Price, fundamentals, P/E, EPS, margins, analyst targets/ratings, sector, website, description, employees |
| `getYFFinancials` | `/v10/finance/quoteSummary` | Income/balance/cashflow items |
| `getYFChart` | `/v8/finance/chart` | OHLC + adjusted close time series (any range/interval) |
| `getYFDividends` | `/v8/finance/chart?events=div` | Dividend history |
| `getYFIntraday` | `/v8/finance/chart` (intraday) | Intraday bars |
| `getYFBatchQuotes` | `/v7/finance/quote` | Batch live-ish quotes |
| `getYFDividendCalendar` | `/v7/finance/quote` (calendarEvents) | Upcoming ex-div / pay dates |
| `getYFOptions` | `/v7/finance/options` | Options chain: strikes, bid/ask, last, volume, open interest, **implied volatility**, all expirations. **No Greeks. No historical chains.** |

## Known gaps to close with a paid provider

1. **Licensing / ToS**: Yahoo is unofficial. A paid provider gives us a legal, stable feed.
2. **Real-time** (vs ~15 min delayed).
3. **Options Greeks** (delta, gamma, theta, vega) and **historical option chains**.
4. **Reliability** (no self-throttling, proper SLAs).

## Candidate paid providers to evaluate

| Provider | Strength | Rough cost | Watch out |
|---|---|---|---|
| **Polygon.io** | Stocks + options (chains, trades, Greeks, historical), one API | ~$29+/mo for options | Best all-in-one candidate to test first |
| **Tradier** | Real option chains via brokerage API | Free sandbox (delayed) / paid real-time | Brokerage account flow |
| **Alpaca** | Modern stocks + options data API | Free delayed / cheap real-time | Newer options coverage |
| **Intrinio / ORATS** | Pro fundamentals + full IV surface / Greeks | Higher | Overkill until we scale |

**Decision criteria:** must match the Yahoo coverage map above (fundamentals + charts +
dividends + quotes + options), add Greeks + historical options, be real-time, licensed,
and reliable. Start by trialing **Polygon.io** against this map.

## Options feature (current state, 2026-08)

- Route: `/stocks/[symbol]/options` (per-ticker chain) + `/api/options/[symbol]`.
- Data: `getYFOptions` (Yahoo, delayed, IV only, no Greeks).
- **`noindex,follow` for now** because the data is delayed/third-party and slated to
  change. Flip to indexable once we move to a licensed real-time provider.
- User-facing banner on the page states the data is delayed and an upgrade is coming.
