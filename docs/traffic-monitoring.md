# Traffic Monitoring & Alerts Guide

Sistema completo para monitorar tráfego do site e receber alertas automáticos.

## 📊 Analytics Dashboard

Acesse `/analytics` para visualizar:
- Total de page views
- Split dispositivos (desktop/mobile)
- Distribuição de browsers
- Top 10 páginas mais visitadas

```
https://stockmarketroi.com/analytics
```

## 📤 Export Logs

### JSON Format
```bash
curl https://stockmarketroi.com/api/admin/logs/export?format=json
```

Retorna:
```json
{
  "count": 5,
  "exported_at": "2026-08-15T20:30:00Z",
  "logs": [
    {
      "timestamp": "2026-08-15T20:15:00Z",
      "type": "page_view",
      "path": "/",
      "ip": "192.168.1.0",
      "userAgent": "desktop/chrome",
      "status": 200
    }
  ]
}
```

### CSV Format
```bash
curl https://stockmarketroi.com/api/admin/logs/export?format=csv -o logs.csv
```

Retorna arquivo CSV pronto para importar no Excel/Google Sheets.

## 🚨 Traffic Alerts

Sistema automático que monitora tráfego e alerta se cair abaixo de um limite.

### Configuração

1. **Environment Variables:**
   ```bash
   # .env.local
   ALERT_EMAIL=seu-email@example.com
   ```

2. **Default Thresholds:**
   - Mínimo: 50 views/hora
   - Verifica: A cada 1 hora
   - Email: quando tráfego < 50 views/hora

### Rodar Manualmente

```bash
# Checar tráfego agora
curl https://stockmarketroi.com/api/admin/traffic-check
```

Retorna:
```json
{
  "success": true,
  "metrics": {
    "viewsLastHour": 65,
    "viewsLastDay": 1200,
    "status": "normal",
    "message": "✅ Traffic normal"
  }
}
```

### Setup Automático (Cron)

**Opção 1: GitHub Actions**

Criar `.github/workflows/traffic-check.yml`:

```yaml
name: Traffic Check

on:
  schedule:
    - cron: '0 * * * *'  # Every hour

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check traffic
        run: |
          curl -f https://stockmarketroi.com/api/admin/traffic-check
```

**Opção 2: Cron on VPS**

```bash
# SSH na VPS
ssh seu-user@seu-vps.com

# Editar crontab
crontab -e

# Adicionar (roda a cada hora)
0 * * * * curl -s https://stockmarketroi.com/api/admin/traffic-check
```

## 📈 Traffic Metrics

Cada página rastreada coleta:
- ✅ IP (anonimizado)
- ✅ Device (mobile/desktop)
- ✅ Browser (chrome/firefox/safari/edge)
- ✅ Path visitado
- ✅ Timestamp
- ✅ HTTP Status

## 🔍 Querying Logs Manually

Via SSH na VPS:

```bash
ssh seu-user@seu-vps.com

# Ver logs em tempo real
pm2 logs us-market-hub

# Top 10 páginas mais visitadas
tail -1000 ~/.pm2/logs/us-market-hub-out.log | grep page_view | jq -r '.path' | sort | uniq -c | sort -rn | head -10

# Contar acessos por hora
tail -1000 ~/.pm2/logs/us-market-hub-out.log | grep page_view | jq -r '.timestamp' | cut -c1-13 | sort | uniq -c

# Acessos mobile vs desktop
echo "Mobile:" $(tail -500 ~/.pm2/logs/us-market-hub-out.log | grep -c mobile)
echo "Desktop:" $(tail -500 ~/.pm2/logs/us-market-hub-out.log | grep -c desktop)

# Encontrar padrões suspeitos (muito tráfego de um IP)
tail -1000 ~/.pm2/logs/us-market-hub-out.log | grep page_view | jq -r '.ip' | sort | uniq -c | sort -rn | head -5
```

## 📊 Interpreting Alerts

| Status | Significado | Ação |
|--------|-------------|------|
| 🟢 Normal | Tráfego OK | Nenhuma |
| 🟡 Warning | Tráfego 25-50% abaixo | Monitorar |
| 🔴 Critical | Tráfego <50% esperado | Investigar imediatamente |

**Possíveis causas de queda:**
- Servidor offline
- DNS propagação lenta
- Erro na aplicação
- Mudança no SEO ranking
- Ataque/block de IP

## 🔐 Privacy & Compliance

- ✅ IPs anonimizados (último octeto zerado)
- ✅ Nenhum dado pessoal coletado
- ✅ Apenas dados agregados
- ✅ GDPR/CCPA/LGPD compliant
- ✅ Analytics dashboard é noindex (não indexável)

## Integration Examples

### Node.js
```typescript
import { checkTrafficMetrics, logAlert } from '@/lib/traffic-alerts'

const metrics = checkTrafficMetrics(65, 1200)
if (metrics.status !== 'normal') {
  logAlert(metrics)
  // Send email, Slack, etc.
}
```

### Python (shell script)
```bash
#!/bin/bash
TRAFFIC=$(curl -s https://stockmarketroi.com/api/admin/traffic-check)
STATUS=$(echo $TRAFFIC | jq -r '.metrics.status')

if [ "$STATUS" != "normal" ]; then
  # Send to Slack, email, etc.
  MESSAGE=$(echo $TRAFFIC | jq -r '.metrics.message')
  echo "Alert: $MESSAGE"
fi
```

## Future Enhancements

- [ ] Integração com Slack/Discord webhooks
- [ ] Gráficos em tempo real (via WebSockets)
- [ ] Alertas por página específica
- [ ] Detecção de anomalias (ML)
- [ ] Filtros avançados (por país, device, browser)
- [ ] Comparação com período anterior
