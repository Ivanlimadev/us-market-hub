# Briefing para Claude Opus — Projeto Stock Market ROI

## Quem você é e o que vai fazer

Você é Claude Opus e vai analisar screenshots do site **Investidor10** (investidor10.com.br) fornecidos pelo usuário e replicar a arquitetura visual, widgets, campos e organização deles no site **Stock Market ROI** (stockmarketroi.com) — mantendo o foco no **mercado americano** (ações US, crypto, ETFs) e sem alterar nenhum ativo ou dado existente.

Leia este briefing completo antes de qualquer ação.

---

## 1. O Ecossistema — Entenda a Separação

Este projeto tem **dois produtos que compartilham o mesmo backend**:

```
┌─────────────────────────────────────────────────────┐
│                   BACKEND COMPARTILHADO              │
│                                                      │
│  • Supabase (auth, portfolio, watchlist, alertas,   │
│    finanças, FCM tokens, preferências)               │
│  • APIs em /api/* (Next.js route handlers)          │
│  • Dados de mercado: Marketstack Pro, CoinGecko,    │
│    Kraken WebSocket, Stock News API                  │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   SITE (Next.js)        APP (Flutter)
   stockmarketroi.com    iOS / Android
   /src/app/ (pages)     repo separado
   /src/components/      stock_market_roi_app/
```

**Regra de ouro:** Você só mexe no site (Next.js). O app Flutter é um repo separado — nunca o altere. O backend (rotas `/api/*`, Supabase schema) é compartilhado — **nunca quebre uma rota de API existente**.

---

## 2. Stack do Site

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** — dark theme padrão (`bg-zinc-950`, `text-zinc-100`)
- **Supabase** — auth SSR via `@supabase/ssr`, dados de usuário
- **React Query** — cache de dados client-side
- **Recharts** — gráficos
- **Shadcn/ui** — componentes base em `src/components/ui/`
- **Deploy:** VPS próprio (nginx + PM2) — **não é Vercel**

---

## 3. Estrutura de Páginas Atuais

```
src/app/
├── page.tsx                    ← Home / landing
├── stocks/[symbol]/            ← Página de ativo (ação)
├── crypto/[id]/                ← Página de cripto
├── portfolio/                  ← Portfolio do usuário
├── watchlist/                  ← Lista de observação
├── screener/                   ← Filtro de ações
├── heatmap/                    ← Mapa de calor do mercado
├── rankings/                   ← Rankings de ativos
├── compare/[pair]/             ← Comparação entre ativos
├── calculators/                ← Calculadoras financeiras
│   ├── compound-interest/
│   ├── dca/
│   ├── roi/
│   ├── first-million/
│   ├── simple-interest/
│   └── percentage/
├── calendar/
│   ├── earnings/               ← Calendário de resultados
│   └── dividends/              ← Calendário de dividendos
├── blog/[slug]/                ← Blog de análises
├── finance/                    ← Gestor financeiro pessoal
├── auth/                       ← Login, registro, reset senha
└── account/                    ← Configurações de conta
```

---

## 4. Componentes da Página de Ativo (stocks/[symbol])

A página mais importante. Componentes atuais em `src/components/stock/`:

| Componente | O que exibe |
|---|---|
| `PriceChart.tsx` | Gráfico de preço intraday/histórico |
| `PerformanceStrip.tsx` | Variação 1D, 1W, 1M, YTD, 1Y |
| `FundamentalsCard.tsx` | P/E, EPS, Market Cap, Volume, etc. |
| `FairValueCard.tsx` | Preço justo estimado |
| `EarningsCard.tsx` | Próximo resultado + histórico EPS |
| `EarningsHistory.tsx` | Histórico de resultados trimestrais |
| `DividendsSection.tsx` | Yield, histórico de dividendos |
| `FinancialCharts.tsx` | Receita, lucro, margens |
| `StockAIInsight.tsx` | Análise por IA (rewarded gate) |
| `StockAnalysisSummary.tsx` | Bull/Bear case + veredicto |
| `FundamentalsCard.tsx` | Fundamentos detalhados |
| `InsiderTransactions.tsx` | Transações de insiders (SEC) |
| `SecFilings.tsx` | Documentos SEC/EDGAR |
| `BuyHoldChecklist.tsx` | Checklist buy/hold/avoid |
| `MagicNumber.tsx` | Magic Number proprietário |
| `InvestmentSimulator.tsx` | Simulador de investimento |
| `CompanyInfo.tsx` | Info da empresa (setor, CEO, etc.) |
| `RelatedAssets.tsx` | Ativos relacionados |
| `StockNews.tsx` | Notícias (só blog próprio) |
| `StockRelatedPosts.tsx` | Posts relacionados do blog |

---

## 5. O Que NUNCA Tocar

