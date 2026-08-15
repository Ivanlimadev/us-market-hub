// Server-side logging utility for tracking page views and API calls
// Logs go to PM2 stdout/stderr (accessible via: pm2 logs us-market-hub)

import { headers } from 'next/headers'

interface LogEntry {
  timestamp: string
  method: string
  path: string
  ip: string
  userAgent: string
  referrer: string | null
  status?: number
}

function anonymizeIp(ip: string): string {
  // Zero out last octet for privacy (GDPR compliant)
  return ip.replace(/\.\d+$/, '.0')
}

function parseUserAgent(ua: string): { device: string; browser: string } {
  // Simple UA parsing - enough for "mobile vs desktop"
  const isMobile = /mobile|android|iphone|ipad|windows phone/i.test(ua)
  const device = isMobile ? 'mobile' : 'desktop'

  let browser = 'unknown'
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'chrome'
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'safari'
  else if (/firefox/i.test(ua)) browser = 'firefox'
  else if (/edg/i.test(ua)) browser = 'edge'

  return { device, browser }
}

export async function logPageView(path: string, status: number = 200) {
  try {
    const headersList = await headers()

    const ip = (
      headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') ||
      'unknown'
    )

    const userAgent = headersList.get('user-agent') || 'unknown'
    const referrer = headersList.get('referer') || null
    const method = headersList.get('x-forwarded-method') || 'GET'

    const { device, browser } = parseUserAgent(userAgent)
    const anonIp = anonymizeIp(ip)

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      method,
      path,
      ip: anonIp,
      userAgent: `${device}/${browser}`,
      referrer,
      status,
    }

    // Log to console - PM2 captures and stores in ~/.pm2/logs/
    console.log(
      JSON.stringify({
        ...entry,
        type: 'page_view',
      })
    )
  } catch (err) {
    // Silently fail if headers unavailable (e.g., in generateStaticParams)
  }
}

export async function logApiCall(path: string, status: number, duration: number) {
  try {
    const headersList = await headers()

    const ip = (
      headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') ||
      'unknown'
    )

    const userAgent = headersList.get('user-agent') || 'unknown'
    const { device, browser } = parseUserAgent(userAgent)
    const anonIp = anonymizeIp(ip)

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: 'API',
      path,
      ip: anonIp,
      userAgent: `${device}/${browser}`,
      referrer: null,
      status,
    }

    console.log(
      JSON.stringify({
        ...entry,
        type: 'api_call',
        duration_ms: duration,
      })
    )
  } catch (err) {
    // Silently fail
  }
}
