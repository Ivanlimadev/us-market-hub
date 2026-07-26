// Dollar Watch — weekly FX data fetcher.
// Prints the DXY and the major USD pairs with their ~1-week change, plus a
// quick "firm vs / soft vs" summary to speed up writing the weekly recap post.
//
// Usage:  node scripts/dollar-watch-data.mjs
//
// Data source: Yahoo Finance public chart API (FX symbols use `=X`, and the
// dollar index is DX-Y.NYB). Note the site's own /api/stocks endpoint rejects
// symbols containing `=`, so this script hits Yahoo directly.

const H = { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }

const DXY = 'DX-Y.NYB'
const PAIRS = [
  ['EUR/USD', 'EURUSD=X', 'euro'],
  ['USD/BRL', 'USDBRL=X', 'Brazilian real'],
  ['USD/JPY', 'USDJPY=X', 'Japanese yen'],
  ['GBP/USD', 'GBPUSD=X', 'British pound'],
  ['USD/CNY', 'USDCNY=X', 'Chinese yuan'],
  ['USD/MXN', 'USDMXN=X', 'Mexican peso'],
  ['USD/CAD', 'USDCAD=X', 'Canadian dollar'],
]

async function series(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1y`
  const j = await fetch(url, { headers: H }).then((r) => r.json())
  const q = j.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
  return q.filter((x) => x != null)
}

function pct(a, b) {
  return ((a / b - 1) * 100)
}

// USD-strength direction: for pairs quoted as USD/XXX (more XXX per USD), a rise
// means a STRONGER dollar. For XXX/USD (EUR/USD, GBP/USD), a rise means a WEAKER
// dollar. Returns +1 if the move means a stronger USD, else -1.
function usdDir(name, wkChg) {
  const usdIsBase = name.startsWith('USD/')
  const strongerUsd = usdIsBase ? wkChg > 0 : wkChg < 0
  return strongerUsd
}

const dxy = await series(DXY)
const dNow = dxy[dxy.length - 1]
const dWk = dxy[dxy.length - 6]
const dYr = dxy[0]
console.log(`\nDXY (US Dollar Index): ${dNow.toFixed(2)}  |  week ${pct(dNow, dWk) >= 0 ? '+' : ''}${pct(dNow, dWk).toFixed(2)}%  |  12M ${pct(dNow, dYr) >= 0 ? '+' : ''}${pct(dNow, dYr).toFixed(1)}%`)
console.log('\nPair       Rate        Week      USD this week')
console.log('-------------------------------------------------')
const firm = [], soft = []
for (const [name, sym, cur] of PAIRS) {
  const s = await series(sym)
  if (s.length < 6) { console.log(`${name.padEnd(10)} (no data)`); continue }
  const now = s[s.length - 1], wk = s[s.length - 6]
  const chg = pct(now, wk)
  const stronger = usdDir(name, chg)
  ;(stronger ? firm : soft).push(cur)
  console.log(`${name.padEnd(10)} ${now.toFixed(4).padStart(9)}  ${(chg >= 0 ? '+' : '') + chg.toFixed(2) + '%'}`.padEnd(38) + (stronger ? 'STRONGER' : 'weaker'))
}
console.log('\nHeadline: dollar FIRM vs ' + firm.join(', ') + '  |  SOFT vs ' + (soft.length ? soft.join(', ') : '(none)'))
console.log('Today for slug/title: ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '\n')