### APIs — não altere assinatura de nenhuma rota existente
```
/api/stocks/[symbol]        ← dados de ação (site + app)
/api/crypto/[id]            ← dados de cripto (site + app)
/api/quotes                 ← cotações batch (site + app)
/api/batch-quotes           ← cotações múltiplas (site + app)
/api/portfolio/*            ← portfolio (site + app)
/api/watchlist/*            ← watchlist (site + app)
/api/alerts/*               ← price alerts (site + app)
/api/finance/*              ← finance manager (site + app)
/api/auth/*                 ← autenticação (site + app)
/api/dividends              ← dividendos (site + app)
/api/calendar               ← calendário (site + app)
/api/screener               ← screener (site + app)
```

**Se precisar de um novo endpoint**, crie uma nova rota em `/api/nova-rota/` — nunca modifique uma existente.

### Supabase — não altere schema existente
Tabelas que existem e são usadas pelo app também:
- `portfolios`, `portfolio_items`
- `watchlists`, `watchlist_items`
- `price_alerts`
- `user_fcm_tokens`
- `notification_preferences`
- `finance_transactions`, `finance_categories`
- `blog_posts`, `blog_authors`
- `user_profiles`

**Se precisar de nova tabela:** criar + RLS + GRANT SELECT/INSERT/UPDATE/DELETE TO authenticated.

### SEO — não altere estas configurações
- `sitemap.ts` — deve permanecer `force-dynamic`; só TOP_STOCKS no sitemap
- Páginas fora do universo curado: `robots: { index: false, follow: true }` — não remover
- Blog pausado — não religar o cron de geração automática

### Autenticação — não altere
- Fluxo SSR com `@supabase/ssr` em `src/lib/supabase/`
- Middleware de auth em `src/middleware.ts`

### Rate limiting — não remova
- `src/lib/rate-limit.ts` — deve permanecer em todas as rotas de API

---

## 6. Regras de Conteúdo (Crítico)

- **Notícias:** o site mostra APENAS posts do blog próprio. NUNCA adicionar feeds externos (Reuters, WSJ, Yahoo Finance, etc.)
- **Ativos:** foco exclusivo no mercado americano (NYSE, NASDAQ, crypto). Não adicionar B3 ou ativos brasileiros.
- **Autores do blog:** Jennifer Moore e Maya Bennett são autoras fictícias — não adicionar faculdades ou empregadores reais nas bios

---

## 7. Segurança — Checklist Antes de Cada Mudança

Antes de implementar qualquer componente ou página nova:

1. **Autenticação:** dados de usuário? → verificar que usa o cliente SSR do Supabase, não o anon client
2. **Nova API route?** → adicionar `rateLimit()` no topo, extrair IP com `getIp(req)`
3. **Nova tabela?** → adicionar RLS + GRANT ao `authenticated` role
4. **Input de usuário?** → sanitizar, nunca interpolar direto em SQL
5. **Variáveis de ambiente?** → usar `process.env.NOME` nunca hardcodar secrets
6. **Componente client?** → marcar com `'use client'` apenas se precisar de estado/hooks

---

## 8. Fontes de Dados Disponíveis

| Dado | Fonte | Como acessar |
|---|---|---|
| Preço atual, OHLCV | Marketstack Pro | `/api/stocks/[symbol]` |
| Histórico de preços | Marketstack Pro | `/api/history`, `/api/stock-history` |
| Fundamentos (P/E, EPS, etc.) | Marketstack Pro | `/api/stocks/[symbol]` (campo `fundamentals`) |
| Cripto preços | CoinGecko | `/api/crypto/*` |
| Cripto realtime | Kraken WebSocket | direto no client |
| Dividendos | Marketstack Pro | `/api/dividends` |
| Calendário earnings | Marketstack Pro | `/api/calendar` |
| Insiders/SEC | EDGAR API | `/api/stocks/[symbol]/insiders`, `/filings` |
| Macro (Fed, GDP, etc.) | FRED/outros | `/api/macro/us` |
| Notícias/blog | Supabase (blog_posts) | `/api/blog` |

---

## 9. Campos Reais Disponíveis por API

> Use esta seção antes de assumir que um dado existe. Se o campo não está aqui, a API não retorna — será necessário avaliar se é possível adicionar ou se não há cobertura.

### `/api/stocks/[symbol]` — Dados principais de uma ação
```
symbol, name, currentPrice, prevClose, change, changePct
info:
  regularMarketPrice, regularMarketPreviousClose, regularMarketChangePercent
  longName, exchangeName, sector, industry, description, website
  employees, country, city
  marketCap, pe, eps, forwardPE, pegRatio, beta
  week52High, week52Low, avgVolume10d, avgVolume3m
  dividendYield, dividendRate, exDividendDate, dividendDate, payoutRatio
  nextEarningsDate, bookValue
  profitMargin, operatingMargin, roe, roa
  revenueGrowth, earningsGrowth
  totalRevenue, totalDebt, debtToEquity, currentRatio, freeCashflow
  recommendationKey, targetMeanPrice, targetHighPrice, targetLowPrice
  numberOfAnalystOpinions
  priceToBook (pode ser null)
dividends: [{ date, dividend, symbol }]
splits: [...]
exchange
```
**Não disponível:** EV/EBITDA, P/Sales, gross margin, EBITDA diretamente (calcular se necessário)

