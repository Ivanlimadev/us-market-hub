// Financial-term glossary. Each term is an evergreen, indexable page that also
// serves as an internal-linking hub: it links out to the screener and live stock
// pages, and terms cross-link to each other. Keep content accurate and em-dash-free.

export interface GlossaryTerm {
  slug: string
  term: string
  fullName?: string
  category: 'Valuation' | 'Profitability' | 'Dividends' | 'Size' | 'Risk' | 'Filings'
  short: string            // one-liner: meta description + AEO answer
  definition: string       // main paragraph
  formula?: string
  example: string
  goodValue: string
  goodValueLabel?: string  // heading for the goodValue section (default "What is a good X?"); e.g. "What to look for" for filing types
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
  {
    slug: '10-k',
    term: '10-K',
    fullName: 'Annual Report (Form 10-K)',
    category: 'Filings',
    short: 'A public company\'s comprehensive annual report filed with the SEC.',
    definition:
      'The 10-K is the single most important document a public company files each year. It is a detailed annual report submitted to the SEC covering the business, its risk factors, management\'s discussion of results, and full audited financial statements. If you read only one filing on a company, read its 10-K.',
    example:
      'Apple\'s 10-K breaks out revenue by product (iPhone, Services, Mac), lists its risk factors, and includes audited financials for the fiscal year.',
    goodValueLabel: 'What to look for',
    goodValue:
      'Focus on three parts: the Risk Factors (what could go wrong), Management\'s Discussion and Analysis (how management explains the numbers), and the financial statements (the actual results). Comparing this year\'s wording to last year\'s often reveals changes in tone before they show up in the price.',
    related: ['10-q', '8-k', 'sec-edgar', 'eps'],
    tool: { href: '/stocks/aapl', label: 'See real SEC filings on a stock page' },
  },
  {
    slug: '10-q',
    term: '10-Q',
    fullName: 'Quarterly Report (Form 10-Q)',
    category: 'Filings',
    short: 'A public company\'s quarterly financial report filed with the SEC.',
    definition:
      'The 10-Q is the quarterly version of the 10-K. Filed three times a year (the fourth quarter is folded into the annual 10-K), it gives an updated but unaudited look at a company\'s financials and any material changes since the last report. It is how investors track a company between annual reports.',
    example:
      'A retailer\'s second-quarter 10-Q shows whether sales held up over the summer and updates its outlook for the rest of the year.',
    goodValueLabel: 'What to look for',
    goodValue:
      'Watch the trend versus the prior quarter and the same quarter a year earlier, plus any updated guidance or new risk disclosures. Because a 10-Q is unaudited, treat surprising figures with a little caution until the annual 10-K confirms them.',
    related: ['10-k', '8-k', 'eps'],
    tool: { href: '/stocks/aapl', label: 'See real SEC filings on a stock page' },
  },
  {
    slug: '8-k',
    term: '8-K',
    fullName: 'Current Report (Form 8-K)',
    category: 'Filings',
    short: 'The filing companies use to announce major events between quarterly reports.',
    definition:
      'An 8-K is the SEC\'s way of keeping investors informed about material events as they happen, instead of waiting for the next quarterly report. Companies file one for things like earnings releases, executive changes, acquisitions or other significant news. It is the fastest official signal that something important just happened.',
    example:
      'When a company hires a new CEO or agrees to a merger, it files an 8-K within a few business days.',
    goodValueLabel: 'Why it matters',
    goodValue:
      '8-Ks are where market-moving news often appears first in official form. Following a company\'s 8-K filings can tip you off to earnings, leadership changes or deals before the story is fully digested by the market.',
    related: ['10-k', '10-q', 'form-4'],
    tool: { href: '/stocks/aapl', label: 'See real SEC filings on a stock page' },
  },
  {
    slug: 'form-4',
    term: 'Form 4',
    fullName: 'Insider Trading Report (Form 4)',
    category: 'Filings',
    short: 'The filing that discloses when company insiders buy or sell their own stock.',
    definition:
      'A Form 4 is filed with the SEC when a company insider, such as an executive or director, buys or sells shares of their own company. It must be filed within two business days of the trade. Investors watch these closely because insiders know their business better than anyone, so their buying and selling can be a meaningful signal.',
    example:
      'If a CEO buys $1 million of their own stock and files a Form 4, many investors read it as a vote of confidence.',
    goodValueLabel: 'How to read it',
    goodValue:
      'Insider buying is generally a stronger signal than selling, since insiders sell for many reasons (taxes, diversification) but usually buy for only one: they expect the stock to rise. Look for clusters of buying by several insiders, which is far more meaningful than a single trade.',
    related: ['8-k', '10-k', 'sec-edgar'],
    tool: { href: '/stocks/aapl', label: 'See insider transactions on a stock page' },
  },
  {
    slug: 'sec-edgar',
    term: 'SEC EDGAR',
    fullName: 'SEC EDGAR Database',
    category: 'Filings',
    short: 'The SEC\'s free public database of every filing US public companies submit.',
    definition:
      'EDGAR (Electronic Data Gathering, Analysis, and Retrieval) is the US Securities and Exchange Commission\'s official system where every public company\'s filings are stored and made freely available. Every 10-K, 10-Q, 8-K and Form 4 lives in EDGAR, making it the primary source of truth for company disclosures.',
    example:
      'Searching a company\'s name on SEC EDGAR pulls up its complete filing history, from annual reports to insider trades.',
    goodValueLabel: 'How to use it',
    goodValue:
      'EDGAR is comprehensive but not user-friendly. The fastest approach is to know which form you want (10-K for the annual picture, 8-K for breaking news, Form 4 for insider trades) and search by company. Or skip the raw database and read the key filings already surfaced on each company\'s stock page.',
    related: ['10-k', '10-q', '8-k', 'form-4'],
    tool: { href: '/stocks/aapl', label: 'See SEC filings on a stock page' },
  },
]

export const GLOSSARY_CATEGORIES: GlossaryTerm['category'][] = [
  'Valuation',
  'Profitability',
  'Dividends',
  'Size',
  'Risk',
  'Filings',
]

export const GLOSSARY_SLUGS = GLOSSARY.map((t) => t.slug)

export function getTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug)
}
