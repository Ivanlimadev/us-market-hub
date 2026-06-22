import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'

const GA_ID = 'G-XV8QGQ8JS9'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const SITE_URL = 'https://stockmarketroi.com'

export const metadata: Metadata = {
  other: { google: 'notranslate' },
  title: {
    default:  'Stock Market ROI — US Stock Market Data & Analysis',
    template: '%s | Stock Market ROI',
  },
  description:
    'Track US stocks, ETFs and indices. Portfolio tracker, screener, dividends and market heatmap.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName:    'Stock Market ROI',
    locale:      'en_US',
    type:        'website',
    url:         SITE_URL,
    title:       'Stock Market ROI — US Stock Market Data & Analysis',
    description: 'Track US stocks, ETFs and indices. Portfolio tracker, screener, dividends and market heatmap.',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Stock Market ROI — US Stock Market Data & Analysis',
    description: 'Track US stocks, ETFs and indices. Portfolio tracker, screener, dividends and market heatmap.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning translate="no">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        <Providers>
          <Navbar />
          {/* pb on mobile keeps content/footer clear of the floating dock */}
          <main className="flex-1 pb-24 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
