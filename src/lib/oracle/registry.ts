import type { OracleAdapter } from './types'
import { insidersAdapter } from './adapters/insiders'
import { defiTvlAdapter } from './adapters/defi-tvl'
import { backtestAdapter } from './adapters/backtest'
import { calculatorAdapter } from './adapters/calculator'
import { glossaryAdapter } from './adapters/glossary'
import { analysisAdapter } from './adapters/analysis'

// The single source of truth for what the oracle can serve.
// Add an adapter here and it appears in the catalog and the gateway
// automatically — no per-consumer rewiring.
export const ADAPTERS: OracleAdapter[] = [
  insidersAdapter as OracleAdapter,
  defiTvlAdapter as OracleAdapter,
  backtestAdapter as OracleAdapter,
  calculatorAdapter as OracleAdapter,
  glossaryAdapter as OracleAdapter,
  analysisAdapter as OracleAdapter,
]

export const byKey = new Map<string, OracleAdapter>(
  ADAPTERS.map((a) => [a.key, a]),
)
