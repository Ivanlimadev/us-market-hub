// Oracle gateway — shared contracts.
//
// The gateway sits in front of every data source. Each source is an adapter
// that conforms to `OracleAdapter`; adapters register in `registry.ts`. The
// catalog is generated FROM the registry, so adding an adapter makes it appear
// in the catalog (and therefore discoverable by consumers) automatically.
//
// `license` is enforced by the gateway, not just documentation: only `green`
// data (our own compute or public-domain sources) is served externally. Yellow
// (needs a redistribution license) and red (raw vendor feed) are withheld until
// licensing is in place.

export type License = 'green' | 'yellow' | 'red'
export type Category = 'stock' | 'crypto' | 'macro' | 'derived' | 'content'
export type AdapterStatus = 'live' | 'building' | 'dormant'

export interface ParamSpec {
  name: string
  required: boolean
  type: string
}

export interface AdapterMeta {
  title: string
  category: Category
  source: string
  license: License
  status: AdapterStatus
  /** Per-call toll in USDC. 0 = free (discovery loss-leader). Starting points,
   *  not market-validated; adjust with real demand. Payment is not yet
   *  enforced — this only advertises the price in the catalog. */
  toll: number
  params: ParamSpec[]
}

export interface AdapterResult<T> {
  data: T
  /** ISO timestamp: the moment the data itself is valid for. */
  asOf: string
  /** Optional uncertainty (e.g. Pyth's confidence interval). */
  confidence?: number
}

export interface OracleAdapter<
  P = Record<string, string | undefined>,
  T = unknown,
> {
  key: string
  meta: AdapterMeta
  fetch(params: P): Promise<AdapterResult<T>>
}

export interface OracleResponse<T> {
  data: T
  meta: {
    key: string
    source: string
    license: License
    asOf: string
    fetchedAt: string
    confidence?: number
    ttl?: number
    // Ed25519 signature over the canonical payload; present when the oracle
    // signing key is configured. Lets any consumer prove authenticity.
    signature?: string
    publicKey?: string
    alg?: 'ed25519'
  }
}

export interface CatalogEntry extends AdapterMeta {
  key: string
}

/** Bad/missing params from the consumer → 400. */
export class OracleParamError extends Error {
  status = 400
}

/** Upstream source failed → propagate its status (defaults to 502). */
export class OracleFetchError extends Error {
  status: number
  constructor(message: string, status = 502) {
    super(message)
    this.status = status
  }
}
