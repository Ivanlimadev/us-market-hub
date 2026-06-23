'use client'
import { useQuery } from '@tanstack/react-query'

// Mirrors the app's US Macro dashboard (us_macro_page.dart): a MACRO SNAPSHOT
// scorecard + section headers + full indicator cards with value, change and
// a history chart.

interface Series {
  id: string
  label: string
  unit: string
  section: string
  direction: number // +1 = higher is good, -1 = lower is good
  value: number
  change: number
  history: number[]
}

// ── Formatters (match _fmtValue / _fmtChange) ─────────────────────────────────
function fmtValue(v: number, unit: string): string {
  switch (unit) {
    case '%':   return `${v.toFixed(2)}%`
    case 'K':   return `${v.toFixed(0)}K`
    case 'T':   return `${v.toFixed(2)}T`
    case 'M':   return `${v.toFixed(2)}M`
    case 'B':   return `$${Math.abs(v).toFixed(0)}B`
    case 'pts': return v.toFixed(1)
    case 'idx': return v.toFixed(1)
    case '$':   return `$${v.toFixed(v >= 1000 ? 0 : 2)}`
    default:    return `${v.toFixed(2)}${unit}`
  }
}
function fmtChange(c: number, unit: string): string {
  const s = c >= 0 ? '+' : ''
  switch (unit) {
    case '%':   return `${s}${c.toFixed(2)}pp`
    case 'K':   return `${s}${c.toFixed(0)}K`
    case 'T':   return `${s}${c.toFixed(3)}T`
    case 'M':   return `${s}${c.toFixed(2)}M`
    case 'B':   return `${s}$${Math.abs(c).toFixed(0)}B`
    case 'pts': return `${s}${c.toFixed(1)}`
    case 'idx': return `${s}${c.toFixed(1)}`
    case '$':   return `${c >= 0 ? '+' : '-'}$${Math.abs(c).toFixed(2)}`
    default:    return `${s}${c.toFixed(2)}`
  }
}

const SECTION_LABELS: Record<string, string> = {
  growth: 'Economic Growth', inflation: 'Inflation', labor: 'Labor Market',
  fed: 'Federal Reserve', bonds: 'Fixed Income', consumer: 'Consumer',
  markets: 'Financial Markets', commodities: 'Commodities',
  leading: 'Leading Indicators', fiscal: 'Fiscal Policy', housing: 'Housing',
}
const SECTION_ORDER = ['growth', 'inflation', 'labor', 'fed', 'bonds', 'consumer', 'housing', 'markets', 'commodities', 'leading', 'fiscal']

// ── Colors ────────────────────────────────────────────────────────────────────
const C = { emerald: '#10b981', red: '#f87171', orange: '#f59e0b', neutral: '#71717a' }

// ── Scorecard tile logic (match _MacroScorecard) ─────────────────────────────
type Regime = 'positive' | 'caution' | 'negative' | 'neutral'
type Tile = { title: string; status: string; value: string; regime: Regime }

