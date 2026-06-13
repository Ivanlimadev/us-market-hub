import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const SITE_URL = 'https://us-market-hub.vercel.app'

export const metadata: Metadata = {
  title: {
    default:  'Stock Market ROI — Real-Time US Stock Market Data',
    template: '%s | Stock Market ROI',
  },
  description:
    'Track US stocks, ETFs and indices in real time. Portfolio tracker, screener, dividends and market heatmap.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName:    'Stock Market ROI',
    locale:      'en_US',
    type:        'website',
    url:         SITE_URL,
    title:       'Stock Market ROI — Real-Time US Stock Market Data',
    description: 'Track US stocks, ETFs and indices in real time. Portfolio tracker, screener, dividends and market heatmap.',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Stock Market ROI — Real-Time US Stock Market Data',
    description: 'Track US stocks, ETFs and indices in real time. Portfolio tracker, screener, dividends and market heatmap.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
