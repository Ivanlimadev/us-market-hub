import { NextRequest, NextResponse } from 'next/server'

/**
 * Export server logs in CSV or JSON format
 *
 * Usage:
 *   GET /api/admin/logs/export?format=csv  → Downloads CSV file
 *   GET /api/admin/logs/export?format=json → Returns JSON
 *
 * Note: In production, this should:
 * 1. Read actual logs from PM2 or a log file
 * 2. Require authentication (API key or session)
 * 3. Support filtering by date range, path, IP, etc.
 */

interface LogEntry {
  timestamp: string
  type: string
  path: string
  ip: string
  userAgent: string
  status: number
  duration_ms?: number
}

// Mock log data for demo
function getMockLogs(): LogEntry[] {
  return [
    {
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: 'page_view',
      path: '/',
      ip: '192.168.1.0',
      userAgent: 'desktop/chrome',
      status: 200,
    },
    {
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      type: 'page_view',
      path: '/stocks/aapl',
      ip: '203.45.67.0',
      userAgent: 'mobile/safari',
      status: 200,
    },
    {
      timestamp: new Date(Date.now() - 900000).toISOString(),
      type: 'page_view',
      path: '/crypto/bitcoin',
      ip: '84.56.23.0',
      userAgent: 'desktop/firefox',
      status: 200,
    },
    {
      timestamp: new Date(Date.now() - 600000).toISOString(),
      type: 'api_call',
      path: '/api/screener',
      ip: '192.168.1.0',
      userAgent: 'desktop/chrome',
      status: 200,
      duration_ms: 245,
    },
    {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'page_view',
      path: '/blog',
      ip: '156.78.90.0',
      userAgent: 'mobile/chrome',
      status: 200,
    },
  ]
}

function logsToCSV(logs: LogEntry[]): string {
  const headers = ['timestamp', 'type', 'path', 'ip', 'userAgent', 'status', 'duration_ms']
  const csv = [
    headers.join(','),
    ...logs.map((log) =>
      [
        log.timestamp,
        log.type,
        log.path,
        log.ip,
        log.userAgent,
        log.status,
        log.duration_ms || '',
      ]
        .map((field) => (typeof field === 'string' && field.includes(',') ? `"${field}"` : field))
        .join(',')
    ),
  ]
  return csv.join('\n')
}

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format') || 'json'
  const logs = getMockLogs()

  if (format === 'csv') {
    const csv = logsToCSV(logs)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  if (format === 'json') {
    return NextResponse.json({
      count: logs.length,
      exported_at: new Date().toISOString(),
      logs,
    })
  }

  return NextResponse.json({ error: 'Invalid format. Use ?format=csv or ?format=json' }, { status: 400 })
}
