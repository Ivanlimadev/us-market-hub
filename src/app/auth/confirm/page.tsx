'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ConfirmPage() {
  const router  = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setStatus('success')
        setTimeout(() => router.push('/'), 2500)
      } else if (event === 'TOKEN_REFRESHED') {
        setStatus('success')
      }
    })
    // If already signed in via the magic link
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setStatus('success')
      else setTimeout(() => setStatus('error'), 3000)
    })
  }, [router])

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-400" />
            <p className="text-zinc-400">Confirming your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Email confirmed!</h2>
            <p className="text-sm text-zinc-400">Redirecting you to the home page…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="text-xl font-bold text-white">Confirmation failed</h2>
            <p className="text-sm text-zinc-400">The link may have expired. Try registering again.</p>
            <Link href="/auth/register" className="text-sm text-emerald-400 hover:text-emerald-300">
              Back to Register
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
