'use client'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ComponentProps } from 'react'

// Comments are below the fold, client-only, and carry no SEO value, but they
// ship a chunk of JS and fire their own Supabase fetch. Mount them only when the
// reader scrolls near, so they stay off the initial load / critical path.
const CommentsSection = dynamic(() => import('@/components/comments/CommentsSection'), { ssr: false })

type Props = ComponentProps<typeof CommentsSection>

export function LazyComments(props: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || show) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [show])

  return <div ref={ref}>{show ? <CommentsSection {...props} /> : <div className="min-h-[200px]" />}</div>
}
