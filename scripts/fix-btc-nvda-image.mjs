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

async function fixImage() {
  console.log('🖼️  Fixing Bitcoin vs Nvidia article image...\n')

  const { error } = await supabase
    .from('blog_posts')
    .update({
      image_url: 'https://images.pexels.com/photos/8370733/pexels-photo-8370733.jpeg',
      image_alt: 'Investment portfolio analysis and returns comparison'
    })
    .eq('slug', '1000-bitcoin-vs-nvidia-10-years')

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } else {
    console.log('✅ Image updated!')
    console.log('   Old: puppy/dog image')
    console.log('   New: investment portfolio image')
  }
}

fixImage()
