// Financial-term glossary. Each term is an evergreen, indexable page that also
// serves as an internal-linking hub: it links out to the screener and live stock
// pages, and terms cross-link to each other. Keep content accurate and em-dash-free.

export interface GlossaryTerm {
  slug: string
  term: string
  fullName?: string
  category: 'Valuation' | 'Profitability' | 'Dividends' | 'Size' | 'Risk'
  short: string            // one-liner: meta description + AEO answer
  definition: string       // main paragraph
  formula?: string
  example: string
  goodValue: string
  related: string[]        // slugs of related terms
  tool: { href: string; label: string }
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: 'pe-ratio',
    term: 'P/E Ratio',
    fullName: 'Price-to-Earnings Ratio',
    category: 'Valuation',
    short: 'How much investors pay for each $1 of a company\'s annual earnings.',
    definition:
      'The P/E ratio compares a company\'s share price to its earnings per share. It tells you how many years of current profit you are paying for when you buy the stock. A high P/E can mean the market expects strong growth, or that the stock is overvalued. A low P/E can signal a bargain, or a struggling business.',
    formula: 'P/E = Share Price ÷ Earnings Per Share (EPS)',
    example:
      'If a stock trades at $100 and earned $5 per share last year, its P/E is 20. You are paying $20 for every $1 of annual earnings.',
    goodValue:
      'There is no universal good P/E; it depends on the sector. The S&P 500 has historically averaged around 15 to 20. Fast-growing tech names often trade above 30, while mature value stocks may sit below 15. Always compare a P/E to industry peers, not across sectors.',
    related: ['eps', 'peg-ratio', 'pb-ratio', 'ps-ratio'],
    tool: { href: '/screener', label: 'Screen stocks by P/E' },
  },
  {
    slug: 'eps',
    term: 'EPS',
    fullName: 'Earnings Per Share',
    category: 'Profitability',
    short: 'A company\'s net profit divided by its number of shares.',
    definition:
      'EPS shows how much profit a company generates for each outstanding share. It is the E in the P/E ratio and one of the most-watched numbers each earnings season, because rising EPS usually drives a rising share price over time.',
    formula: 'EPS = Net Income ÷ Shares Outstanding',
    example: 'A company earning $1 billion with 500 million shares has an EPS of $2.00.',
    goodValue:
      'Higher and consistently growing EPS is better. Watch whether the growth comes from real profit or from share buybacks, which shrink the share count and lift EPS artificially.',
    related: ['pe-ratio', 'roe', 'peg-ratio'],
    tool: { href: '/screener', label: 'Find stocks with growing EPS' },
  },
  {
    slug: 'pb-ratio',
    term: 'P/B Ratio',
    fullName: 'Price-to-Book Ratio',
    category: 'Valuation',
    short: 'Share price compared to the company\'s net asset (book) value per share.',
    definition:
      'The P/B ratio measures a stock\'s market price against its book value, which is the value of its assets minus liabilities. It is especially useful for asset-heavy businesses like banks and insurers.',
    formula: 'P/B = Share Price ÷ Book Value Per Share',
    example: 'A bank trading at $50 with a book value of $40 per share has a P/B of 1.25.',
    goodValue:
      'A P/B under 1 can indicate an undervalued stock, or a troubled one. Value investors often look below 1.5, but capital-light tech companies routinely trade far higher because their value is not on the balance sheet.',
    related: ['pe-ratio', 'roe', 'market-cap'],
    tool: { href: '/screener', label: 'Screen stocks by P/B' },
  },
  {
    slug: 'peg-ratio',
    term: 'PEG Ratio',
    fullName: 'Price/Earnings-to-Growth Ratio',
    category: 'Valuation',
    short: 'The P/E ratio adjusted for a company\'s earnings growth rate.',
    definition:
      'The PEG ratio refines the P/E by factoring in how fast earnings are growing. It helps you compare a cheap but slow company to an expensive but fast one on a level playing field.',
    formula: 'PEG = P/E Ratio ÷ Annual EPS Growth Rate (%)',
    example: 'A stock with a P/E of 30 growing earnings at 30% a year has a PEG of 1.0.',
    goodValue:
      'A PEG around 1.0 is often considered fairly valued. Below 1.0 may be undervalued relative to growth; above 2.0 can look expensive. It relies on growth estimates, so treat it as a guide, not gospel.',
    related: ['pe-ratio', 'eps'],
    tool: { href: '/screener', label: 'Find undervalued growth stocks' },
  },
  {
    slug: 'dividend-yield',
    term: 'Dividend Yield',
    category: 'Dividends',
    short: 'A stock\'s annual dividend as a percentage of its share price.',
    definition:
      'Dividend yield tells you the cash income a stock pays relative to its price. It is the headline number for income investors, but a very high yield can be a warning sign that the market expects a dividend cut.',
    formula: 'Dividend Yield = (Annual Dividend Per Share ÷ Share Price) × 100',
    example: 'A $100 stock paying $4 per year in dividends yields 4%.',
    goodValue:
      'Broad-market yields sit around 1 to 2%. Solid dividend payers often yield 2 to 5%. Yields above 8% deserve scrutiny, as they are frequently a sign of a falling price or an unsustainable payout.',
    related: ['eps', 'pe-ratio', 'market-cap'],
    tool: { href: '/screener', label: 'Screen for dividend stocks' },
  },
  {
    slug: 'market-cap',
    term: 'Market Cap',
    fullName: 'Market Capitalization',
    category: 'Size',
    short: 'The total value of a company\'s shares: price times share count.',
    definition:
      'Market cap is the market\'s price tag for the whole company. It is how stocks are sorted into large-cap, mid-cap, and small-cap, and it matters far more than share price alone for understanding a company\'s size.',
    formula: 'Market Cap = Share Price × Shares Outstanding',
    example: 'A company with 1 billion shares at $50 each has a $50 billion market cap.',
    goodValue:
      'This is a size measure, not a good or bad signal. Large-caps (above $10B) are generally more stable; small-caps (below $2B) can grow faster but carry more risk.',
    related: ['pe-ratio', 'eps', 'beta'],
    tool: { href: '/screener', label: 'Screen stocks by market cap' },
  },
  {
    slug: 'roe',
    term: 'ROE',
    fullName: 'Return on Equity',
    category: 'Profitability',
    short: 'How much profit a company generates from shareholders\' equity.',
    definition:
      'ROE measures how efficiently a company turns shareholder money into profit. It is a favorite of quality-focused investors like Warren Buffett, because a consistently high ROE signals a strong, well-run business.',
    formula: 'ROE = Net Income ÷ Shareholders\' Equity',
    example: 'A company earning $200 million on $1 billion of equity has a 20% ROE.',
    goodValue:
      'An ROE of 15 to 20% or more, sustained over years, is generally strong. But watch for high ROE driven by heavy debt, which inflates the ratio while adding risk.',
    related: ['eps', 'pb-ratio'],
    tool: { href: '/screener', label: 'Find high-ROE companies' },
  },
  {
    slug: 'ps-ratio',
    term: 'P/S Ratio',
    fullName: 'Price-to-Sales Ratio',
    category: 'Valuation',
    short: 'A company\'s market cap compared to its annual revenue.',
    definition:
      'The P/S ratio values a company against its sales rather than its profits. It is handy for young or unprofitable companies, like many growth and tech names, that do not yet have meaningful earnings for a P/E.',
    formula: 'P/S = Market Cap ÷ Annual Revenue',
    example: 'A company with a $10 billion market cap and $2 billion in revenue has a P/S of 5.',
    goodValue:
      'Lower is generally cheaper. Many mature companies trade around 1 to 3 times sales; high-growth software can exceed 10 times. Compare within an industry.',
    related: ['pe-ratio', 'market-cap', 'ev-ebitda'],
    tool: { href: '/screener', label: 'Screen stocks by P/S' },
  },
  {
    slug: 'beta',
    term: 'Beta',
    category: 'Risk',
    short: 'How much a stock moves relative to the overall market.',
    definition:
      'Beta measures a stock\'s volatility compared to the market, usually the S&P 500, which has a beta of 1.0. It is a quick gauge of how bumpy a ride to expect.',
    formula: 'Derived by regressing a stock\'s returns against a market index (S&P 500 = 1.0)',
    example:
      'A beta of 1.5 means the stock tends to move 50% more than the market, up and down. A beta of 0.5 means it is half as volatile.',
    goodValue:
      'This is about risk tolerance, not quality. Beta above 1 is more volatile (growth, tech); below 1 is steadier (utilities, staples). It measures volatility, not business quality.',
    related: ['market-cap', 'pe-ratio'],
    tool: { href: '/screener', label: 'Screen stocks by volatility' },
  },
  {
    slug: 'ev-ebitda',
    term: 'EV/EBITDA',
    fullName: 'Enterprise Value to EBITDA',
    category: 'Valuation',
    short: 'A valuation multiple that accounts for debt and cash, comparing total company value to core operating profit.',
    definition:
      'EV/EBITDA is a favorite of analysts because it is capital-structure neutral: it includes debt and strips out non-cash items. That makes it easier to compare companies with different debt loads or tax situations than the P/E ratio.',
    formula: 'EV/EBITDA = Enterprise Value ÷ EBITDA',
    example:
      'A company with an enterprise value of $12 billion and EBITDA of $1 billion has an EV/EBITDA of 12.',
    goodValue:
      'Lower generally means cheaper. Many companies trade around 8 to 12 times; below 8 can signal value, above 15 can signal a premium or high growth. Compare within a sector.',
    related: ['pe-ratio', 'ps-ratio', 'market-cap'],
    tool: { href: '/screener', label: 'Screen stocks by EV/EBITDA' },
  },
]

export const GLOSSARY_CATEGORIES: GlossaryTerm['category'][] = [
  'Valuation',
  'Profitability',
  'Dividends',
  'Size',
  'Risk',
]

export const GLOSSARY_SLUGS = GLOSSARY.map((t) => t.slug)

export function getTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug)
}
