/**
 * Author registry + category routing for the blog.
 *
 * Each blog post is attributed to an author based on its `category`, so the
 * byline and the JSON-LD `author` are consistent and posts published on the
 * same day are spread across different writers. Unmapped categories fall back
 * to the founder (Ivan).
 */

export type AuthorSocials = {
  instagram?: string
  linkedin?: string
  email?: string
}

export type Author = {
  slug: string
  name: string
  /** Short role shown next to the name, e.g. "Markets Correspondent". */
  role: string
  /** Public path to a square avatar. */
  photo: string
  bio: string
  /** Post categories this author covers. */
  categories: string[]
  socials?: AuthorSocials
  /** Link to a dedicated author page, if one exists. */
  aboutHref?: string
}

export const AUTHORS: Author[] = [
  {
    slug: 'ivan-lima',
    name: 'Ivan Lima',
    role: 'Founder & Author',
    photo: '/ivan-lima.jpg',
    bio:
      'Systems Analysis & Development student and active US stock market investor since ' +
      '2018. Ivan built Stock Market ROI to give retail investors direct access to the same ' +
      'data and analytical tools he wished existed when he started. Every article is written ' +
      'from the perspective of someone with real skin in the game - tracking earnings, reading ' +
      'SEC filings, and following market cycles for over eight years.',
    categories: ['Investing', 'Stocks'],
    socials: {
      instagram: 'https://www.instagram.com/ivan_lima_dev',
      linkedin: 'https://www.linkedin.com/in/ivanlimadev/',
      email: 'contato@ivanlimadev.com',
    },
    aboutHref: '/about',
  },
  {
    slug: 'jennifer-moore',
    name: 'Jennifer Moore',
    role: 'Markets Correspondent',
    photo: '/jennifer-moore.jpg',
    bio:
      'Jennifer Moore is a financial journalist covering the U.S. stock market for Stock ' +
      'Market ROI. She got her start in local radio, where she learned to report clearly and ' +
      'stay calm under pressure - the same instinct she now brings to breaking down earnings, ' +
      'market swings, and the economic forces behind them. Today she works as a markets ' +
      'correspondent, turning complex financial stories into plain language that everyday ' +
      'investors can actually use. What drives her is a relentless pursuit of the truth and a ' +
      'belief that people invest better when the facts are clear, the numbers are honest, and ' +
      'the nuance is not lost along the way. To Jennifer, good financial journalism is the ' +
      'foundation of a confident, well-informed investor.',
    categories: ['Markets', 'Economics'],
  },
  {
    slug: 'maya-bennett',
    name: 'Maya Bennett',
    role: 'Technology & Crypto Correspondent',
    photo: '/maya-bennett.jpg',
    bio:
      'Maya Bennett covers technology, crypto, and personal finance for Stock Market ROI. ' +
      'She is drawn to where innovation meets money - semiconductors, AI, digital assets, and ' +
      'the tools reshaping how people build wealth. She learned early to cut through the hype ' +
      'and find what actually matters for investors. Her goal is simple: explain fast-moving ' +
      'markets in plain English, separate signal from noise, and help readers decide with ' +
      'clarity instead of FOMO. To Maya, the best financial journalism respects both the ' +
      'reader\'s intelligence and their money.',
    categories: ['Technology', 'Crypto', 'Finance'],
  },
]

const DEFAULT_AUTHOR = AUTHORS[0] // Ivan

const BY_CATEGORY: Record<string, Author> = {}
for (const author of AUTHORS) {
  for (const category of author.categories) {
    BY_CATEGORY[category.toLowerCase()] = author
  }
}

/** Resolves the author responsible for a given post category. */
export function authorForCategory(category?: string | null): Author {
  if (!category) return DEFAULT_AUTHOR
  return BY_CATEGORY[category.toLowerCase()] ?? DEFAULT_AUTHOR
}

export function authorBySlug(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug)
}
