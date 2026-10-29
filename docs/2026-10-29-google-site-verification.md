# Verificação de propriedade Google — 29/10/2026

Usuário salvou o arquivo na raiz do site. Encontrado e movido para public/googled4641c7afd5fb1fc.html, preservando nome/conteúdo e SHA256 na movimentação. O token é um arquivo público de verificação de site, não uma credencial de API.
Firebase Hosting ajustado: cleanUrls:false para preservar o endereço exato .html; rewrites explícitos de /privacidade e /_sitemap antes do fallback mantêm essas rotas estáticas. Diretório /admin/index.html permanece sem alteração. Não foi alterada autenticação, checkout, regras ou qualquer segredo.
npm run build:web:PASS; export confirmou o arquivo Google com bytes idênticos. node --test test/privacy-page.test.mjs test/google-site-verification.test.mjs:4/4 PASS. Testes observados RED antes da implementação, GREEN depois. Scanner existente168 arquivos rastreados, whitespace sem erro. Nenhum pacote/dependência modificado.

## Próximo passo do usuário

Subir as alterações no jasper-site-sale, executar Manual Firebase Production Deploy e abrir https://jasper-avatar.firebaseapp.com/googled4641c7afd5fb1fc.html sem login. Deve retornar somente a identificação de verificação, não a homepage. Então clicar Verificar no Search Console para o prefixo https://jasper-avatar.firebaseapp.com/.
Não remover o arquivo após verificar: ele mantém a comprovação de propriedade. Após confirmar propriedade, aguardar as24 horas solicitadas pela tela OAuth e pedir nova verificação de branding. Arquivo publicado não é, sozinho, confirmação de propriedade ou aprovação Google.
Sem commit, push, deploy ou acesso autenticado ao Search Console executados pelo agente. Branch main preservada. Ambiente localNode26 fora da engine24, já registrado no plano de dependências.
