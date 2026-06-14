export const dynamic = 'force-dynamic'
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { PasswordStrength, isStrongPassword } from '@/components/auth/PasswordStrength'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')
  const [ready, setReady]           = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (!isStrongPassword(password)) { setError('Password does not meet strength requirements.'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }

    setDone(true)
    setTimeout(() => router.push('/auth/login'), 3000)
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <TrendingUp className="mx-auto h-10 w-10 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="text-sm text-zinc-400">Choose a strong password for your account.</p>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="text-sm text-zinc-300">Password updated! Redirecting to Sign In…</p>
          </div>
        ) : !ready ? (
          <div className="text-center space-y-3">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-400" />
            <p className="text-sm text-zinc-400">Validating reset link…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="New password"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">Confirm Password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Confirm new password"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
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
