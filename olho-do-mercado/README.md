# Olho do Mercado

Painel de afiliados com React, Tailwind CSS e um backend Express. O modo de demonstração carrega 12 ofertas Shopee fictícias, prepara cinco textos por oferta e registra envios simulados em um banco local.

## Desenvolvimento

Use Node.js 22.12 ou superior e npm. Na raiz do repositório, execute:

```sh
cd olho-do-mercado
npm install
cp .env.example .env
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). O servidor da API usa a porta 3001. A conta local padrão é `demo@olhodomercado.local`, com senha `OlhoDemo2026!`. Use **Usar Este**, selecione um dos cinco ângulos e clique em **Copiar**. A cópia inclui o link de rastreamento. O envio de teste fica em **Análises**.

Sem `DATABASE_URL`, o servidor usa PGlite com dados persistentes em `.local-db/`. Com `DATABASE_URL`, usa um servidor PostgreSQL. Em desenvolvimento, `DEMO_MODE=false` desliga a criação de dados de demonstração. O banco aplica o esquema na inicialização. Para criar uma conta adicional, desligue a instância local se usar PGlite e defina `USER_EMAIL` e `USER_PASSWORD` no ambiente antes de executar `npm run user:create`.

## Testes

```sh
npm test
npm run build
```

Com `npm run dev` rodando, execute `BROWSER_EXECUTABLE=/caminho/do/chromium npm run test:e2e` em outro terminal. Se preferir instalar o Chromium do Playwright, use `npx playwright-core install chromium` e depois `npm run test:e2e`. Por padrão, o teste usa a conta de demonstração e registra um envio simulado. Para usar outra instância, configure `TEST_WEB_URL`, `DEMO_EMAIL` e `DEMO_PASSWORD`.

## Integrações

| Função | Status |
| --- | --- |
| Ofertas Shopee | Dados fictícios locais. Os links apontam para a busca da Shopee. |
| Geração de copy | Textos locais por padrão. Use `OPENAI_API_KEY` e `COPY_MODEL` para um modelo GPT-4.x. Para um endpoint compatível com Chat Completions, configure `COPY_API_BASE_URL` e `COPY_MODEL`. As copies já persistidas continuam em cache. |
| Imagens | Passagem da imagem original, quando cadastrada. O catálogo de demonstração usa ícones. |
| Afiliação | Redirecionamento com UTM e contador de cliques. Hotmart e Awin são integrações futuras. |
| Telegram e WhatsApp | Simulação registrada no histórico. |
| Analytics | Envios, cliques e campos para conversões, comissões e ROI. ROI aparece quando há investimento registrado, pela fórmula (comissão − investimento) ÷ investimento. Webhooks e cadastro de investimento ficam para a próxima fase. O gráfico por hora usa o horário de envio em São Paulo. |
| WebSocket | Cliente opcional. `VITE_OFFERS_WS_URL` habilita escuta do texto `offers.updated`. O servidor WebSocket fica para uma próxima fase. Em produção, use a mesma origem ou configure a diretiva CSP de conexão. |

## Deployment

O Express pode servir o build React junto com a API, mantendo dashboard e autenticação na mesma origem. Em uma hospedagem Node, use `olho-do-mercado/` como diretório raiz, `npm ci && npm run build` como comando de build e `npm start` como comando de inicialização. Defina `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` aleatório de pelo menos 32 caracteres e `PUBLIC_URL` com o domínio público HTTPS. Configure `TRUST_PROXY_HOPS` conforme a topologia da hospedagem. Use `/api/health` como caminho de verificação. Na implantação, provisione o primeiro usuário pelo comando acima e importe ofertas reais no PostgreSQL.

Para hospedar o frontend na Vercel e o Express no Render ou Railway, publique `dist/` e encaminhe `/api/*` ao Express antes do fallback das rotas React para `index.html`. Use o endereço da Vercel em `PUBLIC_URL` para os links de rastreamento. Aplique a configuração do domínio e do proxy em cada ambiente.

Consulte [BUSINESS.md](BUSINESS.md) para planos e projeções comerciais.
