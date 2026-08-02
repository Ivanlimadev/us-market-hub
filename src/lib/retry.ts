// Retries transient failures with exponential backoff.
// Retries on: network errors, 429, 500, 502, 503, 504.
// Does NOT retry on: 400, 401, 403, 404 (client errors - retrying won't help).

const RETRYABLE = new Set([429, 500, 502, 503, 504])

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxRetries = 3, baseDelayMs = 500 }: { maxRetries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const isRetryable =
        !(err instanceof HttpError) ||   // network/parse errors
        RETRYABLE.has(err.status)
      if (!isRetryable || attempt === maxRetries) throw err
      await delay(baseDelayMs * 2 ** attempt)
    }
  }
  throw lastErr
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
