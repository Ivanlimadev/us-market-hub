import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ChangeBadgeProps {
  value: number
  suffix?: string
  size?: 'sm' | 'md'
}

export function ChangeBadge({ value, suffix = '%', size = 'sm' }: ChangeBadgeProps) {
  const isUp = value > 0
  const isDown = value < 0
  const text = `${isUp ? '+' : ''}${value.toFixed(2)}${suffix}`
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus

  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5 gap-1' : 'text-sm px-2 py-1 gap-1.5'
  const colorClass = isUp
    ? 'bg-emerald-500/15 text-emerald-400'
    : isDown
    ? 'bg-red-500/15 text-red-400'
    : 'bg-zinc-800 text-zinc-400'

  return (
    <span className={`inline-flex items-center rounded font-medium ${sizeClass} ${colorClass}`}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {text}
    </span>
  )
}

export function ChangeText({
  value,
  prefix = '',
  suffix = '%',
}: {
  value: number
  prefix?: string
  suffix?: string
}) {
  const isUp = value > 0
  const isDown = value < 0
  return (
    <span
      className={
        isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-zinc-400'
      }
    >
      {prefix}
      {isUp ? '+' : ''}
      {value.toFixed(2)}
      {suffix}
    </span>
  )
}
