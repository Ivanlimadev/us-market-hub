'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, type ComponentType } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  User, Trash2, LogOut, LogIn, Loader2, AlertTriangle, ShieldCheck,
  Lock, Palette, Sun, Moon, LifeBuoy, FileText, Info, Tag, ChevronRight,
} from 'lucide-react'

const APP_VERSION = '0.1.0'
const SUPPORT_EMAIL = 'contato@stockmarketroi.com'

export default function AccountPage() {
  const router            = useRouter()
  const { user, loading } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting]       = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)
  const [showDelete, setShowDelete]   = useState(false)
  const [error, setError]             = useState('')

  // Change-password (inline)
  const [showPwd, setShowPwd]   = useState(false)
  const [pwd, setPwd]           = useState('')
  const [pwd2, setPwd2]         = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg]     = useState('')

  const supabase = createClient()

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/')
  }

  async function handleChangePassword() {
    if (pwd.length < 6 || pwd !== pwd2) return
    setPwdSaving(true)
    setPwdMsg('')
    const { error } = await supabase.auth.updateUser({ password: pwd })
    setPwdSaving(false)
    if (error) { setPwdMsg('Could not update password.'); return }
    setPwd(''); setPwd2(''); setShowPwd(false)
    setPwdMsg('Password updated.')
  }

  async function handleDeleteAccount() {
    if (confirmText.trim().toUpperCase() !== 'DELETE') return
    setDeleting(true)
    setError('')

    const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json() as { error?: string }
      setError(body.error ?? 'Failed to delete account.')
      setDeleting(false)
      return
    }

    await supabase.auth.signOut()
    localStorage.removeItem('us-market-portfolio')
    localStorage.removeItem('us-market-watchlist')
    router.replace('/')
  }

  function support() {
    const params = new URLSearchParams({
      subject: 'Stock Market ROI - Support',
      body: `Describe your issue here.\n\n--\nAccount: ${user?.email ?? 'guest'}\nUser ID: ${user?.id ?? '-'}\nWeb: Stock Market ROI`,
    })
    window.location.href = `mailto:${SUPPORT_EMAIL}?${params.toString()}`
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  const name     = (user?.user_metadata?.name as string | undefined) ?? user?.email ?? 'User'
  const initials = name.split(/[\s@]/)[0]?.slice(0, 2).toUpperCase() ?? 'U'
  const isDark   = resolvedTheme === 'dark'

  return (
    <div className="mx-auto max-w-screen-md px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* User strip */}
      {user ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-bold text-emerald-400">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-white">{name}</p>
              <p className="text-sm text-zinc-400">{user.email}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-lg bg-zinc-800 px-4 py-3 space-y-0.5">
              <p className="text-xs text-zinc-500">Member since</p>
              <p className="font-medium text-zinc-200">
                {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800 px-4 py-3 space-y-0.5">
              <p className="text-xs text-zinc-500">Email status</p>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <p className="font-medium text-emerald-400">Verified</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-white">Guest</p>
            <Link href="/auth/login" className="text-sm font-medium text-emerald-400 hover:underline">
              Sign in or create account
            </Link>
          </div>
        </div>
      )}

      {/* Account (signed-in only) */}
      {user && (
        <Card>
          <SectionTitle>Account</SectionTitle>
          <Row icon={Lock} label="Change password" onClick={() => setShowPwd((v) => !v)} />
          {showPwd && (
            <div className="space-y-3 px-4 pb-4">
              <input
                type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
                placeholder="New password (min. 6)"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={handleChangePassword}
                disabled={pwd.length < 6 || pwd !== pwd2 || pwdSaving}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
              >
                {pwdSaving && <Loader2 className="h-4 w-4 animate-spin" />} Update
              </button>
            </div>
          )}
          {pwdMsg && <p className="px-4 pb-3 text-xs text-emerald-400">{pwdMsg}</p>}
        </Card>
      )}

      {/* Appearance */}
      <Card>
        <SectionTitle>Appearance</SectionTitle>
        <Row
          icon={Palette}
          label="Theme"
          trailing={mounted ? (isDark ? 'Dark' : 'Light') : ''}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          rightIcon={mounted ? (isDark ? Sun : Moon) : undefined}
        />
      </Card>

      {/* Help */}
      <Card>
        <SectionTitle>Help</SectionTitle>
        <Row icon={LifeBuoy} label="Support" onClick={support} />
      </Card>

      {/* Legal */}
      <Card>
        <SectionTitle>Legal</SectionTitle>
        <Row icon={ShieldCheck} label="Privacy Policy" href="/privacy" />
        <Row icon={FileText} label="Terms of Service" href="/terms" />
      </Card>

      {/* About */}
      <Card>
        <SectionTitle>About</SectionTitle>
        <Row icon={Info} label="About Stock Market ROI" href="/about" />
        <Row icon={Tag} label="Version" trailing={APP_VERSION} chevron={false} />
      </Card>

      {/* Auth actions */}
      {user ? (
        <>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign Out
          </button>

          {/* Danger zone */}
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </h2>
            <p className="text-sm text-zinc-400">
              Deleting your account is <strong className="text-zinc-200">permanent and irreversible</strong>.
              All your data, portfolio and preferences will be deleted immediately.
            </p>
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" /> Delete my account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  Type <strong className="text-white font-mono">DELETE</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="Type DELETE to confirm"
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowDelete(false); setConfirmText('') }}
                    className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={confirmText.trim().toUpperCase() !== 'DELETE' || deleting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            <LogIn className="h-4 w-4" /> Sign In
          </Link>
          <Link
            href="/auth/register"
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Create free account
          </Link>
        </div>
      )}
    </div>
  )
}

// ── UI primitives ─────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
      {children}
    </p>
  )
}

function Row({
  icon: Icon, label, href, onClick, trailing, rightIcon: RightIcon, chevron = true,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  href?: string
  onClick?: () => void
  trailing?: string
  rightIcon?: ComponentType<{ className?: string }>
  chevron?: boolean
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-zinc-800 text-zinc-300">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex-1 text-sm font-medium text-white">{label}</span>
      {trailing && <span className="text-sm text-zinc-500">{trailing}</span>}
      {RightIcon ? <RightIcon className="h-[18px] w-[18px] text-zinc-500" />
        : chevron && (href || onClick) ? <ChevronRight className="h-[18px] w-[18px] text-zinc-500" /> : null}
    </>
  )
  const cls = 'flex w-full items-center gap-3.5 px-4 py-3 text-left hover:bg-zinc-800/60'
  if (href) return <Link href={href} className={cls}>{inner}</Link>
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>
}
