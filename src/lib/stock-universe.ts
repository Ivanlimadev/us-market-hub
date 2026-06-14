export const STOCK_UNIVERSE: Record<string, string[]> = {
  Technology: [
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AVGO', 'AMD', 'CRM', 'ORCL', 'INTC',
    'QCOM', 'TXN', 'NOW', 'ADBE', 'AMAT', 'CSCO', 'IBM', 'INTU', 'MU', 'KLAC',
    'LRCX', 'MRVL', 'PLTR', 'SNOW', 'PANW', 'CRWD', 'DDOG', 'NET', 'FTNT', 'ZS',
    'PYPL', 'ACN', 'DELL', 'HPQ', 'UBER', 'COIN', 'HOOD', 'SHOP', 'SQ', 'TTD',
  ],
  'Communication Services': [
    'NFLX', 'DIS', 'T', 'VZ', 'CMCSA', 'SPOT', 'ROKU', 'WBD',
    'SNAP', 'PINS', 'EA', 'TTWO', 'PARA', 'MTCH', 'LYV',
  ],
  'Consumer Discretionary': [
    'AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX', 'LOW', 'TGT', 'BKNG', 'GM', 'F',
    'ABNB', 'DASH', 'EXPE', 'ETSY', 'EBAY', 'CMG', 'YUM', 'DPZ', 'MAR', 'HLT',
    'RIVN', 'LCID', 'MGM', 'LVS', 'RH', 'BBY',
  ],
  'Consumer Staples': [
    'PG', 'KO', 'PEP', 'WMT', 'COST', 'CL', 'MO', 'PM', 'KHC', 'GIS',
    'MDLZ', 'SYY', 'HSY', 'CHD', 'CAG', 'STZ', 'TAP',
  ],
  Healthcare: [
    'UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'TMO', 'ABT', 'PFE', 'AMGN', 'BMY',
    'CVS', 'GILD', 'REGN', 'VRTX', 'ISRG', 'MDT', 'SYK', 'CI', 'ELV', 'MRNA',
    'BSX', 'HCA', 'HUM', 'DXCM', 'DHR', 'IQV', 'ZBH', 'BIIB',
  ],
  Financials: [
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA', 'AXP', 'BLK', 'C',
    'SCHW', 'USB', 'COF', 'PNC', 'TFC', 'MMC', 'CB', 'MET', 'PRU', 'AFL',
    'SPGI', 'MCO', 'ICE', 'CME', 'BK', 'STT', 'FITB', 'RF', 'KEY',
  ],
  Energy: [
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PSX', 'OXY', 'DVN',
    'MPC', 'VLO', 'HAL', 'BKR', 'FANG', 'HES', 'APA', 'MRO',
  ],
  Industrials: [
    'GE', 'CAT', 'HON', 'UPS', 'BA', 'RTX', 'DE', 'MMM', 'LMT', 'NOC',
    'FDX', 'CSX', 'UNP', 'NSC', 'CARR', 'OTIS', 'EMR', 'ITW', 'GD', 'PCAR',
    'ETN', 'PH', 'ROK', 'XYL', 'IR',
  ],
  'Real Estate': [
    'PLD', 'AMT', 'EQIX', 'O', 'VICI', 'SPG', 'CCI', 'PSA',
    'AVB', 'EQR', 'WELL', 'WY', 'DLR', 'ARE', 'VTR',
  ],
  Utilities: [
    'NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'XEL', 'SRE',
    'AWK', 'ES', 'WEC', 'ETR', 'PPL', 'EIX',
  ],
  Materials: [
    'LIN', 'APD', 'ECL', 'NEM', 'FCX', 'NUE', 'ALB', 'PPG',
    'DOW', 'DD', 'IFF', 'CE', 'CF', 'MOS', 'BALL',
  ],
  ETFs: [
    'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'ARKK', 'GLD', 'SLV',
    'XLK', 'XLF', 'XLE', 'XLV', 'XLI', 'XLP', 'XLU', 'XLB', 'XLRE',
    'SOXX', 'VNQ', 'HYG', 'TLT', 'IAU', 'USO', 'SOXL', 'TQQQ',
  ],
}

