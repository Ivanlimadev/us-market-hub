'use client'
import { useState } from 'react'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'

const SUBJECTS = [
  'General Question',
  'Privacy & Data Request',
  'Editorial Feedback',
  'DMCA / Copyright',
  'Bug Report',
  'Other',
]

const inputCls =
  'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

export function ContactForm() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('') // honeypot
  const [status, setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [err, setErr]         = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending'); setErr('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, company }),
      })
      if (res.ok) { setStatus('sent'); return }
      const d = await res.json().catch(() => ({})) as { error?: string }
      setErr(d.error ?? 'Something went wrong. Please try again.')
      setStatus('error')
    } catch {
      setErr('Network error. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-400" />
        <p className="mt-3 text-base font-semibold text-white">Message sent</p>
        <p className="mt-1 text-sm text-zinc-400">Thanks, {name || 'there'} - we&rsquo;ll reply to {email} within 48 hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputCls} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
        <input className={inputCls} type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
      </div>
      <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
        {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <textarea className={`${inputCls} min-h-32 resize-y`} placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} maxLength={5000} />

      {/* Honeypot (hidden from real users) */}
      <input
        type="text" tabIndex={-1} autoComplete="off" value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0" aria-hidden="true"
      />

      {status === 'error' && <p className="text-xs text-red-400">{err}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400 disabled:opacity-60"
      >
        {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      <p className="text-center text-[11px] text-zinc-600">Goes straight to contact@stockmarketroi.com · reply within 48h</p>
    </form>
  )
}
