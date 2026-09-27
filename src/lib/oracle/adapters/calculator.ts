import {
  compoundInterest,
  simpleInterest,
  roi,
  dca,
  firstMillionHowLong,
} from '@/lib/calculators'
import { OracleParamError, type OracleAdapter } from '@/lib/oracle/types'

// compute.calculator — pure financial math (green). One adapter dispatches by
// `type`; params depend on the type (see meta).
type CalcParams = Record<string, string | undefined> & { type?: string }

function req(p: CalcParams, name: string): number {
  const v = p[name]
  const n = v == null ? NaN : Number(v)
  if (!Number.isFinite(n)) throw new OracleParamError(`${name} required (number)`)
  return n
}
function opt(p: CalcParams, name: string, dflt: number): number {
  const v = p[name]
  if (v == null || v === '') return dflt
  const n = Number(v)
  return Number.isFinite(n) ? n : dflt
}

export const calculatorAdapter: OracleAdapter<CalcParams, unknown> = {
  key: 'compute.calculator',
  meta: {
    title: 'Financial calculators (compound, simple, roi, dca, firstMillion)',
    category: 'derived',
    source: 'compute:calculators',
    license: 'green',
    status: 'live',
    params: [
      { name: 'type', required: true, type: 'compound|simple|roi|dca|firstMillion' },
      { name: 'principal', required: false, type: 'number (compound/simple/firstMillion)' },
      { name: 'annualRate', required: false, type: 'number %' },
      { name: 'years', required: false, type: 'number' },
      { name: 'monthly', required: false, type: 'number (compound/firstMillion)' },
      { name: 'initial', required: false, type: 'number (roi)' },
      { name: 'final', required: false, type: 'number (roi)' },
      { name: 'contribution', required: false, type: 'number (dca)' },
      { name: 'perYear', required: false, type: 'number (dca, default 12)' },
      { name: 'initialLump', required: false, type: 'number (dca)' },
    ],
  },
  async fetch(p) {
    const type = p.type
    let data: unknown

    switch (type) {
      case 'compound':
        data = compoundInterest(req(p, 'principal'), req(p, 'annualRate'), req(p, 'years'), opt(p, 'monthly', 0))
        break
      case 'simple':
        data = simpleInterest(req(p, 'principal'), req(p, 'annualRate'), req(p, 'years'))
        break
      case 'roi':
        data = roi(req(p, 'initial'), req(p, 'final'), opt(p, 'years', 0))
        break
      case 'dca': {
        const r = dca(req(p, 'contribution'), req(p, 'annualRate'), req(p, 'years'), opt(p, 'perYear', 12), opt(p, 'initialLump', 0))
        if (!r) throw new OracleParamError('invalid dca params')
        data = r
        break
      }
      case 'firstMillion':
        data = firstMillionHowLong(req(p, 'principal'), req(p, 'monthly'), req(p, 'annualRate'))
        break
      default:
        throw new OracleParamError('type required: compound|simple|roi|dca|firstMillion')
    }

    return { data, asOf: new Date().toISOString() }
  },
}
