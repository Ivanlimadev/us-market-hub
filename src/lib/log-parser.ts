// Parse PM2 logs and extract analytics
// Note: In production, read from actual log files or a database

export interface PageViewStats {
  path: string
  count: number
  devices: { desktop: number; mobile: number }
  browsers: { [key: string]: number }
}

export interface AnalyticsData {
  totalViews: number
  uniquePages: number
  topPages: PageViewStats[]
  deviceSplit: { desktop: number; mobile: number }
  topBrowsers: { [key: string]: number }
  lastUpdated: string
}

/**
 * Mock analytics data generator
 * In production, this would read from PM2 logs or a database
 */
export function generateMockAnalytics(): AnalyticsData {
  const pages: PageViewStats[] = [
    {
      path: '/',
      count: 1250,
      devices: { desktop: 850, mobile: 400 },
      browsers: { chrome: 700, safari: 350, firefox: 150, edge: 50 },
    },
    {
      path: '/stocks/aapl',
      count: 890,
      devices: { desktop: 600, mobile: 290 },
      browsers: { chrome: 500, safari: 250, firefox: 100, edge: 40 },
    },
    {
      path: '/crypto/bitcoin',
      count: 756,
      devices: { desktop: 450, mobile: 306 },
      browsers: { chrome: 420, safari: 200, firefox: 100, edge: 36 },
    },
    {
      path: '/blog',
      count: 623,
      devices: { desktop: 420, mobile: 203 },
      browsers: { chrome: 350, safari: 180, firefox: 70, edge: 23 },
    },
    {
      path: '/screener',
      count: 542,
      devices: { desktop: 380, mobile: 162 },
      browsers: { chrome: 320, safari: 150, firefox: 60, edge: 12 },
    },
    {
      path: '/crypto',
      count: 489,
      devices: { desktop: 330, mobile: 159 },
      browsers: { chrome: 280, safari: 140, firefox: 50, edge: 19 },
    },
  ]

  const totalViews = pages.reduce((sum, p) => sum + p.count, 0)
  const desktopTotal = pages.reduce((sum, p) => sum + p.devices.desktop, 0)
  const mobileTotal = pages.reduce((sum, p) => sum + p.devices.mobile, 0)

  const allBrowsers: { [key: string]: number } = {}
  pages.forEach((p) => {
    Object.entries(p.browsers).forEach(([browser, count]) => {
      allBrowsers[browser] = (allBrowsers[browser] || 0) + count
    })
  })

  return {
    totalViews,
    uniquePages: pages.length,
    topPages: pages,
    deviceSplit: { desktop: desktopTotal, mobile: mobileTotal },
    topBrowsers: Object.fromEntries(
      Object.entries(allBrowsers).sort(([, a], [, b]) => b - a)
    ),
    lastUpdated: new Date().toISOString(),
  }
}
