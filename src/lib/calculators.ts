// Pure financial calculators — own compute (green, freely distributable).
// Formulas mirror the UI calculators in src/app/calculators/*. The UI keeps its
// own inline copies (with chart rows); these are scalar-only versions for the
// oracle. TODO: eventually have the UI import from here to remove duplication.

export interface CompoundResult {
  finalValue: number
  totalInvested: number
  totalInterest: number
}

/** Monthly compounding of an annual rate, with an optional monthly contribution. */
export function compoundInterest(
  principal: number,
  annualRatePct: number,
  years: number,
  monthlyPmt = 0,
): CompoundResult {
  const r = Math.pow(1 + annualRatePct / 100, 1 / 12) - 1
  const n = Math.round(years * 12)
  let balance = principal
  for (let m = 1; m <= n; m++) {
    balance = r === 0 ? balance + monthlyPmt : balance * (1 + r) + monthlyPmt
  }
  const totalInvested = principal + monthlyPmt * n
  return { finalValue: balance, totalInvested, totalInterest: balance - totalInvested }
}

export interface SimpleResult {
  finalValue: number
  totalInterest: number
}

export function simpleInterest(
  principal: number,
  annualRatePct: number,
  years: number,
): SimpleResult {
  const months = Math.round(years * 12)
  const rateMonthly = annualRatePct / 12
  const totalInterest = principal * (rateMonthly / 100) * months
  return { finalValue: principal + totalInterest, totalInterest }
}

export interface RoiResult {
  roiPct: number
  multiple: number
  totalGain: number
  cagrPct: number | null
}

/** Return on investment; CAGR requires years >= ~1 month. */
export function roi(initial: number, final: number, years = 0): RoiResult {
  const totalGain = final - initial
  const roiPct = (totalGain / initial) * 100
  const multiple = final / initial
  const cagrPct = years >= 1 / 12 ? (Math.pow(final / initial, 1 / years) - 1) * 100 : null
  return { roiPct, multiple, totalGain, cagrPct }
}

export interface DcaResult {
  finalValue: number
  totalInvested: number
  totalReturn: number
  returnPct: number
  lumpSumFinal: number
}

/** Dollar-cost averaging; `perYear` = contributions/compounding periods per year (12 = monthly). */
export function dca(
  contribution: number,
  annualRatePct: number,
  years: number,
  perYear = 12,
  initialLump = 0,
): DcaResult | null {
  if (years <= 0 || annualRatePct < 0 || (contribution <= 0 && initialLump <= 0)) return null
  const r = Math.pow(1 + annualRatePct / 100, 1 / perYear) - 1
  const n = Math.round(years * perYear)
  let balance = initialLump
  for (let p = 1; p <= n; p++) {
    balance = r === 0 ? balance + contribution : balance * (1 + r) + contribution
  }
  const totalInvested = initialLump + contribution * n
  const totalReturn = balance - totalInvested
  const returnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0
  const lumpSumFinal = r === 0 ? totalInvested : totalInvested * Math.pow(1 + r, n)
  return { finalValue: balance, totalInvested, totalReturn, returnPct, lumpSumFinal }
}

export interface FirstMillionResult {
  reached: boolean
  months: number | null
  years: number | null
  extraMonths: number | null
  totalInvested: number | null
  totalInterest: number | null
}

/** How long to reach $1,000,000 with a monthly contribution (cap 600 months). */
export function firstMillionHowLong(
  principal: number,
  monthlyPmt: number,
  annualRatePct: number,
): FirstMillionResult {
  const r = Math.pow(1 + annualRatePct / 100, 1 / 12) - 1
  const MAX_MONTHS = 600
  let balance = principal
  for (let m = 1; m <= MAX_MONTHS; m++) {
    balance = r === 0 ? balance + monthlyPmt : balance * (1 + r) + monthlyPmt
    if (balance >= 1_000_000) {
      const invested = principal + monthlyPmt * m
      return {
        reached: true,
        months: m,
        years: Math.floor(m / 12),
        extraMonths: m % 12,
        totalInvested: invested,
        totalInterest: balance - invested,
      }
    }
  }
  return { reached: false, months: null, years: null, extraMonths: null, totalInvested: null, totalInterest: null }
}
