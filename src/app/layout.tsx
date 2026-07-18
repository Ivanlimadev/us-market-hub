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
// AdSense publisher. Kept as an env override, but defaults to the real pub id
// so the AdSense loader + verification meta are present site-wide — Google must
// detect the code to review/approve the account. No ads serve until the account
// is approved (and consent granted via Consent Mode below).
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-7113858977365190'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const SITE_URL = 'https://stockmarketroi.com'

export const metadata: Metadata = {
  // apple-itunes-app → native Smart App Banner on iOS Safari (app id 6785098951)
  other: { google: 'notranslate', 'google-adsense-account': ADSENSE_CLIENT, 'apple-itunes-app': 'app-id=6785098951' },
  // Google Search Console — URL-prefix property verification (renders the
  // <meta name="google-site-verification"> tag site-wide).
  verification: { google: 'a5W-rL6VY-JoCL7rU_ZyKVnaOqPcmtX-T4xzle74T2c' },
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
          // Rest of world: analytics on by default (measurement), ads gated until consent.
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'granted',
            wait_for_update: 500
          });
          // EEA / UK / Switzerland: deny everything (incl. analytics) until explicit consent.
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500,
            region: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH']
          });
          // Returning visitor who already accepted: grant everything immediately.
          try {
            if (localStorage.getItem('smroi-cookie-consent') === 'all') {
              gtag('consent', 'update', {
                ad_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted',
                analytics_storage: 'granted'
              });
            }
          } catch (e) {}
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
