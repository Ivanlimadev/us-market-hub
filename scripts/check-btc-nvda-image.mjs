import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkImage() {
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, image_url, image_alt')
    .eq('slug', '1000-bitcoin-vs-nvidia-10-years')
    .single()

  console.log('\n📸 Current image in database:')
  console.log('URL:', data.image_url)
  console.log('ALT:', data.image_alt)
  console.log('')
}

checkImage()
