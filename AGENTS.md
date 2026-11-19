# AGENTS.md — OLHO DO MERCADO
## Adaptado para Codex (OpenAI)

### RESUMO DO PRODUTO
O Olho do Mercado é um sistema que combina:
- **Visão em Tempo Real**: Monitora 10 marketplaces (Shopee, Magalu, Mercado Livre, Amazon) e identifica ofertas em alta demanda
- **IA Generativa**: Gera 5 variações de copy persuasivo em segundos (emocional, FOMO, barganha, prova social, CTA otimizado)
- **Automação de Dispatch**: Envia posts prontos via Telegram/WhatsApp nos horários de pico
- **Analytics**: Rastreia qual copy converteu melhor, qual horário vende mais, qual marketplace tem ROI maior

**Valor para o Cliente**: Afiliado acorda, vê 10-15 ofertas prontas (copy + imagem + link), revisa em 20 segundos, e começa a lucrar enquanto concorrência tá procurando oferta.

### ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React / Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Dashboard   │  │ Preview      │  │  Analytics & History │  │
│  │  (Grid 10-15 │  │  Modal       │  │  (Gráficos & Tabela) │  │
│  │   ofertas)   │  │  (5 copies)  │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↑ ↓
             (HTTP REST / WebSocket para real-time)
                              ↑ ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express / Fastify)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes:                                             │  │
