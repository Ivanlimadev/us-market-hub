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

async function forceNewImage() {
  console.log('🔄 Forcing new image with cache-busting...\n')

  // Use completely different image URL to break cache
  const { error } = await supabase
    .from('blog_posts')
    .update({
      image_url: 'https://images.pexels.com/photos/187041/pexels-photo-187041.jpeg',
      image_alt: 'Stock market investment chart and financial analysis'
    })
    .eq('slug', '1000-bitcoin-vs-nvidia-10-years')

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log('✅ Image updated to different URL!')
  console.log('   New URL: https://images.pexels.com/photos/187041/pexels-photo-187041.jpeg')
  console.log('   Cache should clear in Next.js ISR (5 min revalidate)')
}

forceNewImage()
