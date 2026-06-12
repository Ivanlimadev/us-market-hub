import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(process.cwd(), 'content/posts')

export interface ArticleMeta {
  slug:        string
  title:       string
  description: string
  date:        string
  author:      string
  tags:        string[]
  readTime:    number
  cover?:      string
}

export interface Article extends ArticleMeta {
  body: string
}

function wordsToMinutes(text: string) {
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return []
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'))
  return files
    .map((file) => {
      const slug    = file.replace(/\.mdx$/, '')
      const raw     = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8')
      const { data, content } = matter(raw)
      return {
        slug,
        title:       String(data.title       ?? slug),
        description: String(data.description ?? ''),
        date:        String(data.date         ?? ''),
        author:      String(data.author       ?? 'Stock Market ROI'),
        tags:        Array.isArray(data.tags) ? data.tags : [],
        readTime:    typeof data.readTime === 'number' ? data.readTime : wordsToMinutes(content),
        cover:       data.cover,
      } satisfies ArticleMeta
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getArticle(slug: string): Article | null {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content: body } = matter(raw)
  return {
    slug,
    title:       String(data.title       ?? slug),
    description: String(data.description ?? ''),
    date:        String(data.date         ?? ''),
    author:      String(data.author       ?? 'Stock Market ROI'),
    tags:        Array.isArray(data.tags) ? data.tags : [],
    readTime:    typeof data.readTime === 'number' ? data.readTime : wordsToMinutes(body),
    cover:       data.cover,
    body,
  }
}
