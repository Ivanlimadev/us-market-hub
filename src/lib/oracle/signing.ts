import {
  createPrivateKey,
  createPublicKey,
  sign as nodeSign,
  verify as nodeVerify,
  type KeyObject,
} from 'node:crypto'

// Ed25519 signing for oracle responses. Ed25519 is Solana's native curve, so an
// on-chain program can verify these signatures directly later.
//
// The private key lives in ORACLE_SIGNING_KEY (base64 of a PKCS8 DER ed25519
// key). Generate one with:
//   node -e "const c=require('crypto');const{privateKey}=c.generateKeyPairSync('ed25519');process.stdout.write(privateKey.export({format:'der',type:'pkcs8'}).toString('base64'))"
// If the env var is absent, signing is skipped (responses go out unsigned) so
// local dev keeps working — same graceful-degrade pattern as the rate limiter.

let cached: { priv: KeyObject; pubB64: string } | null | undefined

function loadKey() {
  if (cached !== undefined) return cached
  const b64 = process.env.ORACLE_SIGNING_KEY
  if (!b64) {
    cached = null
    return null
  }
  try {
    const priv = createPrivateKey({ key: Buffer.from(b64, 'base64'), format: 'der', type: 'pkcs8' })
    const jwk = createPublicKey(priv).export({ format: 'jwk' }) as { x: string }
    // Expose the raw 32-byte public key as standard base64 (Solana-friendly).
    const pubB64 = Buffer.from(jwk.x, 'base64url').toString('base64')
    cached = { priv, pubB64 }
  } catch (e) {
    console.error('[oracle] invalid ORACLE_SIGNING_KEY:', e)
    cached = null
  }
  return cached
}

/** Deterministic JSON: object keys sorted recursively, so signer and verifier
 *  produce identical bytes regardless of key order. */
export function canonicalize(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null'
  if (Array.isArray(v)) return '[' + v.map(canonicalize).join(',') + ']'
  const obj = v as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}'
}

export interface SignedPayload {
  key: string
  source: string
  license: string
  asOf: string
  fetchedAt: string
  data: unknown
}

export interface Signature {
  signature: string
  publicKey: string
  alg: 'ed25519'
}

/** Signs the canonical payload. Returns null when no key is configured. */
export function signPayload(p: SignedPayload): Signature | null {
  const k = loadKey()
  if (!k) return null
  const sig = nodeSign(null, Buffer.from(canonicalize(p)), k.priv)
  return { signature: sig.toString('base64'), publicKey: k.pubB64, alg: 'ed25519' }
}

/** Verifies a signature against the payload and a base64 raw public key. */
export function verifyPayload(p: SignedPayload, signatureB64: string, publicKeyB64: string): boolean {
  try {
    const raw = Buffer.from(publicKeyB64, 'base64')
    const pub = createPublicKey({
      key: { kty: 'OKP', crv: 'Ed25519', x: raw.toString('base64url') },
      format: 'jwk',
    })
    return nodeVerify(null, Buffer.from(canonicalize(p)), pub, Buffer.from(signatureB64, 'base64'))
  } catch {
    return false
  }
}
