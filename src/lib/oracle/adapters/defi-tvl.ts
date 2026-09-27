import { getDefiTVL, type DefiTVLData } from '@/lib/defillama'
import { OracleFetchError, type OracleAdapter } from '@/lib/oracle/types'

// crypto.tvl — aggregated DeFi TVL from DefiLlama (free/open aggregator, green).
// No params: returns the current total TVL, top protocols and top chains.
export const defiTvlAdapter: OracleAdapter<Record<string, never>, DefiTVLData> = {
  key: 'crypto.tvl',
  meta: {
    title: 'DeFi TVL (total, top protocols, top chains)',
    category: 'crypto',
    source: 'DefiLlama',
    license: 'green',
    status: 'live',
    params: [],
  },
  async fetch() {
    const r = await getDefiTVL()
    if (!r.ok) throw new OracleFetchError(r.error, r.status)
    return { data: r.data, asOf: new Date().toISOString() }
  },
}
