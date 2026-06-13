import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: '#09090b', position: 'relative', fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Top accent bar */}
      <div style={{ width: '100%', height: 6, background: 'linear-gradient(90deg, #10b981, #059669)' }} />

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px' }}>
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 7 22 7 22 13" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 600, color: '#a1a1aa', letterSpacing: '-0.02em' }}>
            Stock Market ROI
          </span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 56, fontWeight: 800, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Real-time US Markets,
          <br />
          <span style={{ color: '#10b981' }}>Stocks & Crypto</span>
        </div>

        {/* Subtext */}
        <div style={{ fontSize: 22, color: '#71717a', marginBottom: 44 }}>
          Portfolio tracker · Screener · Heatmap · Dividends
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['Stocks', 'ETFs', 'Crypto', 'Portfolio', 'Screener'].map((t) => (
            <div key={t} style={{
              padding: '8px 18px', borderRadius: 999,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 15, fontWeight: 500, color: '#a1a1aa',
            }}>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: '18px 80px', borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 15, color: '#3f3f46' }}>us-market-hub.vercel.app</span>
        <span style={{ fontSize: 15, color: '#3f3f46' }}>Updated daily · Not financial advice</span>
      </div>
    </div>,
    { ...size },
  )
}
