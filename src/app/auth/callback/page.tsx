'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

/**
 * Auth callback page — handles both PKCE (code) and implicit (hash) flows.
 *
 * PKCE  → Supabase appends ?code=xxx to this URL → we exchange it server-
 *          side via exchangeCodeForSession, then redirect.
 * Implicit → Supabase appends #access_token=xxx&type=recovery to this URL →
 *          the Supabase browser client detects the hash, sets the session,
 *          then we redirect.
 *
 * ?next= controls where we end up (e.g. /auth/reset-password).
 */
function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const next = searchParams.get('next') ?? '/'
    const code = searchParams.get('code')
    const supabase = createClient()

    const redirect = (path: string) => router.replace(path)

    if (code) {
      // PKCE flow — exchange the code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        redirect(error ? `/auth/reset-password?error=invalid_link` : next)
      })
      return
    }

    // Implicit flow — the browser client detects the hash automatically.
    // Listen for the session event, then redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'TOKEN_REFRESHED')) {
        subscription.unsubscribe()
        redirect(next)
      }
    })

    // Also check immediately in case the event already fired.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe()
        redirect(next)
      }
    })

    // Timeout fallback — if nothing resolved after 5s, something went wrong.
    const timeout = setTimeout(() => {
      subscription.unsubscribe()
      redirect(`/auth/reset-password?error=invalid_link`)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router, searchParams])

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm text-zinc-400">Verifying your link…</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-400" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
