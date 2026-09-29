import { NextRequest, NextResponse } from 'next/server'
import { byKey } from '@/lib/oracle/registry'
import {
  OracleParamError,
  OracleFetchError,
  type OracleResponse,
} from '@/lib/oracle/types'
import { signPayload } from '@/lib/oracle/signing'
import {
  x402Mode,
  buildRequirements,
  paymentRequired,
  verifyPayment,
  settlementHeader,
  type Settlement,
} from '@/lib/oracle/x402'
import { rateLimit, getIp } from '@/lib/rate-limit'

// GET /api/oracle/[key]?<params>
// The single door. Looks up the adapter, enforces the license gate, runs the
// fetch, and wraps the result in the standard envelope.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  if (!(await rateLimit(getIp(req), 60, 60_000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { key } = await params
  const adapter = byKey.get(key)
  if (!adapter) {
    return NextResponse.json({ error: `unknown key: ${key}` }, { status: 404 })
  }

  // License gate: only green data leaves through the public oracle. This is the
  // legal boundary enforced in code, not just documented.
  if (adapter.meta.license !== 'green') {
    return NextResponse.json(
      { error: 'not publicly distributable yet', key, license: adapter.meta.license },
      { status: 403 },
    )
  }

  // x402 payment gate. Skipped when mode is off or the adapter is free
  // (toll === 0). When on, the client must present a valid PAYMENT-SIGNATURE;
  // otherwise we answer 402 with the payment requirements.
  const mode = x402Mode()
  let settlement: Settlement | null = null
  if (mode !== 'off' && adapter.meta.toll > 0) {
    const reqs = buildRequirements(adapter, req.url)
    const paySig = req.headers.get('payment-signature') ?? ''
    if (!paySig) {
      const { body, header } = paymentRequired(reqs)
      return NextResponse.json(body, { status: 402, headers: { 'PAYMENT-REQUIRED': header } })
    }
    settlement = await verifyPayment(paySig, mode)
    if (!settlement.ok) {
      const { body, header } = paymentRequired(reqs)
      return NextResponse.json(
        { ...body, error: settlement.error ?? 'payment verification failed' },
        { status: 402, headers: { 'PAYMENT-REQUIRED': header } },
      )
    }
  }

  const query = Object.fromEntries(new URL(req.url).searchParams.entries())

  try {
    const r = await adapter.fetch(query)
    const fetchedAt = new Date().toISOString()

    const meta: OracleResponse<unknown>['meta'] = {
      key: adapter.key,
      source: adapter.meta.source,
      license: adapter.meta.license,
      asOf: r.asOf,
      fetchedAt,
      confidence: r.confidence,
    }

    // Sign the canonical payload so consumers can prove authenticity.
    const sig = signPayload({
      key: meta.key,
      source: meta.source,
      license: meta.license,
      asOf: meta.asOf,
      fetchedAt,
      data: r.data,
    })
    if (sig) {
      meta.signature = sig.signature
      meta.publicKey = sig.publicKey
      meta.alg = sig.alg
    }

    const body: OracleResponse<unknown> = { data: r.data, meta }
    const headers: Record<string, string> = {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
    }
    // Attach the settlement receipt when a payment was processed.
    if (settlement) headers['PAYMENT-RESPONSE'] = settlementHeader(settlement)
    return NextResponse.json(body, { headers })
  } catch (err) {
    if (err instanceof OracleParamError || err instanceof OracleFetchError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error(`[oracle] ${key} failed:`, err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
