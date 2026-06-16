import { z } from 'zod'
import { NextResponse } from 'next/server'

// ── Shared schemas ────────────────────────────────────────────────────────────

export const symbolSchema = z
  .string()
  .min(1)
  .max(10)
  .regex(/^\^?[A-Z0-9.\-]+$/, 'Invalid ticker symbol')
  .transform((s) => s.toUpperCase())

export const cryptoIdSchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9][a-z0-9\-]*$/, 'Invalid CoinGecko ID')

export const periodSchema = z.enum(['1d', '1w', '1m', '3m', '6m', 'ytd', '1y', '2y', '5y', '10y', '15y'])

export const limitSchema = z.coerce.number().int().min(1).max(1000).default(365)

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .optional()

export const intervalSchema = z
  .string()
  .regex(/^(1m|5m|15m|1h|1d)$/)
  .default('5m')

export const searchSchema = z.string().min(1).max(100).optional()

// ── Helpers ───────────────────────────────────────────────────────────────────

type ParseOk<T> = { ok: true; value: T }
type ParseErr   = { ok: false; error: string }
export type ParseResult<T> = ParseOk<T> | ParseErr

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function parseSymbol(raw: string | null): ParseResult<string> {
  const result = symbolSchema.safeParse(raw?.toUpperCase())
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, error: result.error.issues[0].message }
}

export function parseCryptoId(raw: string | null): ParseResult<string> {
  const result = cryptoIdSchema.safeParse(raw)
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, error: result.error.issues[0].message }
}
