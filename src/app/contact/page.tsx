import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageSquare, Clock, Shield, BookOpen, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Stock Market ROI team. We respond to all inquiries within 48 hours.',
  alternates: { canonical: 'https://stockmarketroi.com/contact' },
}

const TOPICS = [
  {
    icon: MessageSquare,
    title: 'General Questions',
    desc: 'Questions about the platform, features or data.',
    subject: 'General Question — Stock Market ROI',
  },
  {
    icon: Shield,
    title: 'Privacy & Data Requests',
    desc: 'Access, correction or deletion of your personal data (LGPD / GDPR / CCPA).',
    subject: 'Data Privacy Request — Stock Market ROI',
  },
  {
    icon: BookOpen,
    title: 'Editorial Feedback',
    desc: 'Corrections, inaccuracies or feedback on a blog article.',
    subject: 'Editorial Feedback — Stock Market ROI',
  },
  {
    icon: FileText,
    title: 'DMCA / Copyright',
    desc: 'Copyright infringement notices as described in our Terms of Use.',
    subject: 'DMCA Notice — Stock Market ROI',
  },
]

export default function ContactPage() {
  const email = 'contact@stockmarketroi.com'

  return (
    <div className="mx-auto max-w-screen-md px-4 py-12 space-y-10">

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Contact Us</h1>
        <p className="text-zinc-400 leading-relaxed">
          Have a question, found an error, or need to submit a data request?
          We read every message and respond within <strong className="text-zinc-200">48 hours</strong> on business days.
        </p>
      </div>

      {/* Primary contact card */}
      <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Mail className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">Email</p>
            <p className="text-xs text-zinc-500">Primary contact channel</p>
          </div>
        </div>
        <a
          href={`mailto:${email}`}
          className="block w-full rounded-xl bg-emerald-500 py-3 text-center text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
        >
          {email}
        </a>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Response time: up to 48 hours on business days (Mon–Fri, Brazil time)</span>
        </div>
      </div>

      {/* Topic guide */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-200">What do you need help with?</h2>
        <p className="text-sm text-zinc-500">
          Use the links below to open a pre-filled email with the correct subject line,
          so we can route your message faster.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOPICS.map(({ icon: Icon, title, desc, subject }) => (
            <a
              key={title}
              href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2 transition-colors hover:border-zinc-600"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{title}</p>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Founder card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <img
          src="/ivan-lima.jpg"
          alt="Ivan Lima"
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-full object-cover border-2 border-emerald-500/40"
        />
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-sm font-semibold text-zinc-200">Ivan Lima</p>
          <p className="text-xs text-emerald-400">Founder · Stock Market ROI</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Systems Analysis &amp; Development student and active US stock market investor since 2018.
            Every message goes directly to me — there is no support team.
          </p>
        </div>
      </div>

      {/* Legal note */}
      <p className="text-xs text-zinc-600 leading-relaxed">
        For data privacy requests, please include your email address and the specific right you wish to
        exercise (access, deletion, correction, portability). We will respond within the timeframes
        required by{' '}
        <Link href="/privacy#lgpd" className="underline underline-offset-2 hover:text-zinc-400">LGPD (15 business days)</Link>
        {' '}and{' '}
        <Link href="/privacy#gdpr" className="underline underline-offset-2 hover:text-zinc-400">GDPR (30 days)</Link>.
        See our full <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-400">Privacy Policy</Link>.
      </p>
    </div>
  )
}
