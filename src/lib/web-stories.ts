// Data for Google Web Stories (AMP amp-story pages). Each story is a short,
// tappable, full-screen visual retelling of a full biography article, ending
// with a CTA that links to the complete post. Rendered as raw AMP HTML by
// src/app/web-stories/[slug]/route.ts.
//
// Images are Pexels URLs force-cropped to a uniform 9:16 portrait (720x1280),
// so every slide has the exact dimensions AMP requires.

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=720&h=1280`

export interface StorySlide {
  image: string
  heading: string
  text?: string
}

export interface WebStory {
  slug: string
  title: string
  publisher: string
  /** The full article this story summarizes; used for the closing CTA. */
  articleSlug: string
  slides: StorySlide[]
}

export const WEB_STORIES: Record<string, WebStory> = {
  'the-story-of-nvidia': {
    slug: 'the-story-of-nvidia',
    title: 'The Story of Nvidia',
    publisher: 'Stock Market ROI',
    articleSlug: 'nvidia-complete-history-1993-2026-gpu-to-ai-empire',
    slides: [
      { image: px(2582937), heading: 'The Story of Nvidia', text: 'From a Denny’s booth to a $5 trillion AI empire.' },
      { image: px(3520694), heading: '1993', text: 'Three engineers founded Nvidia at a Denny’s diner in San Jose.' },
      { image: px(6801648), heading: 'Near-death', text: 'Its first chip flopped. The company almost went bankrupt.' },
      { image: px(2582937), heading: '1999', text: 'It launched the GeForce 256, billed as the world’s first GPU.' },
      { image: px(3520694), heading: 'The 2006 bet', text: 'It bet on CUDA. Rivals thought it was a distraction.' },
      { image: px(8566472), heading: 'The AI boom', text: 'That bet became the engine of the entire AI revolution.' },
      { image: px(730564), heading: 'Today', text: 'Nvidia is now one of the most valuable companies on Earth.' },
    ],
  },
  'the-story-of-nubank': {
    slug: 'the-story-of-nubank',
    title: 'The Story of Nubank',
    publisher: 'Stock Market ROI',
    articleSlug: 'nubank-complete-history-2013-2026-david-velez-purple-card-empire',
    slides: [
      { image: px(7621136), heading: 'The Story of Nubank', text: 'How a bad bank visit built a $70 billion empire.' },
      { image: px(4386370), heading: 'The problem', text: 'Five banks controlled 80% of Brazil, charging brutal fees.' },
      { image: px(259200), heading: '2013', text: 'David Vélez built the opposite: a no-fee purple card, run from a phone.' },
      { image: px(6801874), heading: 'Explosive growth', text: 'It spread by word of mouth into the largest digital bank outside Asia.' },
      { image: px(1602726), heading: 'Buffett backs it', text: 'Warren Buffett invested. Nubank IPO’d on the NYSE in 2021.' },
      { image: px(4386370), heading: 'Today', text: 'Around 139 million customers and billion-dollar quarterly profits.' },
    ],
  },
  'the-story-of-apple': {
    slug: 'the-story-of-apple',
    title: 'The Story of Apple',
    publisher: 'Stock Market ROI',
    articleSlug: 'apple-complete-history-1976-2026-garage-to-trillions',
    slides: [
      { image: px(356056), heading: 'The Story of Apple', text: 'From a garage to the first $4 trillion company.' },
      { image: px(404280), heading: '1976', text: 'Steve Jobs and Steve Wozniak built the Apple I in a garage.' },
      { image: px(2582937), heading: 'Near bankruptcy', text: 'By 1997 Apple was about 90 days from going broke.' },
      { image: px(356056), heading: 'The comeback', text: 'Jobs returned, and rival Microsoft invested $150M to keep it alive.' },
      { image: px(404280), heading: '2007', text: 'The iPhone launched and created the modern world.' },
      { image: px(730564), heading: 'Today', text: 'Apple became the first company worth over $4 trillion.' },
    ],
  },
  'the-story-of-microsoft': {
    slug: 'the-story-of-microsoft',
    title: 'The Story of Microsoft',
    publisher: 'Stock Market ROI',
    articleSlug: 'microsoft-complete-history-1975-2026-basic-to-ai-empire',
    slides: [
      { image: px(356056), heading: 'The Story of Microsoft', text: 'From a garage software deal to a $3.7 trillion AI empire.' },
      { image: px(2582937), heading: '1975', text: 'Bill Gates and Paul Allen wrote software for the first PCs.' },
      { image: px(356056), heading: 'The IBM deal', text: 'In 1980 it licensed MS-DOS to IBM, and kept the rights to resell it.' },
      { image: px(6801648), heading: 'The lost decade', text: 'Under Ballmer it missed search and mobile entirely.' },
      { image: px(8566472), heading: 'The comeback', text: 'Nadella bet on the cloud and became OpenAI’s biggest backer.' },
      { image: px(730564), heading: 'Today', text: 'Microsoft is one of the most valuable companies on Earth.' },
    ],
  },
  'the-story-of-tesla': {
    slug: 'the-story-of-tesla',
    title: 'The Story of Tesla',
    publisher: 'Stock Market ROI',
    articleSlug: 'tesla-complete-history-2003-2026-roadster-to-robotaxi',
    slides: [
      { image: px(110844), heading: 'The Story of Tesla', text: 'From near-bankruptcy to robotaxis and robots.' },
      { image: px(187041), heading: '2003', text: 'Founded by Eberhard and Tarpenning; Elon Musk soon led it.' },
      { image: px(110844), heading: 'Christmas Eve 2008', text: 'Musk poured in his last funds to save it from collapse.' },
      { image: px(6801648), heading: 'Production hell', text: 'The Model 3 pushed Tesla to become the best-selling EV in the world.' },
      { image: px(8566472), heading: 'The next bet', text: 'Now it is betting its future on robotaxis and humanoid robots.' },
      { image: px(730564), heading: 'Today', text: 'Tesla blew past a $1 trillion valuation.' },
    ],
  },
  'the-story-of-amazon': {
    slug: 'the-story-of-amazon',
    title: 'The Story of Amazon',
    publisher: 'Stock Market ROI',
    articleSlug: 'amazon-complete-history-1994-2026-garage-bookstore-to-everything-store-aws',
    slides: [
      { image: px(4481259), heading: 'The Story of Amazon', text: 'From a garage bookstore to a $2.7 trillion everything store.' },
      { image: px(6169668), heading: '1994', text: 'Jeff Bezos wrote the plan on a drive from New York to Seattle.' },
      { image: px(4481259), heading: 'Get Big Fast', text: 'He refused to show a profit for years, plowing everything into growth.' },
      { image: px(6801648), heading: 'The dot-com crash', text: 'The stock fell more than 90%, but Amazon survived.' },
      { image: px(8566472), heading: 'The secret weapon', text: 'AWS, a cloud “side project,” became its real profit engine.' },
      { image: px(730564), heading: 'Today', text: 'Amazon is one of the most valuable companies on Earth.' },
    ],
  },
  'the-story-of-mcdonalds': {
    slug: 'the-story-of-mcdonalds',
    title: 'The Story of McDonald’s',
    publisher: 'Stock Market ROI',
    articleSlug: 'mcdonalds-complete-history-1940-2026-brothers-kroc-empire',
    slides: [
      { image: px(1639557), heading: 'The Story of McDonald’s', text: 'From a burger stand to a global empire built on real estate.' },
      { image: px(1639557), heading: '1940', text: 'The McDonald brothers opened a drive-in in California.' },
      { image: px(1639557), heading: '1948', text: 'Their “Speedee Service System” basically invented fast food.' },
      { image: px(259027), heading: 'The real business', text: 'Ray Kroc realized the money was in real estate, not burgers.' },
      { image: px(730564), heading: 'A dividend king', text: 'McDonald’s has raised its dividend for decades.' },
      { image: px(1639557), heading: 'Today', text: 'More than 40,000 restaurants around the world.' },
    ],
  },
  'the-story-of-petrobras': {
    slug: 'the-story-of-petrobras',
    title: 'The Story of Petrobras',
    publisher: 'Stock Market ROI',
    articleSlug: 'petrobras-complete-history-1953-2026-oil-is-ours-pre-salt-lava-jato-pbr',
    slides: [
      { image: px(3855962), heading: 'The Story of Petrobras', text: 'From “the oil is ours” to the pre-salt giant, and a huge scandal.' },
      { image: px(87236), heading: '1953', text: 'Getúlio Vargas created it with a state oil monopoly.' },
      { image: px(3855962), heading: 'The pre-salt', text: 'In 2006 it struck one of the century’s biggest oil discoveries.' },
      { image: px(87236), heading: '2014', text: 'The Lava Jato scandal, about $3 billion in bribes, crashed the stock.' },
      { image: px(730564), heading: 'The comeback', text: 'It rebuilt into one of the market’s biggest dividend payers.' },
      { image: px(3855962), heading: 'Today', text: 'A giant with world-class assets, and permanent political risk.' },
    ],
  },
  'the-story-of-vale': {
    slug: 'the-story-of-vale',
    title: 'The Story of Vale',
    publisher: 'Stock Market ROI',
    articleSlug: 'vale-complete-history-1942-2026-iron-ore-giant-china-brumadinho-vale',
    slides: [
      { image: px(1078884), heading: 'The Story of Vale', text: 'From a state miner to a global iron ore giant, and a national tragedy.' },
      { image: px(1078884), heading: '1942', text: 'Brazil created Vale to mine the iron ore of Minas Gerais.' },
      { image: px(2760243), heading: 'The China boom', text: 'China’s hunger for steel made Vale the world’s top iron ore producer.' },
      { image: px(1078884), heading: '2019', text: 'The Brumadinho dam collapse killed 270 people, Brazil’s worst accident.' },
      { image: px(730564), heading: 'Today', text: 'A cyclical, high-dividend mining giant still repairing its reputation.' },
    ],
  },
  'the-story-of-bitcoin': {
    slug: 'the-story-of-bitcoin',
    title: 'The Story of Bitcoin',
    publisher: 'Stock Market ROI',
    articleSlug: 'bitcoin-complete-history-2008-2026-whitepaper-to-today',
    slides: [
      { image: px(730564), heading: 'The Story of Bitcoin', text: 'From a 9-page whitepaper to a $2 trillion revolution.' },
      { image: px(8370752), heading: '2008', text: 'Satoshi Nakamoto proposed money no bank or government could control.' },
      { image: px(8370752), heading: '2010', text: 'Someone paid 10,000 BTC for two pizzas.' },
      { image: px(6801648), heading: 'Boom and bust', text: 'From Mt. Gox to FTX, it has been declared dead hundreds of times.' },
      { image: px(730564), heading: '2024', text: 'Spot ETFs pushed it past $100,000.' },
      { image: px(8370752), heading: 'Today', text: 'The asset that started a financial revolution.' },
    ],
  },
  'the-story-of-ethereum': {
    slug: 'the-story-of-ethereum',
    title: 'The Story of Ethereum',
    publisher: 'Stock Market ROI',
    articleSlug: 'ethereum-complete-history-2013-2026-vitalik-buterin-world-computer',
    slides: [
      { image: px(843700), heading: 'The Story of Ethereum', text: 'From a teenager’s whitepaper to the “world computer.”' },
      { image: px(843700), heading: '2013', text: 'Vitalik Buterin, 19, imagined a blockchain that runs any program.' },
      { image: px(8370752), heading: 'Smart contracts', text: 'Code that executes itself, with no bank or court needed.' },
      { image: px(6801648), heading: 'The DAO hack', text: 'A 2016 hack split it from Ethereum Classic.' },
      { image: px(8566472), heading: 'The Merge', text: 'In 2022 it cut its energy use by more than 99%.' },
      { image: px(843700), heading: 'Today', text: 'The backbone of DeFi, NFTs and most of modern crypto.' },
    ],
  },
  'the-story-of-banco-master': {
    slug: 'the-story-of-banco-master',
    title: 'The Story of Banco Master',
    publisher: 'Stock Market ROI',
    articleSlug: 'banco-master-complete-story-rise-fall-vorcaro-brazil-biggest-bank-fraud',
    slides: [
      { image: px(259027), heading: 'The Story of Banco Master', text: 'How a small bank became Brazil’s biggest fraud.' },
      { image: px(259027), heading: 'The promise', text: 'Savings paying up to 140% of the benchmark rate, backed by a guarantee.' },
      { image: px(4386370), heading: '1.6 million savers', text: 'Sold through slick apps, the money poured in.' },
      { image: px(259027), heading: 'The rot', text: 'Fake loans and risky bets funded the sky-high returns.' },
      { image: px(4386370), heading: 'November 2025', text: 'Its founder was arrested at the airport, fleeing on a private jet.' },
      { image: px(259027), heading: 'The fallout', text: 'A R$41 billion hole, the largest bank fraud in Brazil’s history.' },
    ],
  },
  'morgan-stanley-brazil-2026': {
    slug: 'morgan-stanley-brazil-2026',
    title: 'Wall Street Bets on Brazil',
    publisher: 'Stock Market ROI',
    articleSlug: 'morgan-stanley-overweight-brazil-stocks-2026-election-ibovespa-ewz',
    slides: [
      { image: px(16010153), heading: 'Wall Street Bets on Brazil', text: 'Morgan Stanley just turned bullish on Brazilian stocks.' },
      { image: px(12903168), heading: 'The call', text: 'It raised Brazil to “overweight,” its most constructive rating.' },
      { image: px(6801648), heading: 'The target', text: 'Base case: the Ibovespa at 240,000, about +31% in reais by mid-2027.' },
      { image: px(5849557), heading: 'Why now', text: 'Falling interest rates could channel tens of billions into local stocks.' },
      { image: px(7412095), heading: 'The swing', text: 'One event decides it all: the October 4, 2026 election.' },
      { image: px(210607), heading: 'The catch', text: 'The same setup carries a bear case, a drop of about 42%.' },
    ],
  },
  'apple-stock-rally-2026': {
    slug: 'apple-stock-rally-2026',
    title: 'Why Apple Stock Is Near a Record High',
    publisher: 'Stock Market ROI',
    articleSlug: 'apple-aapl-stock-rally-record-high-iphone-services-2026',
    slides: [
      { image: px(788946), heading: 'Apple Near a Record High', text: 'AAPL is back near its all-time high, around $338.' },
      { image: px(6801648), heading: 'The rally', text: 'Up more than 20% in three months, and about 42% in a year.' },
      { image: px(1294886), heading: 'The engine', text: 'Strong iPhone 17 demand reassured a nervous market.' },
      { image: px(205421), heading: 'The other engine', text: 'Services keeps compounding in the mid-teens: high-margin and sticky.' },
      { image: px(12903168), heading: 'The proof', text: 'Nine straight earnings beats, and a smooth handoff to a new CEO.' },
      { image: px(210607), heading: 'The catch', text: 'Near records at about $5 trillion, a lot of good news is already priced in.' },
    ],
  },
  'yields-vs-stocks-2026': {
    slug: 'yields-vs-stocks-2026',
    title: 'Yields Hit a 2007 High. Stocks Won’t Break.',
    publisher: 'Stock Market ROI',
    articleSlug: 'stock-market-today-september-24-2026-yields-2007-high-stocks-resilient',
    slides: [
      { image: px(6120214), heading: 'Yields Hit a 2007 High', text: 'The 10-year Treasury yield is near 5.18%, the highest since 2007.' },
      { image: px(6801648), heading: 'But stocks won’t break', text: 'The S&P, Nasdaq and Dow are all holding near record highs.' },
      { image: px(12903168), heading: 'Why yields are rising', text: 'Hotter inflation has markets bracing for the Fed, not rate cuts.' },
      { image: px(534216), heading: 'Why stocks hold', text: 'Resilient earnings, the AI boom, and a fear gauge under 15.' },
      { image: px(210607), heading: 'The tension', text: 'Both signals cannot be right forever. Something has to give.' },
      { image: px(6120214), heading: 'What to watch', text: 'The 10-year yield is the tell for the market’s next big move.' },
    ],
  },
  'aave-tokenization-2026': {
    slug: 'aave-tokenization-2026',
    title: 'Aave: DeFi’s Bridge to Wall Street',
    publisher: 'Stock Market ROI',
    articleSlug: 'aave-rwa-tokenization-defi-lending-institutional-adoption-2026',
    slides: [
      { image: px(8369648), heading: 'DeFi’s Biggest Bank Meets Wall Street', text: 'Aave is bridging crypto lending to tokenized real-world assets.' },
      { image: px(6801648), heading: 'A bank with no bank', text: 'Aave has originated over $1 trillion in loans, with no branch or banker.' },
      { image: px(12903168), heading: 'Tokenization is here', text: 'Over $32 billion of real-world assets now live on-chain, led by BlackRock.' },
      { image: px(205421), heading: 'Horizon: the bridge', text: 'Aave’s institutional platform lets funds borrow against tokenized Treasuries.' },
      { image: px(6120214), heading: 'The big bet', text: 'Aave wants to be the credit layer of a tokenized Wall Street.' },
      { image: px(730547), heading: 'The catch', text: 'It is still early: adoption is tiny versus TradFi, and regulation sets the pace.' },
    ],
  },
}
