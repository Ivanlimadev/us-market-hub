import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Supabase auth callback — handles both email confirmation and password
 * recovery code exchange (PKCE flow).
 *
 * Supabase sends the user here with ?code=xxx&next=/some/path after any
 * email link (confirm account, reset password, magic link). We exchange the
 * one-time code for a server-side session cookie, then redirect to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Behind a reverse proxy (nginx → localhost:3000) request.nextUrl.origin
  // returns the internal address. Reconstruct from forwarded headers instead.
  const forwardedHost  = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const host           = forwardedHost ?? request.headers.get('host') ?? 'stockmarketroi.com'
  const origin         = `${forwardedProto}://${host}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — send to an error state on the reset page.
  return NextResponse.redirect(`${origin}/auth/reset-password?error=invalid_link`)
}
