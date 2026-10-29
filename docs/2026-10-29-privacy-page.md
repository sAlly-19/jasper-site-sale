# Página pública de privacidade — 29/10/2026
Pedido: criar página para o usuário subir ao GitHub. Repositório: jasper-site-sale, main; baseline limpo. Sem commit, push ou deploy.
Responsável: Alisson Maciel Ferreira Santos (PF), alissontar18@gmail.com.
Escopo: rota Expo estática /privacidade, identidade visual existente, índice de seções, contato e link de rodapé localizado. Não alterar checkout, autenticação ou coleta de dados.
Fontes de conteúdo: rascunho do aplicativo, Landing.tsx (localStorage/sessionStorage), firebase.ts (Analytics condicional), worker/schema (compras/licenças/IP rate limit).
Verificações: teste de HTML exportado RED antes da rota; typecheck, build:web, teste de HTML GREEN e navegador desktop/mobile sem overflow. Testes apenas locais; não usar checkout nem APIs de produção.
A política não certifica aprovação OAuth/LGPD. Não prometer retenção zero, criptografia de todos os dados, ausência de cookies ou que conteúdo de e-mail nunca é enviado a IA.
Estado: concluído localmente; publicação a cargo do usuário.

## Resultado

- app/privacidade.tsx: página em português, título/metadados, contato informado, índice/âncoras, cookies/Analytics condicional, compras/licenças, Google/Gmail, IA, retenção e direitos. Não contém notas editoriais ou promessa de aprovação OAuth.
- Landing.tsx: link de rodapé /privacidade com rótulo pt/en/es; texto da política permanece em português.
- firebase.json: cleanUrls:true para servir privacidade.html em /privacidade antes do fallback SPA.
- src/styles/compiled.css atualizado pelo build, necessário às classes da página.
- npm run typecheck: PASS. npm run build:web: PASS, exportou /privacidade como HTML próprio (44KB).
- node --test test/privacy-page.test.mjs:2/2 PASS (RED antes da rota e antes de cleanUrls, GREEN após implementação).
- node test/privacy-page.browser.mjs: PASS desktop1440/celular390, HTML sem JavaScript, rede externa bloqueada, sem overflow, índice e link de rodapé conferidos. Capturas inspecionadas em ../jasper-avatar/.superpowers/privacy-page-qa.
- git diff --check: PASS; scanner existente:162 arquivos rastreados sem achados (não alegar que cobre novos arquivos). Novos arquivos revisados, apenas conteúdo público/contato e testes, sem credenciais.
- Revisão independente somente leitura: nenhum Critical/Important. Minor preexistente: app/+html.tsx restringe zoom; mantido fora do escopo.
- AmbienteNode26.8.2 fora da engine24 do projeto; não alegar validação emNode24. Build avisou apenas NO_COLOR/FORCE_COLOR, sem falha.

## Publicação e limites

Sem commit, push ou deploy deste agente. Repositório em main; baseline estava limpo. Usuário deve subir as alterações deste repositório (jasper-site-sale), incluindo página, configuração, estilos e rodapé. Após deploy, conferir /privacidade sem login e preencher o link no Google. GitHub por si só não comprova publicação bem-sucedida.
O texto descreve a implementação local e não certifica aprovação Google/conformidade jurídica. O fluxo Gmail→IA continua sujeito aos requisitos dos prestadores e aos gates comerciais do aplicativo. Nenhuma alteração de checkout, autenticação, analytics, regras ou segredos foi realizada.