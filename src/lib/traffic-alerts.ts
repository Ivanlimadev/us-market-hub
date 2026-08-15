/**
 * Traffic Alert System
 * Monitors page views and alerts if traffic drops below threshold
 */

interface TrafficThreshold {
  minViewsPerHour: number
  checkInterval: number // ms
  alertEmail?: string
}

interface TrafficMetrics {
  viewsLastHour: number
  viewsLastDay: number
  timestamp: string
  status: 'normal' | 'warning' | 'critical'
  message: string
}

// Default thresholds
const DEFAULT_THRESHOLDS: TrafficThreshold = {
  minViewsPerHour: 50,
  checkInterval: 3600000, // 1 hour
  alertEmail: process.env.ALERT_EMAIL,
}

/**
 * Check traffic levels
 * Returns status and message
 */
export function checkTrafficMetrics(
  viewsLastHour: number,
  viewsLastDay: number,
  threshold: TrafficThreshold = DEFAULT_THRESHOLDS
): TrafficMetrics {
  let status: 'normal' | 'warning' | 'critical' = 'normal'
  let message = '✅ Traffic normal'

  if (viewsLastHour < threshold.minViewsPerHour * 0.5) {
    status = 'critical'
    message = `🚨 CRITICAL: Traffic at ${viewsLastHour} views/hour (expected: ${threshold.minViewsPerHour}+)`
  } else if (viewsLastHour < threshold.minViewsPerHour * 0.75) {
    status = 'warning'
    message = `⚠️ WARNING: Traffic at ${viewsLastHour} views/hour (expected: ${threshold.minViewsPerHour}+)`
  }

  return {
    viewsLastHour,
    viewsLastDay,
    timestamp: new Date().toISOString(),
    status,
    message,
  }
}

/**
 * Generate alert message
 */
export function generateAlertMessage(metrics: TrafficMetrics): string {
  return `
[Traffic Alert] ${metrics.status.toUpperCase()}
${metrics.message}

Time: ${new Date(metrics.timestamp).toLocaleString()}
Views (last 24h): ${metrics.viewsLastDay}
Views (last 1h): ${metrics.viewsLastHour}

Action: Check server logs at ~/.pm2/logs/us-market-hub-out.log
  `
}

/**
 * Log alert to console (PM2 will capture it)
 */
export function logAlert(metrics: TrafficMetrics): void {
  if (metrics.status !== 'normal') {
    console.error(
      JSON.stringify({
        type: 'traffic_alert',
        status: metrics.status,
        message: metrics.message,
        metrics,
        timestamp: metrics.timestamp,
      })
    )
  }
}

/**
 * Mock function to simulate sending email alert
 * In production, integrate with a mail service
 */
export async function sendEmailAlert(metrics: TrafficMetrics, to?: string): Promise<boolean> {
  if (!to) return false

  console.log(`[EMAIL ALERT] Sending to ${to}: ${metrics.message}`)

  // In production, use nodemailer, SendGrid, Resend, etc.
  // await sendEmail({
  //   to,
  //   subject: `[Traffic Alert] ${metrics.status.toUpperCase()}`,
  //   html: generateAlertMessage(metrics),
  // })

  return true
}

/**
 * Example: Run this as a cron job to check traffic every hour
 * Usage in a route handler:
 *
 *   import { checkTrafficMetrics, logAlert } from '@/lib/traffic-alerts'
 *
 *   export async function GET() {
 *     const metrics = checkTrafficMetrics(65, 1200) // 65 views/hour, 1200 views/day
 *     logAlert(metrics)
 *     return Response.json(metrics)
 *   }
 */
