import Link from 'next/link'
import { TrendingUp, Shield, FileText, Info, ExternalLink } from 'lucide-react'

const LEGAL_LINKS = [
  { href: '/about',   label: 'About Us',       icon: Info },
  { href: '/privacy', label: 'Privacy Policy',  icon: Shield },
  { href: '/terms',   label: 'Terms of Use',    icon: FileText },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-screen-xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-white">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span translate="no">Stock Market ROI</span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
              US stock market data — quotes, charts, earnings, dividends,
              portfolio tracker and market screener.
            </p>
            <p className="text-xs text-zinc-600">
              Data provided by Yahoo Finance and Marketstack.
              For informational purposes only.
            </p>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Legal &amp; Compliance</h3>
            <ul className="space-y-2">
              {LEGAL_LINKS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Disclaimer</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Stock Market ROI does not provide investment advice. All information
              is provided for educational and informational purposes only. Past
              performance does not guarantee future results. Always consult a
              qualified financial advisor before making investment decisions.
            </p>
            <p className="text-xs text-zinc-600">
              We collect minimal data and never sell it.{' '}
              <Link href="/privacy" className="text-zinc-500 underline-offset-2 hover:underline hover:text-zinc-300">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-zinc-800 pt-6 sm:flex-row">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Stock Market ROI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="mailto:contact@stockmarketroi.com"
              className="flex items-center gap-1 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
            >
              <ExternalLink className="h-3 w-3" />
              contact@stockmarketroi.com
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
