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
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

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
