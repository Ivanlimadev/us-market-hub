import { NextResponse } from 'next/server'
import { getYFChart } from '@/lib/yahoo-finance'
import { STOCK_NAMES } from '@/lib/stock-universe'

// Quotes for the home "Canadian Markets" widget. ISR-cached: one refresh / 5 min.
export const revalidate = 300

// A liquid pool of TSX names - enough to power both the top-by-cap list and the
// day's gainers/losers. Prices are in CAD.
const POOL = [
  'RY.TO', 'TD.TO', 'SHOP.TO', 'BN.TO', 'ENB.TO', 'BMO.TO', 'CNR.TO', 'BNS.TO',
  'CP.TO', 'ATD.TO', 'TRP.TO', 'CSU.TO', 'SU.TO', 'CNQ.TO', 'BAM.TO', 'MFC.TO',
  'CM.TO', 'NA.TO', 'T.TO', 'BCE.TO', 'NTR.TO', 'WPM.TO', 'AEM.TO', 'FNV.TO',
  'GIL.TO', 'DOL.TO', 'L.TO', 'SLF.TO', 'CVE.TO', 'IMO.TO',
]

export async function GET() {
  const results = await Promise.all(
    POOL.map(async (symbol) => {
      try {
        const bars = await getYFChart(symbol, '5d', '1d')
        if (!bars.length) return null
        const price = bars[bars.length - 1].close
        const prev = bars.length >= 2 ? bars[bars.length - 2].close : price
        const changePct = prev > 0 ? ((price - prev) / prev) * 100 : 0
        if (!(price > 0)) return null
        return { symbol, name: STOCK_NAMES[symbol] ?? symbol, price, changePct }
      } catch {
        return null
      }
    }),
  )

  return NextResponse.json(results.filter(Boolean), {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
  })
}
