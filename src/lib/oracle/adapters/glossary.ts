import { GLOSSARY, type GlossaryTerm } from '@/lib/glossary'
import { OracleFetchError, type OracleAdapter } from '@/lib/oracle/types'

// content.glossary — our own financial glossary (green). Returns the full list,
// or a single term when `slug` is provided.
export const glossaryAdapter: OracleAdapter<
  { slug?: string },
  GlossaryTerm | GlossaryTerm[]
> = {
  key: 'content.glossary',
  meta: {
    title: 'Financial glossary (definitions of P/E, EPS, DY, ...)',
    category: 'content',
    source: 'own content',
    license: 'green',
    status: 'live',
    params: [{ name: 'slug', required: false, type: 'string (omit to list all)' }],
  },
  async fetch({ slug }) {
    if (slug) {
      const term = GLOSSARY.find((t) => t.slug === slug.toLowerCase())
      if (!term) throw new OracleFetchError(`unknown term: ${slug}`, 404)
      return { data: term, asOf: new Date().toISOString() }
    }
    return { data: GLOSSARY, asOf: new Date().toISOString() }
  },
}
