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

    const data = applyTransform(rawObs, meta.transform)

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