function fedTile(i?: Series): Tile {
  if (!i) return { title: 'FED', status: '—', value: '—', regime: 'neutral' }
  const v = i.value, c = i.change
  if (v > 4.5)  return { title: 'FED', status: 'Restrictive',   value: `${v.toFixed(2)}%`, regime: 'negative' }
  if (c < -0.1) return { title: 'FED', status: 'Cutting Cycle', value: `${v.toFixed(2)}%`, regime: 'caution' }
  if (v < 2.0)  return { title: 'FED', status: 'Accommodative', value: `${v.toFixed(2)}%`, regime: 'positive' }
  return { title: 'FED', status: 'Neutral', value: `${v.toFixed(2)}%`, regime: 'caution' }
}
function growthTile(i?: Series): Tile {
  if (!i) return { title: 'GDP', status: '—', value: '—', regime: 'neutral' }
  const v = i.value
  if (v >= 2.5) return { title: 'GDP', status: 'Expansion',   value: `${v.toFixed(1)}% YoY`, regime: 'positive' }
  if (v >= 0)   return { title: 'GDP', status: 'Slowing',     value: `${v.toFixed(1)}% YoY`, regime: 'caution' }
  return { title: 'GDP', status: 'Contraction', value: `${v.toFixed(1)}% YoY`, regime: 'negative' }
}
function inflationTile(i?: Series): Tile {
  if (!i) return { title: 'PCE', status: '—', value: '—', regime: 'neutral' }
  const v = i.value, c = i.change
  if (v > 3.5) return { title: 'PCE', status: 'Elevated', value: `${v.toFixed(2)}%`, regime: 'negative' }
  if (v > 2.5) return { title: 'PCE', status: c <= 0 ? 'Falling' : 'Accelerating', value: `${v.toFixed(2)}%`, regime: c <= 0 ? 'caution' : 'negative' }
  return { title: 'PCE', status: 'In Check', value: `${v.toFixed(2)}%`, regime: 'positive' }
}
function laborTile(i?: Series): Tile {
  if (!i) return { title: 'JOBS', status: '—', value: '—', regime: 'neutral' }
  const v = i.value
  if (v < 4.0) return { title: 'JOBS', status: 'Hot',     value: `${v.toFixed(1)}%`, regime: 'positive' }
  if (v < 5.0) return { title: 'JOBS', status: 'Cooling', value: `${v.toFixed(1)}%`, regime: 'caution' }
  return { title: 'JOBS', status: 'Weak', value: `${v.toFixed(1)}%`, regime: 'negative' }
}
function curveTile(i?: Series): Tile {
  if (!i) return { title: 'CURVE', status: '—', value: '—', regime: 'neutral' }
  const v = i.value
  const vs = `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
  if (v < -0.25) return { title: 'CURVE', status: 'Inverted', value: vs, regime: 'negative' }
  if (v < 0.5)   return { title: 'CURVE', status: 'Flat',     value: vs, regime: 'caution' }
  return { title: 'CURVE', status: 'Normal', value: vs, regime: 'positive' }
}
function recessionTile(i?: Series): Tile {
  if (!i) return { title: 'RECESSION', status: '—', value: '—', regime: 'neutral' }
  const v = i.value
  if (v < 10) return { title: 'RECESSION', status: 'Low',      value: `${v.toFixed(0)}%`, regime: 'positive' }
  if (v < 30) return { title: 'RECESSION', status: 'Elevated', value: `${v.toFixed(0)}%`, regime: 'caution' }
  return { title: 'RECESSION', status: 'High', value: `${v.toFixed(0)}%`, regime: 'negative' }
}

const regimeFg = (r: Regime) => r === 'positive' ? C.emerald : r === 'negative' ? C.red : r === 'caution' ? C.orange : C.neutral
const regimeBg = (r: Regime) => r === 'neutral' ? 'rgba(255,255,255,0.04)' : `${regimeFg(r)}22`

function ScoreTile({ t }: { t: Tile }) {
  const fg = regimeFg(t.regime)
  return (
    <div className="flex-1 rounded-[10px] px-2 py-2.5" style={{ backgroundColor: regimeBg(t.regime) }}>
      <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">{t.title}</p>
      <p className="mt-0.5 text-[11px] font-bold leading-tight" style={{ color: fg }}>{t.status}</p>
      <p className="mt-0.5 text-[9px] text-zinc-500">{t.value}</p>
    </div>
  )
}

// ── History chart ────────────────────────────────────────────────────────────
function HistoryChart({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const W = 320, H = 70
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - ((v - min) / range) * (H - 6) - 3])
  const line = pts.map((p) => p.join(',')).join(' ')
  const area = `${pts[0][0]},${H} ${line} ${pts[pts.length - 1][0]},${H}`
  const gid = `g${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[70px] w-full">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function FullCard({ s }: { s: Series }) {
  const improving = s.change * s.direction > 0
  const worsening = s.change * s.direction < 0
  const color = improving ? C.emerald : worsening ? C.red : C.neutral
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-zinc-400">{s.label}</p>
          <p className="mt-0.5 text-[28px] font-extrabold leading-none text-white">{fmtValue(s.value, s.unit)}</p>
        </div>
        <span className="mb-1 flex items-center gap-1 text-[13px] font-semibold" style={{ color }}>
          {s.change === 0 ? '–' : improving ? '↑' : worsening ? '↓' : '–'} {fmtChange(s.change, s.unit)}
        </span>
      </div>
      <div className="mt-3"><HistoryChart data={s.history} color={color} /></div>
    </div>
  )
}

export function UsEconomyCards() {
  const { data, isLoading, isError } = useQuery<Series[]>({
    queryKey: ['macro-us'],
    queryFn: () => fetch('/api/macro/us').then((r) => (r.ok ? r.json() : [])),
    staleTime: 5 * 60_000,
  })

  if (isError) return null

  const all = data ?? []
  const find = (id: string) => all.find((s) => s.id === id)
  const tiles: Tile[] = [
    fedTile(find('FEDFUNDS')), growthTile(find('GDPC1')), inflationTile(find('PCEPILFE')),
    laborTile(find('UNRATE')), curveTile(find('T10Y2Y')), recessionTile(find('RECPROUSM156N')),
  ]
  const sections = SECTION_ORDER
    .map((key) => ({ key, items: all.filter((s) => s.section === key) }))
    .filter((s) => s.items.length > 0)

  const month = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })

  return (
    <div className="not-prose my-8">
      {/* Macro snapshot scorecard */}
      <div className="rounded-2xl bg-zinc-900 p-4">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-emerald-400">▣</span>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">Macro Snapshot</span>
          <span className="ml-auto text-[10px] text-zinc-500">{month}</span>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-[10px] bg-zinc-800/60" />)}
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">{tiles.slice(0, 3).map((t) => <ScoreTile key={t.title} t={t} />)}</div>
            <div className="flex gap-1.5">{tiles.slice(3).map((t) => <ScoreTile key={t.title} t={t} />)}</div>
          </div>
        )}
      </div>

      {/* Full indicator cards by section */}
      {isLoading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-900/60" />)}</div>
      ) : (
        sections.map(({ key, items }) => (
          <div key={key}>
            <p className="mb-3 mt-7 text-[11px] font-bold uppercase tracking-widest text-zinc-500">{SECTION_LABELS[key] ?? key}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((s) => <FullCard key={s.id} s={s} />)}
            </div>
          </div>
        ))
      )}
      <p className="mt-4 text-[11px] text-zinc-600">Source: FRED (Federal Reserve) · updated monthly. Colors reflect whether each move is good or bad for the economy. Informational only.</p>
    </div>
  )
}
