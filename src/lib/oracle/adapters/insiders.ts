import { getInsiderData, type InsiderData } from '@/lib/insiders'
import {
  OracleParamError,
  OracleFetchError,
  type OracleAdapter,
} from '@/lib/oracle/types'

// stock.insiders — insider (Form 4) activity from SEC EDGAR.
// EDGAR is US public domain, so this is freely redistributable (green).
export const insidersAdapter: OracleAdapter<{ symbol?: string }, InsiderData> = {
  key: 'stock.insiders',
  meta: {
    title: 'Insider transactions (SEC Form 4)',
    category: 'stock',
    source: 'SEC EDGAR',
    license: 'green',
    status: 'live',
    params: [{ name: 'symbol', required: true, type: 'string' }],
  },
  async fetch({ symbol }) {
    if (!symbol) throw new OracleParamError('symbol required')

    const r = await getInsiderData(symbol)
    if (!r.ok) throw new OracleFetchError(r.error, r.status)

    // asOf = date of the most recent transaction, else now.
    const latest = r.data.transactions[0]?.date
    const asOf = latest ? new Date(latest).toISOString() : new Date().toISOString()

    return { data: r.data, asOf }
  },
}
