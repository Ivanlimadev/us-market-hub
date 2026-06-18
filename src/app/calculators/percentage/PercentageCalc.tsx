'use client'
import { useState } from 'react'
import Link from 'next/link'

type TabId = 'percent-of' | 'what-percent' | 'increase' | 'decrease'

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: 'percent-of',  label: 'X% of Y',         short: '% of' },
  { id: 'what-percent',label: 'X is what % of Y', short: '% ratio' },
  { id: 'increase',    label: '% increase',       short: '↑ Gain' },
  { id: 'decrease',    label: '% decrease',       short: '↓ Loss' },
]

const fmt = (n: number) => {
  if (!isFinite(n) || isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (abs >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
  return n.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      <input
        type="number" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '0'}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none transition-colors"
      />
    </div>
  )
}

function ResultBox({ label, value, unit = '' }: { label: string; value: string; unit?: string }) {
  return (
    <div className="mt-6 rounded-xl border border-violet-500/25 bg-violet-500/5 p-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">{label}</p>
      <p className="text-4xl font-bold text-violet-300">
        {value}
        {unit && <span className="ml-1 text-xl text-zinc-400">{unit}</span>}
      </p>
    </div>
  )
}

function TabPercentOf() {
  const [x, setX] = useState('')
  const [y, setY] = useState('')
  const xn = parseFloat(x), yn = parseFloat(y)
  const res = isFinite(xn) && isFinite(yn) ? (yn * xn) / 100 : null

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Percentage (X)" value={x} onChange={setX} placeholder="e.g. 15" />
        <Field label="Value (Y)" value={y} onChange={setY} placeholder="e.g. 200" />
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        What is <strong className="text-zinc-300">{x || 'X'}%</strong> of <strong className="text-zinc-300">{y || 'Y'}</strong>?
      </p>
      {res !== null && <ResultBox label="Result" value={fmt(res)} />}
    </div>
  )
}

function TabWhatPercent() {
  const [x, setX] = useState('')
  const [y, setY] = useState('')
  const xn = parseFloat(x), yn = parseFloat(y)
  const res = isFinite(xn) && isFinite(yn) && yn !== 0 ? (xn / yn) * 100 : null

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Value (X)" value={x} onChange={setX} placeholder="e.g. 30" />
        <Field label="Total (Y)" value={y} onChange={setY} placeholder="e.g. 200" />
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        <strong className="text-zinc-300">{x || 'X'}</strong> is what percentage of <strong className="text-zinc-300">{y || 'Y'}</strong>?
      </p>
      {res !== null && <ResultBox label="Percentage" value={fmt(res)} unit="%" />}
    </div>
  )
}

function TabIncrease() {
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')
  const a = parseFloat(from), b = parseFloat(to)
  const res  = isFinite(a) && isFinite(b) && a !== 0 ? ((b - a) / Math.abs(a)) * 100 : null
  const gain = res !== null ? b - a : null
  const isPos = res !== null && res >= 0

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="From (A)" value={from} onChange={setFrom} placeholder="e.g. 100" />
        <Field label="To (B)"   value={to}   onChange={setTo}   placeholder="e.g. 135" />
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        Percentage change from <strong className="text-zinc-300">{from || 'A'}</strong> to <strong className="text-zinc-300">{to || 'B'}</strong>
      </p>
      {res !== null && (
        <div className="mt-6 rounded-xl border border-violet-500/25 bg-violet-500/5 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">Change</p>
          <p className={`text-4xl font-bold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPos ? '+' : ''}{fmt(res)}<span className="ml-1 text-xl text-zinc-400">%</span>
          </p>
          {gain !== null && (
            <p className={`mt-1 text-sm ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPos ? '+' : ''}{fmt(gain)} absolute
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function TabDecrease() {
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')
  const a = parseFloat(from), b = parseFloat(to)
  const res  = isFinite(a) && isFinite(b) && a !== 0 ? ((a - b) / Math.abs(a)) * 100 : null
  const loss = res !== null ? a - b : null
  const isPos = res !== null && res >= 0

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Original (A)" value={from} onChange={setFrom} placeholder="e.g. 200" />
        <Field label="New value (B)" value={to}   onChange={setTo}   placeholder="e.g. 150" />
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        What is the percentage decrease from <strong className="text-zinc-300">{from || 'A'}</strong> to <strong className="text-zinc-300">{to || 'B'}</strong>?
      </p>
      {res !== null && (
        <div className="mt-6 rounded-xl border border-violet-500/25 bg-violet-500/5 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">Decrease</p>
          <p className={`text-4xl font-bold ${isPos ? 'text-red-400' : 'text-emerald-400'}`}>
            {fmt(Math.abs(res))}<span className="ml-1 text-xl text-zinc-400">%</span>
            {!isPos && <span className="ml-2 text-base text-emerald-400">(increase)</span>}
          </p>
          {loss !== null && (
            <p className={`mt-1 text-sm ${isPos ? 'text-red-500' : 'text-emerald-500'}`}>
              {fmt(loss)} absolute {isPos ? 'reduction' : 'gain'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function PercentageCalc() {
  const [tab, setTab] = useState<TabId>('percent-of')

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/calculators" className="hover:text-zinc-300 transition-colors">Calculators</Link>
        <span className="mx-1.5">›</span>
        <span className="text-zinc-300">Percentage Calculator</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-zinc-100">Percentage Calculator</h1>
      <p className="mb-8 max-w-xl text-zinc-400 leading-relaxed">
        Four calculation modes for the most common percentage problems in investing: finding a
        percentage of a value, calculating proportions, and measuring gains or losses.
      </p>

      {/* Tab bar */}
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-violet-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Calculator panel */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        {tab === 'percent-of'   && <TabPercentOf />}
        {tab === 'what-percent' && <TabWhatPercent />}
        {tab === 'increase'     && <TabIncrease />}
        {tab === 'decrease'     && <TabDecrease />}
      </div>

      {/* Common examples */}
      <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">Quick reference</h2>
        <div className="grid gap-3 sm:grid-cols-2 text-sm text-zinc-400">
          {[
            { q: 'What is 15% of $500?',             a: '$75.00' },
            { q: '$30 is what % of $200?',            a: '15%' },
            { q: 'Stock went from $80 → $100',        a: '+25% gain' },
            { q: 'Portfolio down from $50K → $43K',   a: '−14% loss' },
          ].map(ex => (
            <div key={ex.q} className="flex items-baseline justify-between gap-2 rounded-lg bg-zinc-800/40 px-4 py-2.5">
              <span className="text-zinc-400">{ex.q}</span>
              <span className="shrink-0 font-semibold text-violet-400">{ex.a}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-4 border-t border-zinc-800 pt-10 text-sm leading-relaxed text-zinc-400">
        <h2 className="text-base font-bold text-zinc-200">Percentage in investing</h2>
        <p>
          Percentage calculations are the foundation of investment analysis. Whether you're
          comparing a stock's daily move, calculating portfolio allocation, or measuring how
          much an ETF has gained since purchase — every answer is a percentage.
        </p>
        <p>
          The <strong className="text-zinc-300">% change</strong> formula used here is{' '}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-violet-300">
            (new − old) / |old| × 100
          </code>.
          Using the absolute value of the original prevents sign confusion when dealing with
          negative base values.
        </p>
        <p className="text-xs text-zinc-600">For educational purposes only. Not financial advice.</p>
      </section>
    </div>
  )
}
