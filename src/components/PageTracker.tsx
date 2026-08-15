import { logPageView } from '@/lib/server-logger'

/**
 * Server component that logs page views.
 * Use at the top of any page.tsx you want to track.
 *
 * Example:
 *   export default function MyPage() {
 *     return (
 *       <>
 *         <PageTracker path="/my-page" />
 *         <div>Content...</div>
 *       </>
 *     )
 *   }
 */
export async function PageTracker({ path }: { path: string }) {
  await logPageView(path)
  return null
}
