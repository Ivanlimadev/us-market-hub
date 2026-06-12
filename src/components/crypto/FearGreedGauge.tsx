'use client'
import { useQuery } from '@tanstack/react-query'
import type { FearGreedPoint } from '@/app/api/crypto/fear-greed/route'

function gaugeColor(v: number) {
  if (v <= 24) return { bg: 'bg-red-700',          text: 'text-red-300',          hex: '#b91c1c' }
  if (v <= 44) return { bg: 'bg-orange-600',        text: 'text-orange-300',       hex: '#ea580c' }
  if (v <= 54) return { bg: 'bg-yellow-500',        text: 'text-yellow-200',       hex: '#eab308' }
  if (v <= 74) return { bg: 'bg-emerald-600',       text: 'text-emerald-300',      hex: '#059669' }
  return              { bg: 'bg-emerald-400',        text: 'text-emerald-100',      hex: '#34d399' }
}

// SVG semicircle gauge
function Gauge({ value }: { value: number }) {
  const R = 70
  const cx = 90
  const cy = 90
  const startAngle = Math.PI
  const endAngle   = 2 * Math.PI
  const angle      = startAngle + (value / 100) * Math.PI

  const toXY = (a: number) => ({
    x: cx + R * Math.cos(a),
    y: cy + R * Math.sin(a),
  })

  const trackStart = toXY(startAngle)
  const trackEnd   = toXY(endAngle)
  const needleEnd  = toXY(angle)

  const zones = [
    { label: 'Extreme Fear', from: 0,  to: 25,  color: '#b91c1c' },
    { label: 'Fear',         from: 25, to: 45,  color: '#ea580c' },
    { label: 'Neutral',      from: 45, to: 55,  color: '#eab308' },
    { label: 'Greed',        from: 55, to: 75,  color: '#059669' },
    { label: 'Extreme Greed',from: 75, to: 100, color: '#34d399' },
  ]

  return (
    <svg viewBox="0 0 180 100" className="w-full max-w-[220px]">
      {/* Zone arcs */}
      {zones.map((z) => {
        const a1 = startAngle + (z.from / 100) * Math.PI
        const a2 = startAngle + (z.to   / 100) * Math.PI
        const p1 = toXY(a1); const p2 = toXY(a2)
        const large = (z.to - z.from) > 50 ? 1 : 0
        return (
          <path
            key={z.label}
            d={`M ${cx} ${cy} L ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y} Z`}
            fill={z.color}
            opacity={0.25}
          />
        )
      })}
      {/* Track ring */}
      <path
        d={`M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
        fill="none" stroke="#3f3f46" strokeWidth={8}
      />
      {/* Progress arc */}
      <path
        d={`M ${trackStart.x} ${trackStart.y} A ${R} ${R} 0 0 1 ${needleEnd.x} ${needleEnd.y}`}
        fill="none" stroke={gaugeColor(value).hex} strokeWidth={8} strokeLinecap="round"
      />
      {/* Needle dot */}
      <circle cx={needleEnd.x} cy={needleEnd.y} r={5} fill={gaugeColor(value).hex} />
      {/* Center cover */}
      <circle cx={cx} cy={cy} r={28} fill="#18181b" />
      {/* Value text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={20} fontWeight="bold">{value}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="#a1a1aa" fontSize={7}>/ 100</text>
    </svg>
  )
}

export function FearGreedGauge() {
  const { data, isLoading } = useQuery<FearGreedPoint[]>({
    queryKey: ['fear-greed'],
    queryFn:  () => fetch('/api/crypto/fear-greed').then((r) => r.json()),
    staleTime: 60 * 60_000,
    refetchInterval: 60 * 60_000,
  })

  const today     = data?.[0]
  const yesterday = data?.[1]
  const lastWeek  = data?.[6]
  const lastMonth = data?.[29]

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 animate-pulse">
        <div className="h-5 w-40 rounded bg-zinc-800 mb-4" />
        <div className="h-32 rounded bg-zinc-800" />
      </div>
    )
  }

  if (!today) return null

  const { bg, text } = gaugeColor(today.value)

  const history = [
    { label: 'Yesterday',  point: yesterday },
    { label: 'Last week',  point: lastWeek  },
    { label: 'Last month', point: lastMonth },
  ]

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="text-sm font-semibold text-zinc-200 mb-4">Fear &amp; Greed Index</h2>

      <div className="flex flex-col items-center gap-2">
        <Gauge value={today.value} />

        <div className={`rounded-full px-3 py-1 text-xs font-bold ${bg} ${text}`}>
          {today.classification}
        </div>

        <p className="text-[11px] text-zinc-500">
          {new Date(today.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* History row */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3">
        {history.map(({ label, point }) => point && (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-zinc-600">{label}</span>
            <span className={`text-sm font-bold ${gaugeColor(point.value).text}`}>{point.value}</span>
            <span className="text-[9px] text-zinc-500 text-center leading-tight">{point.classification}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
