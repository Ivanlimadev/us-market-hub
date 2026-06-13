import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const upper = symbol.toUpperCase()
  const year  = new Date().getFullYear()

  // Try to load company logo — fall back gracefully if unavailable
  const logoUrl = `https://assets.parqet.com/logos/symbol/${upper}?format=png`

  return new ImageResponse(
    <div
      style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: '#09090b', fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Top accent bar */}
      <div style={{ width: '100%', height: 6, background: 'linear-gradient(90deg, #10b981, #059669)' }} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px' }}>

        {/* Site brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16 7 22 7 22 13" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#52525b' }}>Stock Market ROI</span>
        </div>

        {/* Logo + symbol row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: '#18181b', border: '2px solid #27272a',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} width={68} height={68} style={{ objectFit: 'contain' }} alt={upper} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {upper}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 18, color: '#71717a', fontWeight: 500,
            }}>
              <span>Stock Analysis {year}</span>
              <span style={{ color: '#3f3f46' }}>·</span>
              <span style={{ color: '#10b981' }}>NYSE / NASDAQ</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {['Bull & Bear Case', 'Fair Value', 'Fundamentals', 'Dividend History', 'Earnings'].map((t) => (
            <div key={t} style={{
              padding: '7px 16px', borderRadius: 999,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              fontSize: 14, fontWeight: 500, color: '#6ee7b7',
            }}>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div style={{
        padding: '18px 80px', borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 15, color: '#3f3f46' }}>us-market-hub.vercel.app/stocks/{upper}</span>
        <span style={{ fontSize: 15, color: '#3f3f46' }}>Updated daily · Not financial advice</span>
      </div>
    </div>,
    { ...size },
  )
}
