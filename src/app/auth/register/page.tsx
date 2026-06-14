export const dynamic = 'force-dynamic'
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PasswordStrength, isStrongPassword } from '@/components/auth/PasswordStrength'
import { TrendingUp, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName]                         = useState('')
  const [email, setEmail]                       = useState('')
  const [emailConfirm, setEmailConfirm]         = useState('')
  const [birthDate, setBirthDate]               = useState('')
  const [password, setPassword]                 = useState('')
  const [passwordConfirm, setPasswordConfirm]   = useState('')
  const [showPw, setShowPw]                     = useState(false)
  const [showPwC, setShowPwC]                   = useState(false)
  const [error, setError]                       = useState('')
  const [loading, setLoading]                   = useState(false)
  const [done, setDone]                         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (email !== emailConfirm)          { setError('Emails do not match.'); return }
    if (password !== passwordConfirm)    { setError('Passwords do not match.'); return }
    if (!isStrongPassword(password))     { setError('Password does not meet all requirements.'); return }

    const birth = new Date(birthDate)
    const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000)
    if (age < 18) { setError('You must be at least 18 years old to register.'); return }

    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, birth_date: birthDate },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-4 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Check your email</h2>
          <p className="text-sm text-zinc-400">
            We sent a confirmation link to <strong className="text-zinc-200">{email}</strong>.
            Click the link to activate your account.
          </p>
          <Link href="/auth/login" className="inline-block text-sm text-emerald-400 hover:text-emerald-300">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <TrendingUp className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-sm text-zinc-400">Join Stock Market ROI — it&apos;s free</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">Full Name</label>
            <input
              type="text"
              required
              minLength={2}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          {/* Email confirm */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">Confirm Email</label>
            <input
              type="email"
              required
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              className={`w-full rounded-lg border bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 ${
                emailConfirm && email !== emailConfirm
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : emailConfirm && email === emailConfirm
                  ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500'
                  : 'border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500'
              }`}
              placeholder="you@example.com"
            />
            {emailConfirm && email !== emailConfirm && (
              <p className="text-xs text-red-400">Emails do not match</p>
            )}
          </div>

          {/* Birth date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">Date of Birth</label>
            <input
              type="date"
              required
              max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 [color-scheme:dark]"
            />
            <p className="text-xs text-zinc-600">You must be at least 18 years old.</p>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Password confirm */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">Confirm Password</label>
            <div className="relative">
              <input
                type={showPwC ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={`w-full rounded-lg border bg-zinc-800 px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 ${
                  passwordConfirm && password !== passwordConfirm
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : passwordConfirm && password === passwordConfirm
                    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500'
                    : 'border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPwC((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPwC ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordConfirm && password !== passwordConfirm && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </button>

          <p className="text-center text-xs text-zinc-600 leading-relaxed">
            By creating an account you agree to our{' '}
            <a href="/terms" className="underline hover:text-zinc-400">Terms of Use</a> and{' '}
            <a href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</a>.
          </p>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
