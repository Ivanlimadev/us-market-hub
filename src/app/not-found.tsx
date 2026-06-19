import Link from 'next/link'
import { TrendingUp, BarChart2, BookOpen, Calculator, Search } from 'lucide-react'

const QUICK_LINKS = [
  { href: '/stocks',      icon: TrendingUp, label: 'US Stocks'    },
  { href: '/blog',        icon: BookOpen,   label: 'Blog'          },
  { href: '/screener',    icon: Search,     label: 'Screener'      },
  { href: '/calculators', icon: Calculator, label: 'Calculators'   },
  { href: '/crypto',      icon: BarChart2,  label: 'Crypto'        },
]

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">

      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
        <span className="text-4xl font-black text-zinc-600">404</span>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-zinc-100">Page not found</h1>
      <p className="mb-8 max-w-sm text-sm text-zinc-500 leading-relaxed">
        The page you are looking for doesn&apos;t exist or was moved.
        Try searching for a stock ticker or use one of the links below.
      </p>

      <Link
        href="/"
        className="mb-8 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
      >
        Go to Home
      </Link>

      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            <Icon className="h-3.5 w-3.5 text-emerald-400" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
