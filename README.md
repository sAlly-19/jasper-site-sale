# Jasper Site Sale

Site comercial e painel administrativo do Jasper Avatar. O frontend é uma exportação estática do Expo Web; o Firebase existente fornece Authentication e o CMS público, enquanto o Cloudflare Worker + D1 concentra checkout, promoções, pagamentos e licenças.

## Arquitetura

- Firebase Authentication: login do administrador no mesmo projeto Firebase de produção.
- Cloud Firestore: somente `site_config` e a whitelist `admins`; licenças não são acessíveis pelo cliente.
- Cloudflare Worker + D1 Free: pedidos, promoções, webhooks Mercado Pago, licenças e dispositivos.
- Mercado Pago Checkout Pro: o preço é recalculado no servidor e chaves só são emitidas após confirmação do pagamento consultada diretamente na API.
- Jasper Desktop: ativa a licença pelo Worker e mantém um lease Ed25519 offline de até 72 horas.

## Desenvolvimento

```bash
npm install
npm run web
```

O frontend usa as variáveis de [`.env.example`](./.env.example). Para desenvolvimento local, use `EXPO_PUBLIC_JASPER_API_URL=http://localhost:8787`.

Em outro terminal:

```bash
cd worker
npm install
npm run secrets:generate
npm run db:migrate:local
npm run dev
```

Copie `.dev.vars.example` para `.dev.vars` e preencha somente com credenciais de teste. O gerador imprime os peppers, a chave AES-GCM e o par Ed25519 necessários; ele não altera arquivos nem serviços remotos.

## Administrador

Defina `FIREBASE_SERVICE_ACCOUNT_PATH` apontando para a conta de serviço local ignorada pelo Git e execute:

```bash
npm run create-admin -- admin@exemplo.com "uma-senha-forte-com-12-caracteres"
```

O script mostra o UID criado. Cadastre o mesmo UID no D1 local:

```bash
cd worker
node scripts/upsert-admin.mjs local FIREBASE_UID admin@exemplo.com
```

O cadastro remoto exige, de propósito, `production` e `--confirm-production`. Não há sincronização automática entre Firestore e D1.

## Verificação

Os testes das regras exigem JDK 21 ou superior para o Firebase Emulator.

```bash
npx tsc --noEmit
npm run test:rules
npm run build:web
cd worker
npm run typecheck
npm test
```

## Produção

Antes de qualquer deploy, substitua todos os placeholders de `[env.production]` em [`worker/wrangler.toml`](./worker/wrangler.toml), crie o D1 Free, configure os secrets com `wrangler secret put`, aplique a migration e cadastre o UID administrativo. O webhook do Mercado Pago deve apontar para `/v1/webhooks/mercado-pago`.

Nenhum script de configuração deste repositório faz deploy automaticamente. As chaves completas de licença são exibidas apenas na entrega do pedido aprovado ou no instante de uma emissão administrativa.
