'use client'

export function EarningsTimeBadge({
  earningsTimestamp,
  earningsTimestampEnd,
}: {
  earningsTimestamp: number | null
  earningsTimestampEnd?: number | null
}) {
  if (!earningsTimestamp || !Number.isFinite(earningsTimestamp)) return null

  const now = Date.now() / 1000
  if (earningsTimestamp < now) return null

  const daysUntil = Math.floor((earningsTimestamp - now) / 86400)
  const hoursUntil = Math.floor(((earningsTimestamp - now) % 86400) / 3600)

  let label = ''
  let bgColor = 'bg-emerald-900/40'
  let borderColor = 'border-emerald-700/50'
  let textColor = 'text-emerald-300'

  if (daysUntil === 0) {
    label = `Earnings Today${hoursUntil > 0 ? ` (${hoursUntil}h)` : ''}`
    bgColor = 'bg-red-900/40'
    borderColor = 'border-red-700/50'
    textColor = 'text-red-300'
  } else if (daysUntil === 1) {
    label = `Earnings Tomorrow`
    bgColor = 'bg-amber-900/40'
    borderColor = 'border-amber-700/50'
    textColor = 'text-amber-300'
  } else if (daysUntil < 7) {
    label = `Earnings in ${daysUntil} days`
    bgColor = 'bg-amber-900/40'
    borderColor = 'border-amber-700/50'
    textColor = 'text-amber-300'
  } else if (daysUntil < 30) {
    label = `Earnings in ${daysUntil} days`
    bgColor = 'bg-blue-900/40'
    borderColor = 'border-blue-700/50'
    textColor = 'text-blue-300'
  } else {
    return null
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${bgColor} ${borderColor} ${textColor}`}>
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{label}</span>
    </div>
  )
}
