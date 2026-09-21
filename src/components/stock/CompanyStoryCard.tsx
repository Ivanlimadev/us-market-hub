'use client'
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

/**
 * "The Story of [Company]" card shown on a stock page when we have a full
 * long-form biography post for that ticker. Shows a ~150-word preview and links
 * to the complete history article. Static by design (no fetch): we only have a
 * handful of biographies, so hardcoding the preview is robust and zero-risk, and
 * keeps the full content living only in the blog post (good for SEO).
 */

type Story = { company: string; slug: string; preview: string }

const STORIES: Record<string, Story> = {
  NVDA: {
    company: 'Nvidia',
    slug: 'nvidia-complete-history-1993-2026-gpu-to-ai-empire',
    preview:
      'Few company stories are as improbable as Nvidia’s. On January 25, 1993, Jensen Huang, Chris Malachowsky and Curtis Priem founded the company at a Denny’s restaurant in San Jose, naming it after "invidia," the Latin word for envy. The early years were brutal: its first chip flopped and it nearly went bankrupt. But in 1999 Nvidia went public and launched the GeForce 256, billed as the world’s first GPU. Its 2006 bet on CUDA, a way to use gaming chips for general computing, looked like a distraction at the time. It became the deepest moat in tech, and the foundation of the AI revolution that would one day make Nvidia the most valuable company on Earth.',
  },
  TSLA: {
    company: 'Tesla',
    slug: 'tesla-complete-history-2003-2026-roadster-to-robotaxi',
    preview:
      'No company divides opinion like Tesla. Founded on July 1, 2003 by Martin Eberhard and Marc Tarpenning, it was nearly bankrupt by Christmas Eve 2008, when Elon Musk poured in his last personal funds to save it. It went public in 2010, the first American automaker to IPO since Ford in 1956. The Model S proved electric cars could be desirable, and the Model 3 pushed Tesla through "production hell" to become the best-selling EV in the world. After blowing past a $1 trillion valuation, Tesla is now reinventing itself again, betting its future on robotaxis and humanoid robots rather than just cars.',
  },
  AAPL: {
    company: 'Apple',
    slug: 'apple-complete-history-1976-2026-garage-to-trillions',
    preview:
      'Apple’s story is the ultimate business epic. Founded on April 1, 1976 by Steve Jobs, Steve Wozniak and Ronald Wayne in a Los Altos garage, it struck gold with the Apple II before going public in 1980. But by 1997 Apple was roughly 90 days from bankruptcy, saved only when Steve Jobs returned and rival Microsoft invested $150 million to keep it alive. What followed was the greatest comeback in business history: the iMac, the iPod, and in 2007 the iPhone, which created the modern world. From a garage to the first company worth over $4 trillion, no journey in business is quite like it.',
  },
  MCD: {
    company: 'McDonald’s',
    slug: 'mcdonalds-complete-history-1940-2026-brothers-kroc-empire',
    preview:
      'The story of McDonald’s is not really about hamburgers. In 1940 brothers Richard and Maurice McDonald opened a drive-in in San Bernardino, California, and in 1948 reinvented it with the "Speedee Service System," effectively inventing fast food. Then a milkshake-machine salesman named Ray Kroc saw an empire the brothers never imagined. He founded the McDonald’s Corporation in 1955 and, guided by the insight that the company was really "in the real estate business," turned a burger stand into a global cash machine. After buying out the brothers in 1961 and going public in 1965, McDonald’s grew into a 40,000-restaurant empire and one of the market’s most reliable dividend stocks. This is the complete story of the Golden Arches.',
  },
  MSFT: {
    company: 'Microsoft',
    slug: 'microsoft-complete-history-1975-2026-basic-to-ai-empire',
    preview:
      'Microsoft’s story is really two stories. Founded on April 4, 1975 by childhood friends Bill Gates and Paul Allen, it made one of the shrewdest deals in business history: licensing MS-DOS to IBM in 1980 while keeping the right to sell it to everyone else, which put its software at the heart of the entire PC industry. Windows and Office turned that into a near-monopoly, drawing a landmark antitrust case settled in 2001. Then came a lost decade under Steve Ballmer, missing both search and mobile. But in 2014 Satya Nadella engineered one of the greatest comebacks ever, betting on the cloud (Azure) and later becoming OpenAI’s biggest backer. From a dorm-room idea to a $3.7 trillion AI titan, this is the complete story of Microsoft.',
  },
  NU: {
    company: 'Nubank',
    slug: 'nubank-complete-history-2013-2026-david-velez-purple-card-empire',
    preview:
      'Nubank was born from one man’s frustration with Brazil’s banks. David Vélez, a Colombian Stanford MBA working at Sequoia, was shocked that just five banks controlled 80% of the Brazilian market, charging brutal fees and offering terrible service behind bulletproof glass. So in 2013 he built the opposite: a no-fee purple credit card run entirely from a phone. With co-founders Cristina Junqueira (ex-Itaú) and Edward Wible, and backing from Sequoia and later Warren Buffett, that single card grew into the largest digital bank outside Asia. After a blockbuster 2021 NYSE IPO, Nubank now serves around 139 million customers, turns billion-dollar quarterly profits, and has launched in the US. This is the complete story of the purple-card empire.',
  },
  PBR: {
    company: 'Petrobras',
    slug: 'petrobras-complete-history-1953-2026-oil-is-ours-pre-salt-lava-jato-pbr',
    preview:
      'Few companies are as tied to a nation as Petrobras is to Brazil. Born in 1953 from the nationalist cry "O petróleo é nosso" (the oil is ours), President Getúlio Vargas gave it a state monopoly over Brazil’s oil. It mastered deepwater drilling, and in 2006 struck one of the century’s biggest discoveries: the "pré-sal," billions of barrels buried under the ocean floor, briefly making it one of the world’s most valuable companies. Then came the fall: the 2014 Lava Jato scandal, Brazil’s largest ever, with roughly $3 billion in bribes, crashing the stock and toppling politicians. Petrobras rebuilt into a dividend powerhouse, but the government still controls it, so politics is always part of PBR. This is the complete story.',
  },
  VALE: {
    company: 'Vale',
    slug: 'vale-complete-history-1942-2026-iron-ore-giant-china-brumadinho-vale',
    preview:
      'Vale is a company of extraordinary scale and painful contradictions. Founded by the Brazilian government in 1942 as Companhia Vale do Rio Doce to develop the iron ore of Minas Gerais, it was privatized in 1997 and unleashed as a global competitor. Then history handed it China: as the country industrialized, its endless hunger for steel made Vale, sitting on the high-grade Carajás ore, the world’s largest iron ore producer. But its modern story is inseparable from tragedy: the 2015 Mariana disaster and, above all, the 2019 Brumadinho dam collapse that killed 270 people, the worst industrial accident in Brazil’s history. Today Vale is a cyclical, high-dividend mining giant tied to China, still repairing its reputation. This is the complete story.',
  },
  // Crypto (keyed by CoinGecko id, uppercased): shown on /crypto/[id] pages.
  BITCOIN: {
    company: 'Bitcoin',
    slug: 'bitcoin-complete-history-2008-2026-whitepaper-to-today',
    preview:
      'Bitcoin’s story reads like a thriller. On October 31, 2008, amid the global financial crisis, someone using the name Satoshi Nakamoto published a 9-page whitepaper proposing money no bank or government could control. The genesis block was mined in January 2009. From the famous 10,000-BTC pizza in 2010 to the collapse of Mt. Gox, the 2017 mania, the FTX crash, and the 2024 spot-ETF revolution that pushed it past $100,000, Bitcoin has been declared dead hundreds of times, and come back stronger every time. This is the complete story of the asset that started a financial revolution, and its creator who vanished.',
  },
  PEPE: {
    company: 'Pepe',
    slug: 'pepe-coin-complete-history-2023-2026-memecoin-frog',
    preview:
      'Of all the strange stories in crypto, few are stranger than Pepe. It is a token based on a cartoon frog meme, with no product, no company, and no promises other than being a meme. Launched in April 2023 with no pre-sale, it rocketed to a $1.6 billion market cap within weeks. By December 2024 it hit an all-time high and briefly topped $11 billion, worth more than some real companies, before crashing roughly 85% in 2025. This is the complete, honest story of PEPE: how a joke token became one of the most famous memecoins in history, and why it is one of the riskiest bets in all of crypto.',
  },
  ETHEREUM: {
    company: 'Ethereum',
    slug: 'ethereum-complete-history-2013-2026-vitalik-buterin-world-computer',
    preview:
      'Bitcoin proved you could move money without a bank. But a teenage programmer named Vitalik Buterin wanted more: a blockchain that could run any program. In late 2013, at just 19, he wrote the Ethereum whitepaper, introducing the smart contract, code that executes automatically with no bank or court to enforce it. After a 2014 crowdsale and a 2015 launch, Ethereum survived the devastating 2016 DAO hack (which split it from Ethereum Classic) and went on to power DeFi, NFTs and most of modern crypto. In 2022 it pulled off "The Merge," cutting its energy use by over 99%. This is the complete story of crypto’s world computer and the young genius who built it.',
  },
}

export function CompanyStoryCard({ symbol }: { symbol: string }) {
  const story = STORIES[symbol.toUpperCase()]
  if (!story) return null

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/40 p-6">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#c8a45d]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#c8a45d]">
          The Story of {story.company}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">{story.preview}</p>
      <Link
        href={`/blog/${story.slug}`}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#c8a45d] px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-[#d9b86e]"
      >
        Read the full story
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
