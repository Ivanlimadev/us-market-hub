import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function publishArticle() {
  try {
    const contentPath = '/tmp/btc-vs-nvda-comparison.md'
    const content = readFileSync(contentPath, 'utf-8')

    console.log('📝 Publishing "$1,000 in Bitcoin vs Nvidia" article...\n')

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([
        {
          slug: '1000-bitcoin-vs-nvidia-10-years',
          title: '$1,000 Invested in Bitcoin vs Nvidia Over 10 Years: Which Would You Own Today?',
          excerpt: 'If you invested $1,000 in Bitcoin in 2014, you\'d have $200,000 today. In Nvidia, you\'d have $25,000. We break down the returns, volatility, and lessons from two of the decade\'s best investments.',
          content: content,
          category: 'Investing',
          image_url: 'https://images.pexels.com/photos/8370733/pexels-photo-8370733.jpeg',
          image_alt: 'Bitcoin and crypto investment comparison',
          status: 'published',
          published_at: new Date().toISOString(),
          tickers: ['NVDA'],
          seo_title: '$1,000 in Bitcoin vs Nvidia (10 Years): Returns Comparison & Analysis',
          seo_description: 'Compare Bitcoin vs Nvidia investment returns over 10 years. $1,000 in BTC = $200K, NVDA = $25K. Analyze volatility, risk, and lessons learned.'
        }
      ])
      .select()

    if (error) {
      console.error('❌ Error publishing article:', error.message)
      process.exit(1)
    }

    console.log('✅ Article published successfully!')
    console.log(`\n📖 Live at: https://stockmarketroi.com/blog/${data[0].slug}`)
    console.log('\n📊 Key stats in article:')
    console.log('   BTC: $1,000 → $200,000 (200x)')
    console.log('   NVDA: $1,000 → $25,000-$30,000 (25-30x)')
    console.log('   Comparison of volatility, timing, and long-term strategy')
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

publishArticle()
