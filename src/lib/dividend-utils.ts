/** Adjust historical dividend amounts to their current split-equivalent per-share value.
 *  For every split that happened AFTER a dividend date, divide that dividend by the split factor.
 *  (1 old share → N new shares → each new share gets 1/N of the old dividend amount)
 */
export function splitAdjustDividends<T extends { date: string; dividend: number }>(
  divs: T[],
  splits: Array<{ date: string; split_factor: number }>
): T[] {
  if (!splits.length) return divs
  const sorted = [...splits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  return divs.map((div) => {
    const divMs = new Date(div.date).getTime()
    let factor = 1
    for (const s of sorted) {
      if (new Date(s.date).getTime() > divMs && s.split_factor > 1) {
        factor *= s.split_factor
      }
    }
    return factor > 1 ? { ...div, dividend: div.dividend / factor } : div
  })
}

/** Compute average annual DPS over the last N completed fiscal years.
 *  Excludes the current (potentially incomplete) year.
 *  Returns null if there are no dividend records.
 */
export function avgAnnualDPS(
  divs: Array<{ date: string; dividend: number }>,
  years = 5
): number | null {
  if (!divs.length) return null
  const currentYear = new Date().getFullYear()
  const map: Record<number, number> = {}
  for (const d of divs) {
    const y = new Date(d.date).getFullYear()
    if (y >= currentYear) continue // exclude partial current year
    map[y] = (map[y] ?? 0) + d.dividend
  }
  const entries = Object.entries(map)
    .map(([y, v]) => ({ year: parseInt(y), total: v }))
    .sort((a, b) => b.year - a.year)
    .slice(0, years)
  if (!entries.length) return null
  return entries.reduce((s, e) => s + e.total, 0) / entries.length
}