│  │  - GET /api/offers (últimas 10-15 ofertas do dia)       │  │
│  │  - POST /api/uses (user usa uma oferta)                │  │
│  │  - POST /api/dispatch (enviar via Telegram/WhatsApp)   │  │
│  │  - GET /api/analytics (histórico + ROI)                │  │
│  │  - WebSocket: Real-time offer updates                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services:                                               │  │
│  │  - OfferScraper (monitora APIs de marketplace)         │  │
│  │  - CopyGenerator (GPT-4 ou open-source)                │  │
│  │  - ImageProcessor (remove marca d'água)                │  │
│  │  - AffiliationLinker (gera link rastreado)             │  │
│  │  - Dispatcher (envia Telegram/WhatsApp)                │  │
│  │  - Analytics (rastreia cliques e conversões)           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↑ ↓
┌─────────────────────────────────────────────────────────────────┐
│               EXTERNAL APIs & DATABASES                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐       │
│  │ Shopee API │  │ Magalu API   │  │ Mercado Livre    │       │
│  │ Amazon API │  │ Estoque API  │  │ OpenAI GPT-4     │       │
│  │ PostgreSQL │  │ Hotmart      │  │ Telegram / WApp  │       │
│  │ (ou Mongo) │  │ Affiliation  │  │ Webhook Tracking │       │
│  └────────────┘  └──────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### SCHEMA DE BANCO DE DADOS

**Tabela: users**
```sql
id (PK) | email | password_hash | plan (essencial/prof/vip) | created_at | active
```

**Tabela: offers**
```sql
id | title | price | discount | image_url | marketplace | demand_level | trending_since | trending_until | stock_level | created_at
```

**Tabela: offer_copies**
```sql
id | offer_id | angle (emocional/fomo/barganha/social/cta) | copy_text | created_at
```

**Tabela: user_dispatches**
```sql
id | user_id | offer_id | copy_id | sent_at | channel (telegram/whatsapp) | link_tracking_id | clicks | conversions | roi
```

**Tabela: affiliation_links**
```sql
id | user_id | offer_id | link_tracking_id | real_link | created_at | clicks | conversions
```

### FLUXO DE DADOS DETALHADO

**Fluxo 1: User faz login**
1. User: Acessa /dashboard
2. Backend: Verifica JWT token (ou redireciona para /login)
3. User: Faz login com email/senha
4. Backend: Valida credenciais, gera JWT, retorna token
5. Frontend: Armazena token (localStorage), redireciona para /dashboard
6. Frontend: WebSocket connect (inicia listener de novas ofertas em tempo real)

**Fluxo 2: Dashboard carrega**
1. Frontend: GET /api/offers (últimas 10-15 do dia)
2. Backend: Consulta tabela `offers` + `offer_copies` (todos os ângulos)
3. Backend: Retorna JSON com grid de cards
4. Frontend: Renderiza grid (cada card com imagem, título, desconto, badges, botão "Usar Este")

**Fluxo 3: User clica "Usar Este"**
1. Frontend: POST /api/uses { offer_id }
2. Backend:
   - Consulta offer_id em `offers` + `offer_copies` (5 ângulos)
   - Se ainda não tem link rastreado: Chama AffiliationLinker (gera link Hotmart/Awin com UTM)
   - Se ainda não tem imagem processada: Chama ImageProcessor (remove marca d'água com IA OCR)
   - Retorna: { offer_title, copies[5], image_url, tracking_link, pico_time }
3. Frontend: Abre Modal com:
   - Abas de 5 copies (cada uma com botão Copy)
   - Preview do post em Instagram/TikTok/WhatsApp
   - Toggle: "Revisar" vs "Automático às 20h34"
   - Botão: "Liberar & Enviar"

**Fluxo 4: User clica "Liberar & Enviar" (Manual)**
1. Frontend: POST /api/dispatch { offer_id, copy_id, channel, now }
2. Backend:
   - Cria registro em `user_dispatches` (sent_at = now)
   - Integra com Telegram Bot API (ou WhatsApp Business API)
   - Envia mensagem no grupo/canal do user (copy + link + imagem)
   - Retorna: { success, message_id, link_tracking }
3. Frontend: Mostra "✓ Enviado!"
4. Backend: Webhook monitoring (cada clique no link dispara evento)
5. Backend: Atualiza `affiliation_links` (clicks++)
6. Backend: Se marketplace notifica compra via webhook → `affiliation_links` (conversions++)
7. Frontend: Dashboard atualiza em tempo real com badge "✓ Lucrou" na oferta

**Fluxo 5: User clica "Liberar & Enviar" (Automático às 20h34)**
1. Frontend: POST /api/schedule { offer_id, copy_id, channel, scheduled_time }
2. Backend:
   - Cria registro em `user_dispatches` (scheduled_at = 20h34)
   - Scheduler (node-cron ou Bull queue) monitora agendamentos
   - Na hora prevista: Executa dispatcher automático
   - Dispatch acontece (mesmos passos do fluxo manual)

**Fluxo 6: Analytics & History**
1. Frontend: GET /api/analytics { period: "7d" ou "30d" }
2. Backend: Consulta `user_dispatches` (últimas 30 offers usadas)
3. Backend: Calcula por offer:
   - Qual copy converteu melhor (copy_id com mais conversions)
   - Qual horário teve mais cliques (GROUP BY HOUR(sent_at))
   - ROI (revenue_estimated = price * conversions * commission_rate)
4. Backend: Retorna gráficos + tabela detalhada
5. Frontend: Renderiza 3 gráficos:
   - Ângulo de copy mais efetivo (bar chart: emocional vs FOMO vs barganha)
   - Horários de pico (line chart: cliques por hora)
   - Marketplaces com melhor ROI (pie chart: Shopee vs Magalu vs etc)

### IMPLEMENTAÇÃO DOS AGENTS (Funções Chave)

**Agent 1: OfferMonitor (node-cron job)**
```
A cada 5 minutos:
1. Chama Shopee API → extrai top 10 trending products
2. Chama Magalu API → top 10 trending
3. Chama Mercado Livre API → top 10 trending
4. Chama Amazon API → top 10 trending
5. Para cada produto: consulta demand_velocity (% de aumento em visualizações/vendas)
6. Se demand_velocity > 50% em 2h = marca como "Demanda Alta"
7. Se stock < 100 unidades = marca como "Stock Limitado"
8. Insere ou atualiza em tabela `offers`
9. WebSocket push: notifica frontend de novas offers em tempo real
```

**Agent 2: CopyGenerator (OpenAI GPT-4 ou LLaMA via Ollama)**
```
Input: { product_title, price, discount%, category, marketplace }
Prompt Engineering (5 paralelos):

1. Copy Emocional:
   "Escreva uma copy persuasiva de 50-70 palavras para Instagram Reels sobre este produto [title]. Foco em emoção, em como muda a vida da pessoa. Tom: coloquial, como amiga falando. CTA: 'Clica no link da bio'"

2. Copy FOMO:
   "Escreva uma copy de 40-50 palavras com urgência. Produto em alta demanda, stock limitado. Tom: alerta, oportunidade fugidora. CTA: 'Manda mensagem agora antes que acabe'"

3. Copy Barganha:
   "Escreva uma copy de 30-40 palavras focando no desconto/preço. [discount%] OFF. Tom: direto, objetivo. CTA: 'Link nos comentários'"

4. Copy Prova Social:
   "Escreva uma copy de 50 palavras dizendo que [X] pessoas compraram isso nos últimos 2 dias e adoraram. Incluir um depoimento fictício mas realista. CTA: 'Veja os depoimentos no link'"

5. Copy CTA Curto (TikTok):
   "Escreva uma copy de 20-30 palavras bem curta para TikTok. Só o gancho. CTA: 'Link nos comentários'"

Output: { copy_1, copy_2, copy_3, copy_4, copy_5 }
```

**Agent 3: ImageProcessor (OpenCV + OCR + Inpainting)**
```
Input: image_url (imagem com marca d'água)
Processo:
1. Download imagem
2. Detecta marca d'água (texto branco/cinza em canto, borders, center)
3. Aplica mask-based inpainting (deep learning model) para remover
4. Otimiza: redimensiona para Instagram (1080x1350), TikTok (1080x1920), thumbnail (400x300)
5. Upload em CDN
Output: { clean_image_url_ig, clean_image_url_tiktok, clean_image_url_thumb }
```

**Agent 4: AffiliationLinker (Hotmart / Awin API)**
```
Input: { user_id, offer_id, real_marketplace_link }
Processo:
1. Consulta programa de afiliação do marketplace
2. Gera affiliate link com commission code do user
3. Adiciona UTM params para rastreamento:
   utm_source=olho_do_mercado
   utm_medium=whatsapp (ou instagram, telegram)
   utm_campaign=offer_{offer_id}
   utm_content=copy_{copy_id}
   utm_term={timestamp}
4. Encurta com bit.ly ou TinyURL
5. Registra em `affiliation_links`
Output: { tracking_link, utm_params }
```

**Agent 5: Dispatcher (Telegram Bot / WhatsApp Business API)**
```
Input: { user_id, offer_id, copy_id, channel, scheduled_time (opcional) }
Processo (se channel = telegram):
1. Consulta user.telegram_group_ids (groups pré-cadastrados)
2. Monta mensagem:
   [IMAGEM]
   {copy_text}
   Link: {tracking_link}
   ---
   Horário de pico para este produto: {pico_time}
3. Para cada grupo: telegram_bot.sendMessage(group_id, message)
4. Registra em `user_dispatches` (sent_at, message_id)

Processo (se channel = whatsapp):
1. Mesmo fluxo, mas via WhatsApp Business API
2. Pode enviar para grupos ou lista de broadcast

Webhook tracking:
1. Cada link tem tracking_id único
2. Quando user clica: webhook dispara
3. Atualiza `affiliation_links` (clicks++)
```

**Agent 6: ConversionTracker (Webhook Listener)**
```
Eventos a monitorar:
1. Link Clique: Quando user clica no tracking link
   → PUT /api/tracking/click { link_id, timestamp, source_ip, device }
   → Atualiza `affiliation_links` (clicks++)

2. Marketplace Notificação: Quando produto é comprado
   → Hotmart / marketplace envia webhook
   → PUT /api/tracking/conversion { link_id, order_id, amount, commission }
   → Atualiza `affiliation_links` (conversions++, revenue++)
   → Atualiza `user_dispatches` (conversions++, roi += commission)

3. Frontend atualiza em tempo real (WebSocket)
   → Dashboard mostra badge "✓ Lucrou" na oferta
```

### PROMPTS PARA COPY GENERATOR (Maior Detalhe)

**Prompt 1 - Emocional (Instagram Reels)**
```
Você é um copywriter especializado em vendas de marketplace para redes sociais. Seu trabalho é escrever copies curtas que mexem com emoção e inspiram ação.

Produto: [product_title]
Preço: R$ [price]
Desconto: [discount%]
Mercado: [marketplace]

Escreva uma copy de 50-70 palavras focando em emoção. Como este produto muda a vida da pessoa? Qual o sentimento ao usar? Tom: coloquial, como amiga falando para amiga. Inclua CTA claro: "Clica no link da bio". Sem exclamações excessivas. Seja genuína.

Resposta (apenas o texto da copy):
```

**Prompt 2 - FOMO (WhatsApp/Telegram)**
```
Você é um copywriter que cria urgência e oportunidade.

Produto: [product_title]
Stock atual: [stock_level] unidades
Tendência: aumentou 150% de demanda em 2 horas

Escreva uma copy de 40-50 palavras com FOMO: oportunidade fugidora, stock limitado, todo mundo comprando. Tom: alerta, direto. CTA: "Manda mensagem agora antes que acabe". Sem panic, apenas fatos.

Resposta (apenas o texto):
```

**Prompt 3 - Barganha (TikTok/Instagram)**
```
Você destaca o desconto e o valor.

Produto: [product_title]
Preço Original: R$ [original_price]
Preço Desconto: R$ [discount_price]
Desconto: [discount%]

Escreva uma copy de 30-40 palavras focando APENAS no desconto. Tom: objetivo, direto. CTA: "Link nos comentários". Sem blabla.

Resposta (apenas o texto):
```

**Prompt 4 - Prova Social (Instagram Stories)**
```
Você monta prova social credível.

Produto: [product_title]
Compras nos últimos 2 dias: [X]
Grupos que compraram: [Y]

Escreva uma copy de 50 palavras dizendo que [X] pessoas compraram isso recentemente e amaram. Inclua um depoimento fictício mas MUITO realista (nome + resultado). Tom: próximo, como alguém contando experiência. CTA: "Veja os depoimentos no link".

Resposta (apenas o texto):
```

**Prompt 5 - CTA Curto (TikTok)**
```
Você cria gancho para vídeo.

Produto: [product_title]
Benefício chave: [X]

Escreva uma copy de 20-30 palavras: apenas o gancho, sem explicação. Tom: intrigante, visual. CTA: "Link nos comentários". Use emojis (máx 2).

Resposta (apenas o texto):
```

### PLAN DE FUNCIONALIDADES (MVP vs Fase 2 vs Fase 3)

**MVP (Semana 1-2):**
- Dashboard com grid de 10-15 ofertas (manual scrape ou API)
- Modal com 3 copies (emocional, FOMO, barganha)
- Botão "Copiar" (copia copy + link para clipboard)
- Histórico básico (últimas 10 ofertas usadas)
- Login simples (email/senha)
- Dispatch manual para Telegram (integração com bot pessoal)

**Fase 2 (Semana 3-4):**
- 5 ângulos de copy em vez de 3
- Integração com Hotmart/Awin para affiliate links
- Real-time offer updates (WebSocket)
- Image processing (remoção de marca d'água)
- Dispatch automático em horário agendado
- WhatsApp Business API (além de Telegram)
- Analytics básica (gráficos de conversão)

**Fase 3 (Semana 5+):**
- Machine learning de horário pico por produto/grupo
- Integração com 10 marketplaces (não só Shopee)
- Dashboard de múltiplas contas
- Integração com Instagram DM (opcional)
- A/B testing automático de copies
- Comunidade privada (grupo exclusivo de usuários)
- Consultoria 1-on-1 (para plano VIP)

### ENVIRONMENT VARIABLES (.env)
```
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/olho_do_mercado
JWT_SECRET=your_secret_key_here
OPENAI_API_KEY=sk-...
TELEGRAM_BOT_TOKEN=...
WHATSAPP_BUSINESS_API_TOKEN=...
HOTMART_CLIENT_ID=...
HOTMART_CLIENT_SECRET=...
AWIN_ADVERTISER_ID=...
AWIN_API_TOKEN=...
STRIPE_PUBLIC_KEY=...
STRIPE_SECRET_KEY=...
REDIS_URL=redis://localhost:6379
SENTRY_DSN=... (error tracking)
```

### DEPLOYMENT

**Frontend:** Vercel
- Push para repo GitHub
- Vercel auto-deploys em cada push
- Preview links automáticos

**Backend:** Render (ou Railway)
- Push para repo GitHub
- Render auto-deploys
- PostgreSQL managed database

**Job Scheduler (OfferMonitor):** Render background worker ou AWS Lambda
- Roda a cada 5 minutos
- Monitora marketplaces
- Atualiza banco

**Webhook Listener:** Backend Express
- Recebe eventos de Hotmart / Telegram / WhatsApp
- Atualiza conversões em tempo real

---

## INSTRUÇÃO FINAL PARA CODEX (ChatGPT)

Ao receber este arquivo AGENTS.md:
1. Leia tudo acima
2. Você é o agente de desenvolvimento que vai rodar em paralelo com Claude
3. Foque em:
   - Implementação robusta de APIs (Express routes bem testadas)
   - Database schema otimizado (indexes, constraints)
   - Security (JWT, password hashing, CORS)
   - Testing (unit tests, integration tests)
4. Comunique com Claude quando precisar sincronizar:
   - Frontend e Backend compartilham tipos TypeScript?
   - Qual a ordem de criação de features?
5. Avise ao usuário a cada milestone alcançado
6. Quando terminar: "Backend pronto. Aguardando frontend de Claude para integração."
