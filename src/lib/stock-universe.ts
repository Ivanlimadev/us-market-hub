export const STOCK_UNIVERSE: Record<string, string[]> = {
  Technology: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AVGO', 'AMD', 'CRM', 'ORCL', 'INTC', 'QCOM', 'TXN', 'NOW', 'ADBE', 'AMAT'],
  'Communication Services': ['NFLX', 'DIS', 'T', 'VZ', 'CMCSA', 'SPOT', 'ROKU', 'WBD'],
  'Consumer Discretionary': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX', 'LOW', 'TGT', 'BKNG', 'GM', 'F'],
  'Consumer Staples': ['PG', 'KO', 'PEP', 'WMT', 'COST', 'CL', 'MO', 'PM', 'KHC', 'GIS'],
  Healthcare: ['UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'TMO', 'ABT', 'PFE', 'AMGN', 'BMY'],
  Financials: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA', 'AXP', 'BLK', 'C'],
  Energy: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PSX', 'OXY', 'DVN'],
  Industrials: ['GE', 'CAT', 'HON', 'UPS', 'BA', 'RTX', 'DE', 'MMM', 'LMT', 'NOC'],
  'Real Estate': ['PLD', 'AMT', 'EQIX', 'O', 'VICI', 'SPG', 'CCI', 'PSA'],
  Utilities: ['NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'XEL', 'SRE'],
  Materials: ['LIN', 'APD', 'ECL', 'NEM', 'FCX', 'NUE', 'ALB', 'PPG'],
}

export const STOCK_NAMES: Record<string, string> = {
  // Technology
  AAPL: 'Apple', MSFT: 'Microsoft', NVDA: 'Nvidia', GOOGL: 'Alphabet',
  META: 'Meta Platforms', AVGO: 'Broadcom', AMD: 'AMD', CRM: 'Salesforce',
  ORCL: 'Oracle', INTC: 'Intel', QCOM: 'Qualcomm', TXN: 'Texas Instruments',
  NOW: 'ServiceNow', ADBE: 'Adobe', AMAT: 'Applied Materials',
  // Communication Services
  NFLX: 'Netflix', DIS: 'Disney', T: 'AT&T', VZ: 'Verizon',
  CMCSA: 'Comcast', SPOT: 'Spotify', ROKU: 'Roku', WBD: 'Warner Bros. Discovery',
  // Consumer Discretionary
  AMZN: 'Amazon', TSLA: 'Tesla', HD: 'Home Depot', MCD: "McDonald's",
  NKE: 'Nike', SBUX: 'Starbucks', LOW: "Lowe's", TGT: 'Target',
  BKNG: 'Booking Holdings', GM: 'General Motors', F: 'Ford Motor',
  // Consumer Staples
  PG: 'Procter & Gamble', KO: 'Coca-Cola', PEP: 'PepsiCo', WMT: 'Walmart',
  COST: 'Costco', CL: 'Colgate-Palmolive', MO: 'Altria', PM: 'Philip Morris',
  KHC: 'Kraft Heinz', GIS: 'General Mills',
  // Healthcare
  UNH: 'UnitedHealth', JNJ: 'Johnson & Johnson', LLY: 'Eli Lilly', ABBV: 'AbbVie',
  MRK: 'Merck', TMO: 'Thermo Fisher', ABT: 'Abbott Labs', PFE: 'Pfizer',
  AMGN: 'Amgen', BMY: 'Bristol-Myers Squibb',
  // Financials
  JPM: 'JPMorgan Chase', BAC: 'Bank of America', WFC: 'Wells Fargo',
  GS: 'Goldman Sachs', MS: 'Morgan Stanley', V: 'Visa', MA: 'Mastercard',
  AXP: 'American Express', BLK: 'BlackRock', C: 'Citigroup',
  // Energy
  XOM: 'ExxonMobil', CVX: 'Chevron', COP: 'ConocoPhillips', SLB: 'SLB',
  EOG: 'EOG Resources', PSX: 'Phillips 66', OXY: 'Occidental', DVN: 'Devon Energy',
  // Industrials
  GE: 'GE Aerospace', CAT: 'Caterpillar', HON: 'Honeywell', UPS: 'UPS',
  BA: 'Boeing', RTX: 'RTX Corp', DE: 'Deere & Co', MMM: '3M',
  LMT: 'Lockheed Martin', NOC: 'Northrop Grumman',
  // Real Estate
  PLD: 'Prologis', AMT: 'American Tower', EQIX: 'Equinix', O: 'Realty Income',
  VICI: 'VICI Properties', SPG: 'Simon Property', CCI: 'Crown Castle', PSA: 'Public Storage',
  // Utilities
  NEE: 'NextEra Energy', DUK: 'Duke Energy', SO: 'Southern Company',
  D: 'Dominion Energy', AEP: 'AEP', EXC: 'Exelon', XEL: 'Xcel Energy', SRE: 'Sempra',
  // Materials
  LIN: 'Linde', APD: 'Air Products', ECL: 'Ecolab', NEM: 'Newmont',
  FCX: 'Freeport-McMoRan', NUE: 'Nucor', ALB: 'Albemarle', PPG: 'PPG Industries',
}

export const UNIVERSE_FLAT = Object.entries(STOCK_UNIVERSE).flatMap(([sector, symbols]) =>
  symbols.map(sym => ({ symbol: sym, name: STOCK_NAMES[sym] ?? sym, sector }))
)

export const SECTORS = Object.keys(STOCK_UNIVERSE)

export const ALL_SYMBOLS = Object.values(STOCK_UNIVERSE).flat()

export function getSector(symbol: string): string | null {
  for (const [sector, syms] of Object.entries(STOCK_UNIVERSE)) {
    if (syms.includes(symbol)) return sector
  }
  return null
}
