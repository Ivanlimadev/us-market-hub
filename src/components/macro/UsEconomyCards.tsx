'use client'
import { useState } from 'react'
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

// "About this indicator" — English descriptions (the API ships PT text).
const DESCRIPTIONS: Record<string, string> = {
  FEDFUNDS: "The overnight interest rate set by the Federal Reserve. It anchors borrowing costs across the economy — mortgages, loans and savings rates all move with it.",
  UNRATE: "The share of the labor force that is jobless and actively looking for work. A core gauge of labor-market health and half of the Fed's dual mandate.",
  U6RATE: "A broader unemployment measure that also counts underemployed and discouraged workers, capturing slack the headline rate misses.",
  PAYEMS: "The net number of jobs added or lost across the economy each month (excluding farms) — the market's headline jobs report.",
  ICSA: "How many people filed new unemployment claims last week — a timely, real-time read on layoffs.",
  CIVPART: "The share of the working-age population working or looking for work. Shows how many people are participating in the labor force.",
  JTSJOL: "The number of open, unfilled jobs employers are trying to fill. High openings signal strong labor demand.",
  JTSQUR: "The rate at which workers voluntarily quit. Rising quits usually signal confidence that better jobs are available.",
  CPIAUCSL: "Consumer Price Index — how fast a typical basket of goods and services is rising year over year. The headline inflation number.",
  CPILFESL: "Core CPI strips out volatile food and energy prices to reveal the underlying inflation trend.",
  PCEPILFE: "Core PCE is the Fed's preferred inflation gauge, with a 2% target. Excludes food and energy to show persistent price pressure.",
  MICH: "What consumers expect inflation to be over the next year (University of Michigan survey). Expectations can become self-fulfilling.",
  GDPC1: "Real (inflation-adjusted) Gross Domestic Product — the broadest measure of US output. Two negative quarters is the classic recession rule of thumb.",
  INDPRO: "Total output of factories, mines and utilities — a read on the industrial side of the economy.",
  RSXFS: "Total monthly spending at retail and food-service businesses — a direct pulse on consumer demand, which drives ~70% of GDP.",
  UMCSENT: "How optimistic households feel about their finances and the economy (UMich survey). Sentiment tends to lead future spending.",
  PSAVERT: "The share of disposable income households save. Higher savings can mean caution; lower can mean confidence — or strain.",
  DGS2: "The yield on 2-year US Treasuries. Closely tracks expectations for Fed rate moves over the near term.",
  DGS10: "The 10-year Treasury yield — the benchmark 'risk-free' rate that helps price mortgages, loans and stock valuations.",
  DGS30: "The 30-year Treasury yield, reflecting long-term growth and inflation expectations.",
  T10Y2Y: "The gap between 10-year and 2-year yields. When it turns negative ('inverted'), it has preceded nearly every US recession.",
  T10YIE: "The 10-year breakeven rate — the market's expected average inflation over the next decade, from Treasury vs TIPS yields.",
  VIXCLS: "The VIX, Wall Street's 'fear gauge'. It measures expected stock-market volatility — low means calm, spikes mean stress.",
  BAMLH0A0HYM2: "The extra yield investors demand to hold risky high-yield ('junk') bonds over Treasuries. Widening spreads signal credit stress.",
  DTWEXBGS: "The trade-weighted US dollar index. A stronger dollar pressures exporters and multinationals; a weaker one supports commodities.",
  MORTGAGE30US: "The average 30-year fixed mortgage rate — a key driver of housing affordability and demand.",
  SP500: "The S&P 500 index, tracking 500 of the largest US companies — the standard benchmark for the US stock market.",
  RECPROUSM156N: "The New York Fed's model-based probability that the US economy will be in recession within 12 months.",
  PERMIT: "Building permits authorized for new housing — a leading indicator of future construction activity.",
  WALCL: "The total size of the Federal Reserve's balance sheet. Expansion (QE) adds liquidity; shrinking (QT) removes it.",
  GFDEGDQ188S: "Total federal debt as a share of GDP — a gauge of the government's fiscal position.",
  HOUST: "The number of new residential construction projects started — a key read on housing momentum.",
  CSUSHPISA: "The Case-Shiller index of US home prices, year over year — the standard measure of housing inflation.",
  HSN1F: "Sales of newly built single-family homes — a timely signal of housing demand.",
  M2SL: "M2 money-supply growth (year over year) — money circulating in the economy, which influences inflation and liquidity.",
  DCOILWTICO: "The price of WTI crude oil — a benchmark that feeds into gas prices, inflation and energy-sector earnings.",
  PCOPPUSDM: "The price of copper, nicknamed 'Dr. Copper' because its demand tracks global industrial and economic activity.",
}

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

// ── Detail data (per-indicator full history) ─────────────────────────────────
interface DetailPoint { date: string; value: number }
interface Detail { id: string; unit: string; direction: number; data: DetailPoint[] }

const RANGES: { label: string; years: number }[] = [
  { label: '1Y', years: 1 }, { label: '2Y', years: 2 }, { label: '5Y', years: 5 },
  { label: '10Y', years: 10 }, { label: 'Max', years: 999 },
]

function filterByRange(data: DetailPoint[], years: number, refTime: number): DetailPoint[] {
  if (years >= 999 || !data.length) return data
  const cutoff = refTime - years * 365.25 * 86_400_000
  const out = data.filter((p) => new Date(p.date).getTime() >= cutoff)
  return out.length >= 2 ? out : data.slice(-Math.max(2, Math.round(years * 12)))
}

function fmtAxis(v: number, unit: string): string {
  if (unit === 'K') return Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)
  if (unit === '%' || unit === 'pts' || unit === 'idx') return v.toFixed(1)
  return v.toFixed(0)
}

