# Jasper API Worker

Backend sem estado em Cloudflare Workers Free, com persistência no D1 Free.

## Responsabilidades

- criar pedidos com preço autoritativo em BRL;
- publicar o catálogo de checkout em `GET /v1/catalog`, com valores inteiros em centavos;
- criar preferências no Mercado Pago;
- validar assinatura do webhook e consultar o pagamento na API do provedor;
- emitir chaves aleatórias armazenando somente HMAC;
- vincular uma licença a uma instalação e emitir leases Ed25519 de até 72 horas;
- manter promoções, licenças e dispositivos pelo painel autenticado com Firebase JWT;
- remover eventos e dados temporários após 30 dias pelo cron diário.

## Segredos

Use `npm run secrets:generate` para gerar os valores criptográficos. Em produção, configure cada item de `.dev.vars.example` com `npx wrangler secret put NOME --env production`. Nunca coloque secrets em `wrangler.toml`.

O `LEASE_PUBLIC_JWK` não é confidencial, mas continua configurado como variável para que o desktop obtenha exatamente a chave correspondente ao private key ativo.

## D1

```bash
npm run db:migrate:local
node scripts/upsert-admin.mjs local FIREBASE_UID admin@exemplo.com
```

Para produção, crie o banco, substitua `database_name` e `database_id` em `wrangler.toml`, revise os demais placeholders e só então execute explicitamente:

```bash
npm run db:migrate:production
node scripts/upsert-admin.mjs production FIREBASE_UID admin@exemplo.com --confirm-production
```

## Testes

```bash
npm run typecheck
npm test
```

As rotas administrativas exigem um Firebase ID token válido e um UID ativo na tabela `admins`. As rotas públicas têm CORS por allowlist e rate limit no D1.

## Preço e moedas

`PRODUCT_PRICE_BRL_CENTS` é a fonte autoritativa para pedidos. O valor atual é `49700`, equivalente a R$ 497,00 por licença antes dos descontos progressivos ou promocionais. `PRODUCT_PRICE_USD_CENTS=14900` e `PRODUCT_PRICE_EUR_CENTS=12900` definem, respectivamente, os preços regionais exibidos em inglês e espanhol.

O site pode exibir preços regionais próprios em USD e EUR, mas a conta brasileira do Mercado Pago liquida o Checkout Pro em BRL. Por isso, o site cria o pedido primeiro e exige uma confirmação separada do total em reais devolvido pelo Worker antes do redirecionamento.

## Rotas públicas principais

| Método | Rota | Finalidade |
|---|---|---|
| `GET` | `/health` | Estado básico do Worker |
| `GET` | `/v1/catalog` | Produto, preço BRL, limite e descontos por quantidade |
| `POST` | `/v1/orders` | Cria o snapshot autoritativo e a preferência de pagamento |
| `GET` | `/v1/orders/:id` | Consulta autenticada pelo token secreto do pedido |
| `POST` | `/v1/webhooks/mercado-pago` | Recebe e verifica eventos do Mercado Pago |
