import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIp } from '@/lib/rate-limit'

export const revalidate = 3600

const FRED = 'https://api.stlouisfed.org/fred/series/observations'

type Transform = 'raw' | 'mom_diff' | 'mom_pct' | 'yoy' | 'yoy_4'

interface SeriesMeta {
  label: string
  unit: string
  section: string
  direction: 1 | -1
  transform: Transform
  frequency?: string
  postScale?: number
  description: string
}

const SERIES_META: Record<string, SeriesMeta> = {
  FEDFUNDS: {
    label: 'Federal Funds Rate', unit: '%', section: 'fed', direction: -1,
    transform: 'raw',
    description: 'Taxa de juros à qual bancos emprestam reservas uns aos outros overnight. Definida pelo FOMC do Fed. Principal ferramenta de política monetária dos EUA. Afeta diretamente hipotecas, crédito ao consumidor e custo de capital corporativo.',
  },
  UNRATE: {
    label: 'Unemployment Rate', unit: '%', section: 'labor', direction: -1,
    transform: 'raw',
    description: 'Percentual da força de trabalho desempregada e ativamente buscando emprego (U-3). Indicador lagging do ciclo econômico. Fed usa como referência ao lado da inflação no dual mandate. Abaixo de 4% historicamente indica mercado aquecido.',
  },
  U6RATE: {
    label: 'U-6 Underemployment Rate', unit: '%', section: 'labor', direction: -1,
    transform: 'raw',
    description: 'Medida mais ampla de subutilização da mão de obra: inclui desempregados, trabalhadores marginalmente ligados e trabalhadores de meio período que preferem período integral. Tipicamente 4-5pp acima da U-3.',
  },
  PAYEMS: {
    label: 'Nonfarm Payrolls (MoM)', unit: 'K', section: 'labor', direction: 1,
    transform: 'mom_diff',
    description: 'Variação mensal do total de trabalhadores nos EUA (excluindo agropecuária). Divulgado no primeiro sexta-feira de cada mês. +150K/mês é considerado neutro. Abaixo de 0 sinaliza contração. Principal driver de volatilidade no mercado.',
  },
  ICSA: {
    label: 'Initial Jobless Claims', unit: 'K', section: 'labor', direction: -1,
    transform: 'raw',
    description: 'Pedidos semanais de seguro-desemprego. Indicador leading do mercado de trabalho. Divulgado semanalmente. Acima de 300K sinaliza deterioração. Série mais frequente disponível sobre emprego.',
  },
  CPIAUCSL: {
    label: 'CPI Inflation (YoY)', unit: '%', section: 'inflation', direction: -1,
    transform: 'yoy',
    description: 'Índice de Preços ao Consumidor — variação anual. Mede a variação média mensal no preço de bens e serviços. Meta informal do Fed é 2%. Usado para ajuste de TIPS, previdência social e contratos indexados.',
  },
  CPILFESL: {
    label: 'Core CPI (ex Food & Energy)', unit: '%', section: 'inflation', direction: -1,
    transform: 'yoy',
    description: 'CPI excluindo alimentos e energia (componentes voláteis). Considerado medida mais estável da tendência de inflação subjacente. O Fed monitora este indicador mais de perto que o CPI headline.',
  },
  PCEPILFE: {
    label: 'Core PCE (Fed Target)', unit: '%', section: 'inflation', direction: -1,
    transform: 'yoy',
    description: 'Índice de Preços PCE Core — a medida de inflação preferida do Fed. Meta explícita: 2% ao ano. Tende a rodar 0.2-0.3pp abaixo do Core CPI. Principal driver das decisões do FOMC sobre juros.',
  },
  GDPC1: {
    label: 'Real GDP (YoY)', unit: '%', section: 'growth', direction: 1,
    transform: 'yoy_4',
    description: 'Produto Interno Bruto real ajustado por inflação — variação anual. Medida mais abrangente da atividade econômica. Dois trimestres consecutivos negativos definem recessão técnica. Divulgado trimestralmente com revisões.',
  },
  INDPRO: {
    label: 'Industrial Production (MoM)', unit: '%', section: 'growth', direction: 1,
    transform: 'mom_pct',
    description: 'Produção industrial: manufatura, mineração e utilities. Variação mensal. Indicador coincidente do ciclo econômico. Quedas consecutivas sinalizam contração no setor industrial, que precede recessões.',
  },
  RSXFS: {
    label: 'Retail Sales (MoM)', unit: '%', section: 'consumer', direction: 1,
    transform: 'mom_pct',
    description: 'Vendas no varejo — variação mensal. Representa ~70% do PIB americano via consumo das famílias. Indicador leading-coincident da demanda doméstica. Surpresas positivas fortalecem o dólar e pressionam yields.',
  },
  UMCSENT: {
    label: 'Consumer Sentiment', unit: 'pts', section: 'consumer', direction: 1,
    transform: 'raw',
    description: 'Índice de Confiança do Consumidor da Universidade de Michigan. Mede expectativas e condições atuais dos consumidores. Leading indicator: queda antecipa redução nos gastos. Leituras acima de 80 indicam otimismo.',
  },
  PSAVERT: {
    label: 'Personal Savings Rate', unit: '%', section: 'consumer', direction: 1,
    transform: 'raw',
    description: 'Taxa de poupança pessoal como % da renda disponível. Taxa muito baixa (<4%) indica consumo insustentável, aumentando risco de recessão. Pós-COVID disparou para 30%+ e normalizou. Afeta diretamente o consumo futuro.',
  },
  DGS2: {
    label: '2-Year Treasury Yield', unit: '%', section: 'bonds', direction: -1,
    transform: 'raw', frequency: 'm',
    description: 'Yield do título do governo americano de 2 anos. Reflete expectativas de curto prazo para a política do Fed. Sobe quando mercado antecipa altas de juros. Principal referência para spread bancário e custo do crédito corporativo de curto prazo.',
  },
  DGS10: {
    label: '10-Year Treasury Yield', unit: '%', section: 'bonds', direction: -1,
    transform: 'raw', frequency: 'm',
    description: 'Yield do Tesouro americano de 10 anos — benchmark global. Referência para hipotecas 30 anos, dívida corporativa e valuation de ações (taxa de desconto). Movimento reflete inflação esperada + crescimento + prêmio de risco.',
  },
  DGS30: {
    label: '30-Year Treasury Yield', unit: '%', section: 'bonds', direction: -1,
    transform: 'raw', frequency: 'm',
    description: 'Yield do Tesouro de 30 anos. Usado como benchmark por fundos de pensão e seguradoras. Mais sensível a expectativas de inflação de longo prazo. Movimento oposto ao preço do TBond 30A (ativo de hedge em crises).',
  },
  T10Y2Y: {
    label: 'Yield Curve (10Y-2Y)', unit: '%', section: 'bonds', direction: 1,
    transform: 'raw', frequency: 'm',
    description: 'Spread entre yields de 10 e 2 anos. Negativo = inversão da curva = alarme de recessão. Invertida antes de TODAS as recessões americanas desde 1955 com 6-18 meses de antecedência. Atualmente o indicador mais monitorado por analistas macro.',
  },
  HOUST: {
    label: 'Housing Starts', unit: 'K', section: 'housing', direction: 1,
    transform: 'raw',
    description: 'Número de novas unidades habitacionais iniciadas (taxa anual sazonalmente ajustada, em milhares). Leading indicator econômico. Quedas antecipam recessões. Afetado diretamente pelos juros hipotecários (DGS30).',
  },
  M2SL: {
    label: 'M2 Money Supply (YoY)', unit: '%', section: 'money', direction: 1,
    transform: 'yoy',
    description: 'Crescimento anual da oferta monetária M2 (caixa + depósitos + fundos money market). Expansão excessiva (>10% YoY) é inflacionária a médio prazo. Contração (negativa) é historicamente rara e deflacionária — ocorreu em 2022-2023.',
  },

  // ── Financial Markets ────────────────────────────────────────────────────────
  VIXCLS: {
    label: 'VIX — Volatility Index', unit: 'pts', section: 'markets', direction: -1,
    transform: 'raw', frequency: 'm',
    description: 'Índice de Volatilidade CBOE — mede a volatilidade implícita esperada do S&P 500 para os próximos 30 dias, derivada dos preços de opções. Apelidado de "índice do medo". Abaixo de 15 = mercado complacente. Entre 20–30 = stress moderado. Acima de 30 = crise/pânico. Spike repentino é sinal clássico de aversão a risco e capitulação de portfólios.',
  },
  BAMLH0A0HYM2: {
    label: 'High Yield Spread (OAS)', unit: '%', section: 'markets', direction: -1,
    transform: 'raw', frequency: 'm',
    description: 'Option-Adjusted Spread dos títulos corporativos High Yield (junk bonds) sobre Treasuries equivalentes — ICE BofA. Mede o prêmio de risco de crédito do mercado. Abaixo de 3%: ambiente favorável ao crédito. Acima de 5%: stress significativo. Acima de 8%: nível de crise (2008, 2020). Spread em expansão antecede recessões em 6–12 meses.',
  },
  DTWEXBGS: {
    label: 'US Dollar Index', unit: 'idx', section: 'markets', direction: 1,
    transform: 'raw', frequency: 'm',
    description: 'Índice amplo do dólar americano ponderado pelo comércio (Nominal Broad U.S. Dollar Index — proxy do DXY). Alta do dólar aperta condições financeiras globais, pressiona commodities (cotadas em USD), comprime lucros das multinacionais americanas e gera estresse em países emergentes com dívida em USD. Queda favorece exportações e ativos de risco.',
  },
  MORTGAGE30US: {
    label: '30-Year Mortgage Rate', unit: '%', section: 'markets', direction: -1,
    transform: 'raw', frequency: 'm',
    description: 'Taxa média nacional da hipoteca residencial de 30 anos (pesquisa semanal Freddie Mac / Primary Mortgage Market Survey). Fortemente correlacionada com o yield do Treasury de 10 anos + spread de crédito hipotecário. Taxa acima de 7% comprime drasticamente a demanda por imóveis e refinanciamentos. Principal barômetro de acessibilidade imobiliária para famílias americanas.',
  },

  // ── Leading Indicators ───────────────────────────────────────────────────────
  RECPROUSM156N: {
    label: 'NY Fed Recession Probability', unit: '%', section: 'leading', direction: -1,
    transform: 'raw',
    description: 'Probabilidade suavizada de recessão calculada pelo NY Fed usando o spread entre os yields do Treasury de 10 anos e 3 meses. O modelo acertou todas as recessões americanas desde 1960, com antecedência de 6–18 meses. Leituras acima de 30% são historicamente consistentes com recessão iminente. Acima de 50% = recessão quase certa segundo o modelo.',
  },
  PERMIT: {
    label: 'Building Permits', unit: 'K', section: 'leading', direction: 1,
    transform: 'raw',
    description: 'Licenças autorizadas para construção de novas unidades habitacionais (taxa anual sazonalmente ajustada, em milhares). Componente do Leading Economic Index (LEI) do Conference Board. Queda sustentada antecede retração no setor de construção civil, que tem efeito multiplicador sobre materiais de construção, móveis, eletrodomésticos e empregos relacionados. Muito sensível às taxas de hipoteca.',
  },

  // ── Labor Market (extended) ───────────────────────────────────────────────────
  CIVPART: {
    label: 'Labor Force Participation Rate', unit: '%', section: 'labor', direction: 1,
    transform: 'raw',
    description: 'Percentual da população civil com 16+ anos que está empregada ou buscando emprego ativamente. Taxa baixa pode mascarar melhoras artificiais no UNRATE (U-3): pessoas desistem de buscar emprego e saem da força de trabalho. Pico histórico ~67% (2000). Declínio estrutural acelerado pelo envelhecimento. Fed monitora junto com o UNRATE para avaliar o "verdadeiro" estado do mercado de trabalho.',
  },
  JTSJOL: {
    label: 'Job Openings (JOLTS)', unit: 'K', section: 'labor', direction: 1,
    transform: 'raw',
    description: 'Total de vagas de emprego abertas nos EUA ao fim do mês (pesquisa mensal JOLTS do BLS, em milhares). Ratio vagas/desempregados acima de 1.0 indica mercado apertado e poder de barganha dos trabalhadores. Pico histórico: ~12 milhões em 2022. Fed observa esta série como indicador de demanda por trabalho. Queda sustentada antecipa aumento do desemprego com 6–9 meses de defasagem.',
  },
  JTSQUR: {
    label: 'Quits Rate', unit: '%', section: 'labor', direction: 1,
    transform: 'raw',
    description: 'Taxa de demissões voluntárias mensais como percentual do total de trabalhadores (pesquisa JOLTS). Alta taxa de quits (acima de 3%) indica alta confiança dos trabalhadores em conseguir emprego melhor — mercado aquecido. Fed e analistas usam como proxy de pressão salarial: trabalhadores que pedem demissão conseguem aumentos maiores. Queda antecipa desaceleração dos salários e possível resfriamento do PCE.',
  },

  // ── Fiscal Policy ────────────────────────────────────────────────────────────
  WALCL: {
    label: 'Fed Balance Sheet', unit: 'T', section: 'fiscal', direction: 1,
    transform: 'raw', frequency: 'm', postScale: 0.000001,
    description: 'Total de ativos do balanço patrimonial do Federal Reserve em trilhões de dólares. Expande durante QE (Quantitative Easing) via compra de Treasuries e MBS — injeta liquidez no sistema financeiro e suprime os yields. Contrai durante QT (Quantitative Tightening) — remove liquidez e sobe yields. Maior fonte de liquidez sistêmica global. Pico: ~$8.9T (2022). Analistas monitoram a taxa de contração mensal.',
  },
  GFDEGDQ188S: {
    label: 'Federal Debt / GDP', unit: '%', section: 'fiscal', direction: -1,
    transform: 'raw',
    description: 'Dívida federal total dos EUA como percentual do PIB. Acima de 100% do PIB (nível atual >120%) gera preocupações sobre sustentabilidade fiscal. Trajetória crescente implica maior emissão de Treasuries → potencial pressão de alta nos yields → crowding out do setor privado. Analistas monitoram junto com o déficit orçamentário (% GDP) para avaliar o risco soberano dos EUA no longo prazo.',
  },

  // ── Housing (extended) ───────────────────────────────────────────────────────
  CSUSHPISA: {
    label: 'Case-Shiller HPI (YoY)', unit: '%', section: 'housing', direction: 1,
    transform: 'yoy',
    description: 'Variação anual do índice S&P/Case-Shiller de preços de imóveis residenciais nos EUA (cobertura nacional). Alta acima do crescimento da renda aumenta risco de bolha e reduz acessibilidade. Queda sustentada (como 2008–2011: –35%) gera efeito riqueza negativo, stress bancário via hipotecas subaquáticas e contração do consumo. Série trimestral com defasagem de ~2 meses na divulgação.',
  },
  HSN1F: {
    label: 'New Home Sales', unit: 'K', section: 'housing', direction: 1,
    transform: 'raw',
    description: 'Vendas mensais de novas residências unifamiliares nos EUA (taxa anual sazonalmente ajustada, em milhares). Leading indicator do mercado imobiliário — reflete compras de imóveis ainda em construção. Muito sensível às taxas hipotecárias: aumento de 1pp na taxa 30Y tipicamente reduz vendas em 10–20%. Queda sustentada abaixo de 500K sinaliza retração no setor de construção residencial.',
  },
}

