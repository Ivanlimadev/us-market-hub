import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs'

const CSP = [
  "default-src 'self'",
  // Scripts: self + inline (Next.js hydration) + Cloudflare Turnstile + Google Analytics
  // + Google AdSense (adsbygoogle.js and its ad-serving scripts). Without the
  // googlesyndication/googleadservices hosts the CSP silently blocks AdSense → 0
  // ad impressions.
  // 'unsafe-eval' removed — Next.js 15 App Router does not require it in production.
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.googletagservices.com https://adservice.google.com",
  // Styles: self + inline (Tailwind/CSS-in-JS)
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs + external logo/chart/news sources
  "img-src 'self' data: blob: https://coin-images.coingecko.com https://assets.coingecko.com https://s.yimg.com https://logo.clearbit.com https://financialmodelingprep.com https://assets.parqet.com https://cdn.snapi.dev https://images.financialmodelingprep.com https://icons.llama.fi https://icons.llamao.fi https://*.supabase.co https://lh3.googleusercontent.com https://images.pexels.com https://www.pexels.com https://*.googlesyndication.com https://*.g.doubleclick.net https://www.google.com",
  // Fonts: self only
  "font-src 'self'",
  // Frames: Cloudflare Turnstile widget + YouTube video embeds (blog posts)
  "frame-src https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
  // Connections: self + all external APIs used + Google Analytics + Sentry
  "connect-src 'self' https://*.supabase.co https://api.coingecko.com https://api.marketstack.com https://stocknewsapi.com https://api.llama.fi https://query1.finance.yahoo.com https://query2.finance.yahoo.com https://api.alternative.me wss://*.kraken.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.g.doubleclick.net https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'coin-images.coingecko.com' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
      { protocol: 'https', hostname: 'assets.parqet.com' },
      { protocol: 'https', hostname: 'logo.clearbit.com' },
      { protocol: 'https', hostname: 'cdn.snapi.dev' },
      { protocol: 'https', hostname: 's.yimg.com' },
      { protocol: 'https', hostname: 'stockmarketroi.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'X-Content-Type-Options',      value: 'nosniff' },
          { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',                value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security',        value: 'max-age=31536000; includeSubDomains' },
          { key: 'Cross-Origin-Opener-Policy',        value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy',      value: 'same-origin' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Content-Security-Policy',           value: CSP },
        ],
      },
    ]
  },
};

export default withSentryConfig(nextConfig, {
  org: 'stockmarketroi',
  project: 'javascript-nextjs',

  // Don't upload source maps (avoids needing SENTRY_AUTH_TOKEN on VPS)
  sourcemaps: { disable: true },

  // Suppress noisy build output
  silent: true,

  // Disable telemetry
  telemetry: false,
})
