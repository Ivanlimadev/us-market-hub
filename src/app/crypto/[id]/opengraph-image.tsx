import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const year   = new Date().getFullYear()

  // Fetch basic coin info for name + symbol
  let name   = id.charAt(0).toUpperCase() + id.slice(1)
  let symbol = id.slice(0, 4).toUpperCase()
  let image  = ''

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`,
      { next: { revalidate: 3600 } },
    )
    if (res.ok) {
      const data = await res.json() as { name: string; symbol: string; image?: { large?: string } }
      name   = data.name
      symbol = data.symbol.toUpperCase()
      image  = data.image?.large ?? ''
    }
  } catch { /* use defaults */ }

  return new ImageResponse(
    <div
      style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: '#09090b', fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Top accent bar */}
      <div style={{ width: '100%', height: 6, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />

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

        {/* Coin icon + name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 24 }}>
          {image ? (
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: '#18181b', border: '2px solid #27272a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} width={76} height={76} style={{ objectFit: 'contain' }} alt={symbol} />
            </div>
          ) : (
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 800, color: '#f59e0b',
            }}>
              {symbol.slice(0, 2)}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 68, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {symbol}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, color: '#71717a', fontWeight: 500 }}>
              <span>{name}</span>
              <span style={{ color: '#3f3f46' }}>·</span>
              <span style={{ color: '#f59e0b' }}>Crypto Analysis {year}</span>
            </div>
          </div>
        </div>

        {/* Feature badges */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {['Price Chart', 'Market Stats', 'ROI Calculator', 'Exchanges', 'Similar Coins'].map((t) => (
            <div key={t} style={{
              padding: '7px 16px', borderRadius: 999,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              fontSize: 14, fontWeight: 500, color: '#fcd34d',
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
        <span style={{ fontSize: 15, color: '#3f3f46' }}>us-market-hub.vercel.app/crypto/{id}</span>
        <span style={{ fontSize: 15, color: '#3f3f46' }}>Updated daily · Not financial advice</span>
      </div>
    </div>,
    { ...size },
  )
}