async function fetchObs(
  id: string, apiKey: string, extra: number, frequency?: string
): Promise<{date: string; value: number}[]> {
  // Fetch newest-first so the limit always captures the most recent data,
  // then reverse to get ascending (oldest → newest) order.
  const params = new URLSearchParams({
    series_id: id,
    api_key:   apiKey,
    sort_order: 'desc',
    limit: String(300 + extra),
    file_type: 'json',
    ...(frequency ? { frequency } : {}),
  })
  const res = await fetch(`${FRED}?${params}`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`FRED ${id}: ${res.status}`)
  const data = await res.json()
  return (data.observations as {date: string; value: string}[])
    .map(o => ({ date: o.date, value: parseFloat(o.value) }))
    .filter(o => !isNaN(o.value))
    .reverse() // ascending: oldest → newest
}

async function getRecessions(apiKey: string): Promise<{start: string; end: string}[]> {
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 30)
  const params = new URLSearchParams({
    series_id: 'USREC',
    api_key:   apiKey,
    observation_start: startDate.toISOString().slice(0, 10),
    sort_order: 'asc',
    limit: '600',
    file_type: 'json',
  })
  const res = await fetch(`${FRED}?${params}`, { next: { revalidate: 86400 } })
  if (!res.ok) return []
  const data = await res.json()
  const obs = data.observations as {date: string; value: string}[]

  const periods: {start: string; end: string}[] = []
  let recStart: string | null = null
  for (const o of obs) {
    if (o.value === '1' && !recStart) recStart = o.date
    else if (o.value !== '1' && recStart) {
      periods.push({ start: recStart, end: o.date })
      recStart = null
    }
  }
  if (recStart) periods.push({ start: recStart, end: new Date().toISOString().slice(0, 10) })
  return periods
}

