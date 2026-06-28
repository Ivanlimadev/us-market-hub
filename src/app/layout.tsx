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
// Set NEXT_PUBLIC_ADSENSE_CLIENT (e.g. "ca-pub-7113858977365190") once the
// AdSense account is approved — the ad loader stays dormant until then.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

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
        {/* Google Consent Mode v2 — defaults must run before GA/AdSense tags.
            Honors a returning visitor's stored choice; the cookie banner updates it. */}
        <Script id="consent-default" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          var c = 'denied';
          try { if (localStorage.getItem('smroi-cookie-consent') === 'all') c = 'granted'; } catch (e) {}
          gtag('consent', 'default', {
            ad_storage: c,
            ad_user_data: c,
            ad_personalization: c,
            analytics_storage: c,
            wait_for_update: 500
          });
        `}</Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">{`
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        {ADSENSE_CLIENT && (
          <Script
            id="adsense"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
        <Providers>
          <Navbar />
          {/* bottom padding keeps content/footer clear of the floating dock (all sizes) */}
          <main className="flex-1 pb-24">{children}</main>
          <Footer />
          <BottomNav />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
