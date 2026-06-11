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

export const SECTORS = Object.keys(STOCK_UNIVERSE)

export const ALL_SYMBOLS = Object.values(STOCK_UNIVERSE).flat()

export function getSector(symbol: string): string | null {
  for (const [sector, syms] of Object.entries(STOCK_UNIVERSE)) {
    if (syms.includes(symbol)) return sector
  }
  return null
}