// SVG line+area chart with light grid, Y labels and date labels — mirrors the app chart.
function DetailChart({ points, unit, color }: { points: DetailPoint[]; unit: string; color: string }) {
  if (points.length < 2) return null
  // Downsample for performance on long ranges.
  const pts = points.length > 240
    ? points.filter((_, i) => i % Math.ceil(points.length / 240) === 0).concat(points[points.length - 1])
    : points
  const vals = pts.map((p) => p.value)
  const min = Math.min(...vals), max = Math.max(...vals)
  const spread = max - min || 1
  const W = 320, H = 150, padL = 30, padB = 16
  const innerW = W - padL, innerH = H - padB
  const x = (i: number) => padL + (i / (pts.length - 1)) * innerW
  const y = (v: number) => innerH - ((v - min) / spread) * (innerH - 6) - 3
  const line = pts.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')
  const area = `${padL},${innerH} ${line} ${x(pts.length - 1)},${innerH}`
  const gid = `mg${color.replace('#', '')}${pts.length}`
  const yTicks = [max, min + spread / 2, min]
  const yr = (d: string) => new Date(d).getFullYear()
  const xTicks = [0, Math.floor((pts.length - 1) / 2), pts.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[150px] w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="#27272a" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <text x={padL - 4} y={y(t) + 3} textAnchor="end" fontSize="8" fill="#71717a">{fmtAxis(t, unit)}</text>
        </g>
      ))}
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      {xTicks.map((i) => (
        <text key={i} x={x(i)} y={H - 3} textAnchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'} fontSize="8" fill="#71717a">{yr(pts[i].date)}</text>
      ))}
    </svg>
  )
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-[9px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-xs font-semibold" style={{ color: color ?? '#e4e4e7' }}>{value}</p>
    </div>
  )
}

function MacroIndicatorCard({ s }: { s: Series }) {
  const [range, setRange] = useState('5Y')
  const { data: detail } = useQuery<Detail>({
    queryKey: ['macro-detail', s.id],
    queryFn: () => fetch(`/api/macro/us/${s.id}`).then((r) => (r.ok ? r.json() : null)),
    staleTime: 30 * 60_000,
  })

  const improving = s.change * s.direction > 0
  const worsening = s.change * s.direction < 0
  const headColor = improving ? C.emerald : worsening ? C.red : C.neutral

  const all = detail?.data ?? []
  const refTime = all.length ? new Date(all[all.length - 1].date).getTime() : 0
  const filtered = filterByRange(all, RANGES.find((r) => r.label === range)?.years ?? 5, refTime)
  const trendColor = filtered.length >= 2
    ? ((filtered[filtered.length - 1].value - filtered[0].value) * s.direction >= 0 ? C.emerald : C.red)
    : headColor

  // Stats over the full series
  let stats: { prev: string; yoy: string; yoyColor?: string; max: string; min: string } | null = null
  if (all.length) {
    const vals = all.map((p) => p.value)
    const current = vals[vals.length - 1]
    const cutoff = refTime - 365 * 86_400_000
    const prevYear = [...all].reverse().find((p) => new Date(p.date).getTime() < cutoff)?.value
    const yoy = prevYear != null ? current - prevYear : null
    stats = {
      prev: prevYear != null ? fmtValue(prevYear, s.unit) : '—',
      yoy: yoy != null ? fmtChange(yoy, s.unit) : '—',
      yoyColor: yoy == null ? undefined : yoy * s.direction > 0 ? C.emerald : yoy * s.direction < 0 ? C.red : undefined,
      max: fmtValue(Math.max(...vals), s.unit),
      min: fmtValue(Math.min(...vals), s.unit),
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-zinc-400">{s.label}</p>
          <p className="mt-0.5 text-[28px] font-extrabold leading-none text-white">{fmtValue(s.value, s.unit)}</p>
        </div>
        <span className="mb-1 flex items-center gap-1 text-[13px] font-semibold" style={{ color: headColor }}>
          {s.change === 0 ? '–' : improving ? '↑' : worsening ? '↓' : '–'} {fmtChange(s.change, s.unit)}
        </span>
      </div>

      {/* Range chips */}
      <div className="mt-3 flex gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => setRange(r.label)}
            className={`flex-1 rounded-lg border py-1 text-[11px] transition-colors ${
              range === r.label
                ? 'border-emerald-500 bg-emerald-500 font-semibold text-white'
                : 'border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-3">
        {detail
          ? <DetailChart points={filtered} unit={s.unit} color={trendColor} />
          : <div className="h-[150px] animate-pulse rounded-lg bg-zinc-800/50" />}
      </div>

      {/* Stats row */}
      {stats && (
        <div className="mt-3 flex divide-x divide-zinc-800 border-t border-zinc-800 pt-3">
          <StatCell label="1Y ago" value={stats.prev} />
          <StatCell label="Annual" value={stats.yoy} color={stats.yoyColor} />
          <StatCell label="Max" value={stats.max} />
          <StatCell label="Min" value={stats.min} />
        </div>
      )}

      {/* About this indicator */}
      {DESCRIPTIONS[s.id] && (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">About this indicator</p>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">{DESCRIPTIONS[s.id]}</p>
        </div>
      )}
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
              {items.map((s, i) => (
                // A lone card (odd count / single-item section) spans both columns
                // so its chart fills the row instead of leaving empty space.
                <div key={s.id} className={items.length % 2 === 1 && i === items.length - 1 ? 'sm:col-span-2' : ''}>
                  <MacroIndicatorCard s={s} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      <p className="mt-4 text-[11px] text-zinc-600">Source: FRED (Federal Reserve) · updated monthly. Colors reflect whether each move is good or bad for the economy. Informational only.</p>
    </div>
  )
}
