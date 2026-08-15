# Server-Side Logging Guide

Este sistema registra todas as requisições para a VPS, permitindo que você saiba QUEM (IP anonimizado), QUANDO, e QUAL página/API foi acessada - sem depender do Google Analytics.

## Como funciona

Quando um usuário acessa uma página ou API endpoint, o sistema registra:

```json
{
  "timestamp": "2026-08-15T18:30:45.123Z",
  "method": "GET",
  "path": "/",
  "ip": "192.168.1.0",
  "userAgent": "desktop/chrome",
  "referrer": "google.com",
  "type": "page_view",
  "status": 200
}
```

**O que é registrado:**
- ✅ **IP** - Anonimizado (último octeto zerado para GDPR compliance)
- ✅ **Página/API** - Exatamente qual rota foi acessada
- ✅ **Device/Browser** - Se é mobile/desktop e qual navegador
- ✅ **Timestamp** - Data e hora da requisição (ISO 8601)
- ✅ **HTTP Status** - 200, 404, 500, etc
- ✅ **Referrer** - De onde o usuário veio (opcional)

**O que NÃO é registrado:**
- ❌ Dados pessoais (nome, email, telefone)
- ❌ IP real completo
- ❌ Conteúdo das requisições
- ❌ Informações de conta do usuário

## Adicionar logging a uma página

### Páginas estáticas/dinâmicas

```tsx
import { PageTracker } from '@/components/PageTracker'

export default function MyPage() {
  return (
    <>
      <PageTracker path="/my-page" />
      <div>Conteúdo...</div>
    </>
  )
}
```

### API Routes

```ts
import { logApiCall } from '@/lib/server-logger'

export async function GET(req: Request) {
  const startTime = Date.now()
  
  try {
    // Sua lógica aqui
    const data = await fetchSomeData()
    
    const duration = Date.now() - startTime
    await logApiCall('/api/my-endpoint', 200, duration)
    
    return Response.json(data)
  } catch (err) {
    const duration = Date.now() - startTime
    await logApiCall('/api/my-endpoint', 500, duration)
    return Response.json({ error: 'Error' }, { status: 500 })
  }
}
```

## Consultar os logs

### Via SSH na VPS

**Ver logs em tempo real:**
```bash
ssh seu-user@seu-vps.com
pm2 logs us-market-hub
```

**Ver últimas 100 linhas:**
```bash
tail -100 ~/.pm2/logs/us-market-hub-out.log
```

**Filtrar por página específica:**
```bash
grep "/stocks" ~/.pm2/logs/us-market-hub-out.log
```

**Ver apenas erros:**
```bash
tail -100 ~/.pm2/logs/us-market-hub-error.log
```

### Parsing JSON dos logs

Os logs são em JSON para facilitar parsing:

```bash
# Contar requisições por dia
cat ~/.pm2/logs/us-market-hub-out.log | grep page_view | wc -l

# Ver top 10 páginas mais visitadas
cat ~/.pm2/logs/us-market-hub-out.log | grep '"path"' | sort | uniq -c | sort -rn | head -10

# Ver requisições de mobile
grep "mobile" ~/.pm2/logs/us-market-hub-out.log | wc -l
```

## Retenção de logs

PM2 mantém logs até que o arquivo fique muito grande ou até que você limpe manualmente:

```bash
# Limpar logs antigos
pm2 flush us-market-hub

# Ou deletar arquivo manualmente
rm ~/.pm2/logs/us-market-hub-*.log
```

## Conformidade Legal

Este sistema é **GDPR, CCPA e LGPD compliant** porque:

1. ✅ IPs são anonimizados (último octeto zerado)
2. ✅ Nenhum dado pessoal é coletado
3. ✅ Dados são armazenados apenas no servidor (não enviados para terceiros)
4. ✅ O usuário pode solicitar deleção dos logs
5. ✅ Está documentado na Privacy Policy

## Diferença: Logs vs Google Analytics

| Aspecto | Logs de Servidor | Google Analytics |
|---------|------------------|------------------|
| **Dados** | Path visitado, IP anon, device | Comportamento completo (cliques, scroll, tempo) |
| **Armazenamento** | Seu servidor | Servidores do Google |
| **Consentimento** | Não precisa (GDPR legit interest) | Precisa de consentimento do usuário |
| **Privacy** | Totalmente privado | Google coleta dados adicionais |
| **Custo** | Grátis | Grátis (mas dados seu) |
| **Análise** | Básica (manual) | Avançada (dashboards) |

## Próximas sugestões

- [ ] Adicionar logging a `/stocks/[symbol]`
- [ ] Adicionar logging a `/crypto/[id]`
- [ ] Adicionar logging a `/blog`
- [ ] Dashboard simples para visualizar estatísticas (top páginas, tráfego por hora, etc)
