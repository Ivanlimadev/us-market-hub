import { NextRequest, NextResponse } from 'next/server'
import { checkTrafficMetrics, logAlert, sendEmailAlert } from '@/lib/traffic-alerts'

/**
 * Check current traffic levels and send alerts if needed
 *
 * Requires API key: ?key=YOUR_API_KEY
 *
 * Usage:
 *   curl https://stockmarketroi.com/api/admin/traffic-check?key=YOUR_API_KEY
 *
 * Set ANALYTICS_API_KEY in .env.local
 */

function validateApiKey(key: string | null): boolean {
  const validKey = process.env.ANALYTICS_API_KEY
  if (!validKey) return false
  return key === validKey
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')

  // Check API key
  if (!validateApiKey(key)) {
    return NextResponse.json({ error: 'Unauthorized. Missing or invalid API key.' }, { status: 403 })
  }
  try {
    // Mock data - in production, calculate from actual logs
    const viewsLastHour = 65
    const viewsLastDay = 1200

    // Check traffic
    const metrics = checkTrafficMetrics(viewsLastHour, viewsLastDay)

    // Log alert if necessary (PM2 will capture it)
    logAlert(metrics)

    // Send email alert if configured
    if (metrics.status !== 'normal' && process.env.ALERT_EMAIL) {
      await sendEmailAlert(metrics, process.env.ALERT_EMAIL)
    }

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Traffic Check Error]', error)
    return NextResponse.json(
      { error: 'Traffic check failed', details: String(error) },
      { status: 500 }
    )
  }
}
