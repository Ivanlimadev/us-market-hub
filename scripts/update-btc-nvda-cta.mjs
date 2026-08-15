import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const content = readFileSync('/tmp/btc-vs-nvda-comparison.md', 'utf-8')

async function updateArticle() {
  console.log('📝 Updating article with CTA...\n')

  const { error } = await supabase
    .from('blog_posts')
    .update({ content })
    .eq('slug', '1000-bitcoin-vs-nvidia-10-years')

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } else {
    console.log('✅ Article updated with CTA!')
    console.log('   Added "Want to Analyze Other Comparisons?" section')
    console.log('   Directs readers to stockmarketroi.com')
  }
}

updateArticle()