function applyTransform(
  obs: {date: string; value: number}[],
  transform: Transform
): {date: string; value: number}[] {
  const r2 = (n: number) => Math.round(n * 100) / 100
  switch (transform) {
    case 'raw':
      return obs.map(o => ({ date: o.date, value: r2(o.value) }))
    case 'mom_diff':
      return obs.slice(1).map((o, i) => ({ date: o.date, value: r2(o.value - obs[i].value) }))
    case 'mom_pct':
      return obs.slice(1).map((o, i) => ({ date: o.date, value: r2((o.value - obs[i].value) / obs[i].value * 100) }))
    case 'yoy':
      return obs.slice(12).map((o, i) => ({ date: o.date, value: r2((o.value - obs[i].value) / obs[i].value * 100) }))
    case 'yoy_4':
      return obs.slice(4).map((o, i) => ({ date: o.date, value: r2((o.value - obs[i].value) / obs[i].value * 100) }))
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!rateLimit(getIp(req), 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const params  = await Promise.resolve(context.params)
  const id      = (params as {id: string}).id.toUpperCase()
  const meta    = SERIES_META[id]
  if (!meta) return NextResponse.json({ error: 'Unknown series' }, { status: 404 })

  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'FRED API key not configured' }, { status: 503 })

  const extra = meta.transform === 'yoy' ? 13
    : meta.transform === 'yoy_4' ? 5
    : (meta.transform === 'mom_diff' || meta.transform === 'mom_pct') ? 1
    : 0

  try {
    const [rawObs, recessions] = await Promise.all([
      fetchObs(id, apiKey, extra, meta.frequency),
      getRecessions(apiKey),
    ])

    const transformed = applyTransform(rawObs, meta.transform)
    const scale = meta.postScale ?? 1
    const data = scale !== 1
      ? transformed.map(o => ({ date: o.date, value: Math.round(o.value * scale * 1000) / 1000 }))
      : transformed

    return NextResponse.json({
      id,
      label:       meta.label,
      unit:        meta.unit,
      section:     meta.section,
      direction:   meta.direction,
      description: meta.description,
      data,
      recessions,
    }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('[macro/us/id]', err)
    return NextResponse.json({ error: 'Series unavailable' }, { status: 502 })
  }
}
