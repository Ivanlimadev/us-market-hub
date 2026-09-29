import type { OracleAdapter } from './types'

// x402 payment layer for the oracle gateway (HTTP 402, USDC on Solana).
//
// Modes (env ORACLE_X402_MODE):
//   off  (default) — no payment required, gateway behaves as before.
//   test           — the full 402 handshake runs, but payment is NOT settled on
//                    chain: any present PAYMENT-SIGNATURE is accepted and a
//                    synthetic receipt is returned. No wallet, no money.
//   live           — real settlement via an x402 facilitator (TODO below).
//
// Free adapters (meta.toll === 0) never require payment, in any mode.

export type X402Mode = 'off' | 'test' | 'live'

export function x402Mode(): X402Mode {
  const m = (process.env.ORACLE_X402_MODE ?? 'off').toLowerCase()
  return m === 'test' || m === 'live' ? m : 'off'
}

// USDC SPL mints on Solana (6 decimals).
const USDC: Record<'solana' | 'solana-devnet', { asset: string; decimals: number }> = {
  'solana':        { asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  'solana-devnet': { asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', decimals: 6 },
}

function network(): 'solana' | 'solana-devnet' {
  const n = process.env.ORACLE_X402_NETWORK
  if (n === 'solana' || n === 'solana-devnet') return n
  // Test defaults to devnet, live to mainnet.
  return x402Mode() === 'live' ? 'solana' : 'solana-devnet'
}

export interface PaymentRequirements {
  scheme: 'exact'
  network: string
  maxAmountRequired: string // atomic units of `asset`
  resource: string
  description: string
  mimeType: string
  payTo: string
  maxTimeoutSeconds: number
  asset: string
  extra?: Record<string, unknown>
}

export function buildRequirements(adapter: OracleAdapter, resourceUrl: string): PaymentRequirements {
  const net = network()
  const usdc = USDC[net]
  const atomic = Math.round(adapter.meta.toll * 10 ** usdc.decimals)
  return {
    scheme: 'exact',
    network: net,
    maxAmountRequired: String(atomic),
    resource: resourceUrl,
    description: `Oracle: ${adapter.meta.title}`,
    mimeType: 'application/json',
    payTo: process.env.ORACLE_PAY_TO ?? 'PAYTO_NOT_CONFIGURED',
    maxTimeoutSeconds: 60,
    asset: usdc.asset,
    extra: { name: 'USD Coin', toll_usd: adapter.meta.toll },
  }
}

/** The 402 response body and the base64 PAYMENT-REQUIRED header value. */
export function paymentRequired(reqs: PaymentRequirements): { body: object; header: string } {
  const payload = { x402Version: 2, accepts: [reqs] }
  return {
    body: { ...payload, error: 'payment required' },
    header: Buffer.from(JSON.stringify(payload)).toString('base64'),
  }
}

export interface Settlement {
  ok: boolean
  txHash?: string
  error?: string
}

/**
 * Verifies the client's PAYMENT-SIGNATURE.
 * - test: accept any present payload, return a synthetic receipt (no chain, no money).
 * - live: MUST verify + settle via an x402 facilitator (Coinbase CDP or a
 *   self-hosted Solana facilitator: POST /verify then /settle, return the tx hash).
 */
export async function verifyPayment(paymentSignatureB64: string, mode: X402Mode): Promise<Settlement> {
  if (!paymentSignatureB64) return { ok: false, error: 'missing PAYMENT-SIGNATURE header' }
  if (mode === 'test') return { ok: true, txHash: 'test-mode-no-onchain-settlement' }
  // TODO(live): call the facilitator /verify and /settle and return the real tx hash.
  return { ok: false, error: 'live x402 settlement not implemented yet' }
}

/** The base64 PAYMENT-RESPONSE header value (settlement receipt). */
export function settlementHeader(s: Settlement): string {
  return Buffer.from(
    JSON.stringify({ success: s.ok, txHash: s.txHash ?? null, network: network() }),
  ).toString('base64')
}
