import { NextResponse } from 'next/server'
import { checkTrafficMetrics, logAlert, sendEmailAlert } from '@/lib/traffic-alerts'

/**
 * Check current traffic levels and send alerts if needed
 *
 * This endpoint should be called by a cron job every hour:
 *   curl https://stockmarketroi.com/api/admin/traffic-check
 *
 * Or set up via GitHub Actions cron workflow
 */

export async function GET() {
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
