import type { Metadata } from 'next'
import { generateMockAnalytics } from '@/lib/log-parser'
import { PageTracker } from '@/components/PageTracker'

export const metadata: Metadata = {
  title: 'Analytics Dashboard',
  description: 'Server-side traffic analytics',
  robots: { index: false, follow: false }, // Don't index analytics page
}

export default async function AnalyticsPage() {
  const analytics = generateMockAnalytics()

  const deviceData = [
    { name: 'Desktop', value: analytics.deviceSplit.desktop, fill: '#10b981' },
    { name: 'Mobile', value: analytics.deviceSplit.mobile, fill: '#3b82f6' },
  ]

  const browserData = Object.entries(analytics.topBrowsers)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))

  return (
    <>
      <PageTracker path="/analytics" />
      <div className="mx-auto max-w-screen-xl px-4 py-10 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-zinc-400 mt-2">
            Server-side traffic tracking · Last updated: {new Date(analytics.lastUpdated).toLocaleTimeString()}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-xs font-semibold uppercase text-zinc-500 mb-2">Total Page Views</p>
            <p className="text-3xl font-bold text-emerald-400">{analytics.totalViews.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-xs font-semibold uppercase text-zinc-500 mb-2">Unique Pages Tracked</p>
            <p className="text-3xl font-bold text-blue-400">{analytics.uniquePages}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-xs font-semibold uppercase text-zinc-500 mb-2">Mobile / Desktop Ratio</p>
            <p className="text-3xl font-bold text-violet-400">
              {((analytics.deviceSplit.mobile / analytics.totalViews) * 100).toFixed(0)}% / {((analytics.deviceSplit.desktop / analytics.totalViews) * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Device Split */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Device Split</h2>
          <div className="space-y-3">
            {deviceData.map((device) => (
              <div key={device.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-zinc-300">{device.name}</span>
                  <span className="text-sm font-semibold text-zinc-400">
                    {device.value.toLocaleString()} ({((device.value / analytics.totalViews) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(device.value / analytics.totalViews) * 100}%`,
                      backgroundColor: device.fill,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Browser Distribution */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Browser Usage</h2>
          <div className="space-y-3">
            {browserData.map((browser) => (
              <div key={browser.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-zinc-300">{browser.name}</span>
                  <span className="text-sm font-semibold text-zinc-400">
                    {browser.value.toLocaleString()} ({((browser.value / analytics.totalViews) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(browser.value / analytics.totalViews) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Pages */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Pages</h2>
          <div className="space-y-3">
            {analytics.topPages.map((page, i) => (
              <div key={page.path} className="flex items-center justify-between border-b border-zinc-800/50 pb-3 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-500 w-6">#{i + 1}</span>
                    <code className="text-sm font-mono text-zinc-300">{page.path}</code>
                  </div>
                  <div className="text-xs text-zinc-600 ml-8 mt-1">
                    {page.devices.desktop.toLocaleString()} desktop · {page.devices.mobile.toLocaleString()} mobile
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">{page.count.toLocaleString()}</p>
                  <p className="text-xs text-zinc-600">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">📊 How This Works</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This dashboard displays server-side analytics from PM2 logs. Each page view is recorded with:
            device type (mobile/desktop), browser, IP (anonymized), and timestamp.
            <br />
            <br />
            <strong className="text-zinc-300">To see real data:</strong> Connect to your VPS and parse logs from{' '}
            <code className="text-xs bg-zinc-800 px-2 py-1 rounded">~/.pm2/logs/us-market-hub-out.log</code>
            <br />
            <br />
            <strong className="text-zinc-300">Command:</strong>{' '}
            <code className="text-xs bg-zinc-800 px-2 py-1 rounded">tail -f ~/.pm2/logs/us-market-hub-out.log | grep page_view</code>
          </p>
        </div>
      </div>
    </>
  )
}
