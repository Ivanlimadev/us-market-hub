import Link from 'next/link'
import Image from 'next/image'
import { MostSearchedStocks } from './MostSearchedStocks'
import { AppDownloadCard } from '@/components/app/AppDownloadCard'

interface SidebarPost {
  slug: string
  title: string
  image_url: string | null
  image_alt: string | null
  category: string
}

function LatestPosts({ posts }: { posts: SidebarPost[] }) {
  if (!posts.length) return null
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Latest Posts</h3>
      <ul className="space-y-3.5">
        {posts.slice(0, 5).map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="group flex gap-3">
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                {p.image_url && (
                  <Image src={p.image_url} alt={p.image_alt ?? p.title} fill sizes="64px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">{p.category}</p>
                <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-300 transition-colors group-hover:text-white">{p.title}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/blog" className="mt-3 block text-center text-xs font-medium text-emerald-400 hover:text-emerald-300">
        See all posts →
      </Link>
    </div>
  )
}

/** Sidebar shown on every blog post - most-searched stocks + latest posts. */
export function BlogSidebar({ latest }: { latest: SidebarPost[] }) {
  return (
    <aside className="mt-10 space-y-6 lg:mt-0 lg:sticky lg:top-20 lg:self-start">
      <MostSearchedStocks />
      <AppDownloadCard variant="sidebar" />
      <LatestPosts posts={latest} />
    </aside>
  )
}