### `/api/stocks/[symbol]/financials` — Demonstrações financeiras
```
annual: [{ date, revenue, grossProfit (null), operatingIncome (null), netIncome, netMargin }]
quarterly: [{ date, revenue, grossProfit (null), operatingIncome (null), netIncome, netMargin }]
cagr5yRevenue, cagr5yNetIncome
```
**Atenção:** `grossProfit` e `operatingIncome` retornam `null` atualmente

### `/api/history?symbol=[symbol]&period=[1d|1w|1m|3m|6m|1y|5y]`
```
period, count
bars: [{ date, open, high, low, close, volume }]
```

### `/api/dividends?symbol=[symbol]`
```
[{ date, dividend, symbol }]
```

### `/api/macro/us` — Indicadores macroeconômicos
```
[{ id, label, unit, section, direction, value, change, history: [...] }]
Seções: 'fed', 'inflation', 'employment', 'growth', etc.
37 indicadores no total (Fed Funds Rate, CPI, GDP, etc.)
```

### `/api/screener` — Lista de ações para screener
```
[{ symbol, name, price, prevClose, changePct, marketCap, pe, forwardPE,
   pb, dividendYield, roe, volume, beta, week52High, week52Low,
   avgVolume, sector, industry, eps, earningsTimestamp }]
```

### `/api/crypto/[id]` — Dados de cripto
Via CoinGecko + Kraken WebSocket para preço realtime

### `/api/stocks/[symbol]/insiders` — Transações de insiders
Via EDGAR API (pode retornar erro 503 em instabilidade)

### `/api/stocks/[symbol]/financials` + `/filings`
Via EDGAR API

---

## 10. Sua Missão — Análise Investidor10

### Objetivo
O usuário vai te fornecer screenshots do **investidor10.com.br**. Para cada página/seção:

1. **Identifique** todos os widgets, cards, campos, métricas e sua organização visual
2. **Compare** com o que já existe no Stock Market ROI (listado na Seção 3 e 4)
3. **Classifique** cada item como:
   - ✅ Já existe (talvez com nome diferente)
   - 🔨 Existe mas organização/layout diferente — ajustar
   - ➕ Não existe — implementar novo
   - ❌ Não aplicável (específico do mercado BR)

4. **Priorize** por impacto visual e complexidade
5. **Implemente** um componente/página de cada vez, aguardando confirmação antes do próximo

### Formato de Resposta para Cada Item
```
## [Nome do Widget/Seção]
**Status:** ➕ Novo / 🔨 Ajustar / ✅ Já existe
**Equivalente atual:** [componente atual se existir]
**O que adicionar/mudar:** [descrição específica]
**Dados disponíveis:** [qual API/campo alimenta isso]
**Impacto:** Alto / Médio / Baixo
**Implementação:** [código ou plano de execução]
```

### Regras de Implementação
- **DEPLOY:** Nunca faça deploy em produção. Implemente, mostre o resultado, aguarde confirmação explícita do Ivan ("pode subir", "faz o deploy") antes de qualquer `git push` ou comando no VPS.
- Uma mudança de cada vez — nunca refatore tudo de uma vez
- Sempre testar que rotas de API existentes continuam respondendo igual
- Manter dark theme (`bg-zinc-950` base, `bg-zinc-900` cards)
- Manter Tailwind CSS — não adicionar novas libs CSS
- Componentes novos em `src/components/[área]/NomeComponente.tsx`
- Se criar nova rota de API: seguir padrão de `rate-limit` + `getIp` + auth check

---

## 10. Como Começar

Quando o usuário te fornecer o primeiro screenshot do Investidor10:

1. Analise a imagem identificando TODOS os elementos visuais
2. Faça o mapeamento (Seção 9) para aquela página
3. Apresente a lista completa de gaps encontrados
4. Peça confirmação de qual item implementar primeiro
5. Implemente um de cada vez

**Nunca comece a codar sem ter mapeado os gaps primeiro.**

---

## Referências de Arquivo

- Página home: `src/app/page.tsx`
- Página de ativo: `src/app/stocks/[symbol]/page.tsx` + `StockDetailClient.tsx`
- Componentes de ativo: `src/components/stock/`
- Componentes de layout: `src/components/layout/`
- Componentes UI base: `src/components/ui/`
- Rate limit: `src/lib/rate-limit.ts`
- Supabase client (SSR): `src/lib/supabase/`
- Tipos TypeScript: `src/types/`
