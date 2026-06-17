'use client'
export const dynamic = 'force-dynamic'
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
  const [birthMonth, setBirthMonth]             = useState('')
  const [birthDay, setBirthDay]                 = useState('')
  const [birthYear, setBirthYear]               = useState('')
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

    const m = parseInt(birthMonth, 10)
    const d = parseInt(birthDay, 10)
    const y = parseInt(birthYear, 10)
    if (!m || !d || !y || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > new Date().getFullYear()) {
      setError('Please enter a valid date of birth.'); return
    }
    const birthDateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const birth = new Date(birthDateStr)
    const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000)
    if (age < 18) { setError('You must be at least 18 years old to register.'); return }

    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, birth_date: birthDateStr },
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
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle className="h-9 w-9 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Account created!</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              We sent a confirmation link to{' '}
              <strong className="text-zinc-200">{email}</strong>.
              <br />Open your email and click the link to activate your account.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-zinc-300">Next steps:</p>
            <ol className="space-y-1.5 text-xs text-zinc-500 list-decimal list-inside">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the confirmation link in the email</li>
              <li>You&apos;ll be redirected and logged in automatically</li>
            </ol>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            Go to Sign In
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
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="block text-[10px] text-zinc-500">Month</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="MM"
                  maxLength={2}
                  value={birthMonth}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    setBirthMonth(v)
                    if (v.length === 2) document.getElementById('birth-day')?.focus()
                  }}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-center text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] text-zinc-500">Day</span>
                <input
                  id="birth-day"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="DD"
                  maxLength={2}
                  value={birthDay}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '')
                    setBirthDay(v)
                    if (v.length === 2) document.getElementById('birth-year')?.focus()
                  }}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-center text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] text-zinc-500">Year</span>
                <input
                  id="birth-year"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="YYYY"
                  maxLength={4}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-center text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
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
