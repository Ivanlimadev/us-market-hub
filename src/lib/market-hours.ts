// US Eastern Time market hours: Mon-Fri 09:30-16:00 ET

export function isMarketOpen(): boolean {
  const now = new Date()
  // Convert to ET (UTC-4 in summer / UTC-5 in winter)
  const etOffset = getETOffsetMinutes(now)
  const etMs = now.getTime() + etOffset * 60 * 1000
  const et = new Date(etMs)

  const day = et.getUTCDay() // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false

  const hours = et.getUTCHours()
  const minutes = et.getUTCMinutes()
  const totalMinutes = hours * 60 + minutes

  return totalMinutes >= 9 * 60 + 30 && totalMinutes < 16 * 60
}

// Returns the poll interval in ms based on market state
export function getPollInterval(): number {
  return isMarketOpen() ? 30_000 : 5 * 60_000
}

// Rough EDT/EST detection (DST: 2nd Sun Mar → 1st Sun Nov)
function getETOffsetMinutes(date: Date): number {
  const year = date.getUTCFullYear()
  const dstStart = getNthSundayOfMonth(year, 2, 2) // 2nd Sunday of March
  const dstEnd = getNthSundayOfMonth(year, 10, 1)  // 1st Sunday of November
  return date >= dstStart && date < dstEnd ? -4 * 60 : -5 * 60
}

function getNthSundayOfMonth(year: number, month: number, n: number): Date {
  const d = new Date(Date.UTC(year, month - 1, 1))
  let sundays = 0
  while (d.getUTCMonth() === month - 1) {
    if (d.getUTCDay() === 0) {
      sundays++
      if (sundays === n) return d
    }
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return d
}

export function formatMarketStatus(): string {
  return isMarketOpen() ? 'Market Open' : 'Market Closed'
}
