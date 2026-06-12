'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { User, Trash2, LogOut, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function AccountPage() {
  const router        = useRouter()
  const { user, loading } = useAuth()

  const [confirmText, setConfirmText]   = useState('')
  const [deleting, setDeleting]         = useState(false)
  const [loggingOut, setLoggingOut]     = useState(false)
  const [showDelete, setShowDelete]     = useState(false)
  const [error, setError]               = useState('')

  const supabase = createClient()

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setError('')

    // Call server API to delete the user (requires service role key)
    const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json() as { error?: string }
      setError(body.error ?? 'Failed to delete account.')
      setDeleting(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const name = (user.user_metadata?.name as string | undefined) ?? 'User'
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="mx-auto max-w-screen-md px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-white">My Account</h1>

      {/* Profile card */}
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

      {/* Actions */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <User className="h-4 w-4" /> Account Actions
        </h2>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Sign Out
        </button>
      </div>

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
                disabled={confirmText !== 'DELETE' || deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-40"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
