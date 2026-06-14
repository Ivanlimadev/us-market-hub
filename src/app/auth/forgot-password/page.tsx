export const dynamic = 'force-dynamic'
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Loader2, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (err) setError(err.message)
    else setDone(true)

    setLoading(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <TrendingUp className="mx-auto h-10 w-10 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Reset password</h1>
          <p className="text-sm text-zinc-400">We&apos;ll send a reset link to your email.</p>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="text-sm text-zinc-300">
              If <strong>{email}</strong> is registered, you&apos;ll receive a reset link shortly.
            </p>
            <Link href="/auth/login" className="text-sm text-emerald-400 hover:text-emerald-300">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Reset Link
            </button>
            <p className="text-center text-sm text-zinc-500">
              <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300">Back to Sign In</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
