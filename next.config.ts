import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // Scripts: self + inline (Next.js hydration) + Cloudflare Turnstile
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  // Styles: self + inline (Tailwind/CSS-in-JS)
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs + external logo/chart sources
  "img-src 'self' data: blob: https://coin-images.coingecko.com https://assets.coingecko.com https://s.yimg.com https://logo.clearbit.com https://financialmodelingprep.com",
  // Fonts: self only
  "font-src 'self'",
  // Frames: Cloudflare Turnstile widget only
  "frame-src https://challenges.cloudflare.com",
  // Connections: self + all external APIs used
  "connect-src 'self' https://*.supabase.co https://api.coingecko.com https://api.marketstack.com https://stocknewsapi.com https://api.llama.fi https://query1.finance.yahoo.com https://query2.finance.yahoo.com https://api.alternative.me wss://*.kraken.com wss://stream.binance.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'X-Content-Type-Options',      value: 'nosniff' },
          { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security',   value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy',     value: CSP },
        ],
      },
    ]
  },
};

export default nextConfig;