export const STOCK_NAMES: Record<string, string> = {
  // Technology
  AAPL: 'Apple', MSFT: 'Microsoft', NVDA: 'Nvidia', GOOGL: 'Alphabet',
  META: 'Meta Platforms', AVGO: 'Broadcom', AMD: 'AMD', CRM: 'Salesforce',
  ORCL: 'Oracle', INTC: 'Intel', QCOM: 'Qualcomm', TXN: 'Texas Instruments',
  NOW: 'ServiceNow', ADBE: 'Adobe', AMAT: 'Applied Materials',
  CSCO: 'Cisco', IBM: 'IBM', INTU: 'Intuit', MU: 'Micron Technology',
  KLAC: 'KLA Corp', LRCX: 'Lam Research', MRVL: 'Marvell Technology',
  PLTR: 'Palantir', SNOW: 'Snowflake', PANW: 'Palo Alto Networks',
  CRWD: 'CrowdStrike', DDOG: 'Datadog', NET: 'Cloudflare', FTNT: 'Fortinet',
  ZS: 'Zscaler', PYPL: 'PayPal', ACN: 'Accenture', DELL: 'Dell Technologies',
  HPQ: 'HP Inc', UBER: 'Uber', COIN: 'Coinbase', HOOD: 'Robinhood',
  SHOP: 'Shopify', SQ: 'Block', TTD: 'The Trade Desk',
  // Communication Services
  NFLX: 'Netflix', DIS: 'Disney', T: 'AT&T', VZ: 'Verizon',
  CMCSA: 'Comcast', SPOT: 'Spotify', ROKU: 'Roku', WBD: 'Warner Bros. Discovery',
  SNAP: 'Snap', PINS: 'Pinterest', EA: 'Electronic Arts', TTWO: 'Take-Two Interactive',
  PARA: 'Paramount Global', MTCH: 'Match Group', LYV: 'Live Nation',
  // Consumer Discretionary
  AMZN: 'Amazon', TSLA: 'Tesla', HD: 'Home Depot', MCD: "McDonald's",
  NKE: 'Nike', SBUX: 'Starbucks', LOW: "Lowe's", TGT: 'Target',
  BKNG: 'Booking Holdings', GM: 'General Motors', F: 'Ford Motor',
  ABNB: 'Airbnb', DASH: 'DoorDash', EXPE: 'Expedia', ETSY: 'Etsy',
  EBAY: 'eBay', CMG: 'Chipotle', YUM: 'Yum Brands', DPZ: "Domino's",
  MAR: 'Marriott', HLT: 'Hilton', RIVN: 'Rivian', LCID: 'Lucid Motors',
  MGM: 'MGM Resorts', LVS: 'Las Vegas Sands', RH: 'RH', BBY: 'Best Buy',
  // Consumer Staples
  PG: 'Procter & Gamble', KO: 'Coca-Cola', PEP: 'PepsiCo', WMT: 'Walmart',
  COST: 'Costco', CL: 'Colgate-Palmolive', MO: 'Altria', PM: 'Philip Morris',
  KHC: 'Kraft Heinz', GIS: 'General Mills', MDLZ: 'Mondelez', SYY: 'Sysco',
  HSY: 'Hershey', CHD: 'Church & Dwight', CAG: 'ConAgra', STZ: 'Constellation Brands',
  TAP: 'Molson Coors',
  // Healthcare
  UNH: 'UnitedHealth', JNJ: 'Johnson & Johnson', LLY: 'Eli Lilly', ABBV: 'AbbVie',
  MRK: 'Merck', TMO: 'Thermo Fisher', ABT: 'Abbott Labs', PFE: 'Pfizer',
  AMGN: 'Amgen', BMY: 'Bristol-Myers Squibb', CVS: 'CVS Health',
  GILD: 'Gilead Sciences', REGN: 'Regeneron', VRTX: 'Vertex Pharmaceuticals',
  ISRG: 'Intuitive Surgical', MDT: 'Medtronic', SYK: 'Stryker', CI: 'Cigna',
  ELV: 'Elevance Health', MRNA: 'Moderna', BSX: 'Boston Scientific',
  HCA: 'HCA Healthcare', HUM: 'Humana', DXCM: 'Dexcom', DHR: 'Danaher',
  IQV: 'IQVIA', ZBH: 'Zimmer Biomet', BIIB: 'Biogen',
  // Financials
  JPM: 'JPMorgan Chase', BAC: 'Bank of America', WFC: 'Wells Fargo',
  GS: 'Goldman Sachs', MS: 'Morgan Stanley', V: 'Visa', MA: 'Mastercard',
  AXP: 'American Express', BLK: 'BlackRock', C: 'Citigroup',
  SCHW: 'Charles Schwab', USB: 'US Bancorp', COF: 'Capital One',
  PNC: 'PNC Financial', TFC: 'Truist Financial', MMC: 'Marsh & McLennan',
  CB: 'Chubb', MET: 'MetLife', PRU: 'Prudential', AFL: 'Aflac',
  SPGI: 'S&P Global', MCO: "Moody's", ICE: 'Intercontinental Exchange',
  CME: 'CME Group', BK: 'BNY Mellon', STT: 'State Street',
  FITB: 'Fifth Third Bancorp', RF: 'Regions Financial', KEY: 'KeyCorp',
  // Energy
  XOM: 'ExxonMobil', CVX: 'Chevron', COP: 'ConocoPhillips', SLB: 'SLB',
  EOG: 'EOG Resources', PSX: 'Phillips 66', OXY: 'Occidental', DVN: 'Devon Energy',
  MPC: 'Marathon Petroleum', VLO: 'Valero Energy', HAL: 'Halliburton',
  BKR: 'Baker Hughes', FANG: 'Diamondback Energy', HES: 'Hess', APA: 'APA Corp',
  MRO: 'Marathon Oil',
  // Industrials
  GE: 'GE Aerospace', CAT: 'Caterpillar', HON: 'Honeywell', UPS: 'UPS',
  BA: 'Boeing', RTX: 'RTX Corp', DE: 'Deere & Co', MMM: '3M',
  LMT: 'Lockheed Martin', NOC: 'Northrop Grumman', FDX: 'FedEx',
  CSX: 'CSX Corp', UNP: 'Union Pacific', NSC: 'Norfolk Southern',
  CARR: 'Carrier Global', OTIS: 'Otis Worldwide', EMR: 'Emerson Electric',
  ITW: 'Illinois Tool Works', GD: 'General Dynamics', PCAR: 'PACCAR',
  ETN: 'Eaton', PH: 'Parker Hannifin', ROK: 'Rockwell Automation',
  XYL: 'Xylem', IR: 'Ingersoll Rand',
  // Real Estate
  PLD: 'Prologis', AMT: 'American Tower', EQIX: 'Equinix', O: 'Realty Income',
  VICI: 'VICI Properties', SPG: 'Simon Property', CCI: 'Crown Castle', PSA: 'Public Storage',
  AVB: 'AvalonBay Communities', EQR: 'Equity Residential', WELL: 'Welltower',
  WY: 'Weyerhaeuser', DLR: 'Digital Realty', ARE: 'Alexandria Real Estate', VTR: 'Ventas',
  // Utilities
  NEE: 'NextEra Energy', DUK: 'Duke Energy', SO: 'Southern Company',
  D: 'Dominion Energy', AEP: 'AEP', EXC: 'Exelon', XEL: 'Xcel Energy', SRE: 'Sempra',
  AWK: 'American Water Works', ES: 'Eversource Energy', WEC: 'WEC Energy',
  ETR: 'Entergy', PPL: 'PPL Corp', EIX: 'Edison International',
  // Materials
  LIN: 'Linde', APD: 'Air Products', ECL: 'Ecolab', NEM: 'Newmont',
  FCX: 'Freeport-McMoRan', NUE: 'Nucor', ALB: 'Albemarle', PPG: 'PPG Industries',
  DOW: 'Dow Inc', DD: 'DuPont', IFF: 'IFF', CE: 'Celanese',
  CF: 'CF Industries', MOS: 'Mosaic', BALL: 'Ball Corp',
  // ETFs
  SPY: 'SPDR S&P 500 ETF', QQQ: 'Invesco QQQ (Nasdaq-100)', IWM: 'iShares Russell 2000',
  DIA: 'SPDR Dow Jones ETF', VTI: 'Vanguard Total Market ETF', VOO: 'Vanguard S&P 500 ETF',
  ARKK: 'ARK Innovation ETF', GLD: 'SPDR Gold Shares', SLV: 'iShares Silver Trust',
  XLK: 'Technology Select SPDR', XLF: 'Financial Select SPDR', XLE: 'Energy Select SPDR',
  XLV: 'Health Care Select SPDR', XLI: 'Industrial Select SPDR', XLP: 'Consumer Staples SPDR',
  XLU: 'Utilities Select SPDR', XLB: 'Materials Select SPDR', XLRE: 'Real Estate SPDR',
  SOXX: 'iShares Semiconductor ETF', VNQ: 'Vanguard Real Estate ETF',
  HYG: 'iShares High Yield Bond ETF', TLT: 'iShares 20+ Year Treasury ETF',
  IAU: 'iShares Gold Trust', USO: 'United States Oil Fund',
  SOXL: 'Direxion Semiconductor 3x', TQQQ: 'ProShares Ultra QQQ 3x',
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
