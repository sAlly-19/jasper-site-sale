# Correção da auditoria de dependências — 29/10/2026
Objetivo: desbloquear audit:runtime sem downgrade de Expo/Firebase nem audit fix --force.
Baseline reportado/reproduzido pela árvore: grpc1.9.16 em @firebase/firestore, node-forge1.4.0, re2js2.8.6, shell-quote1.10.0, source-map-js1.2.1, zod3.25.76 e deepmerge4.3.1.
Plano:
1. Atualizar transitivas com patches dentro das faixas permitidas (node-forge/re2js/shell-quote/source-map-js).
2. Override restrito a @firebase/firestore para grpc1.14.6; testar API/SDK sem rede real.
3. Aguardar decisão do usuário sobre Zod4.6.7 em @expo/cli; manter SDK57. Conferidos os dois schemas Expo que usam Zod; testar inputs válidos/inválidos, strict e parâmetros MCP.
4. Audit, npm ci --ignore-scripts, typecheck, build:web, testes de HTML/navegador locais.
5. Registrar low deepmerge sem correção publicada, não esconder achados nem reduzir o nível do gate. Sem commit/push/deploy.
Fontes: advisories GHSA-m9gg-hp2v-232j, GHSA-f596-whhp-79r4, GHSA-pqg4-j6r4-53mv, GHSA-mrhx-c7xc-m3w5, GHSA-gcqx-w48m-w2h4 e registro npm.
Status: concluído localmente; overrides aprovados, gates de produção passaram. Restam alertas baixos no site e alertas de desenvolvimento separados.

## Continuidade

Usuário aprovou o override pontual Zod4 com testes. root: @expo/cli -> zod4.6.7, @firebase/firestore -> grpc1.14.6. Patches no lock: node-forge1.4.2, re2js2.9.1, shell-quote1.12.0, source-map-js1.2.2. Expo57.0.24/Firebase12.19.0 preservados.
Audit root após correções: exit0, somente7low decorrentes de deepmerge sem patch publicado. Nenhum --force/--legacy-peer-deps, exclusão de auditoria ou redução de nível.
Testes reais dos schemas Expo Plugin/DevTools/MCP (valid/invalid/strict) e API Firestore/gRPC passaram2/2 antes e após override; typecheck passou. Teste incluído nos workflows site/deploy.
Segundo gate do mesmo CI (worker) também revelou Zod antigo: atualização dentro da faixa4 já declarada em execução. Auditar e testar Worker antes de finalizar.
Instalação root npm ci --ignore-scripts em andamento; avisos preexistentes de peeroptionalworklets e Node26.8.2 fora da engine24 registrados, não ocultados.
Revisão independente somente leitura: sem Critical/Important concretos; limite de chamadas Expo instaladas durante npm ci; recomendação de ligar teste ao CI atendida. Não alegar cobertura de todos os recursos nativos/MCP apenas pelo build web.
Sem commit, push, deploy ou mudança de segredos. Próximos: coletar ci, build web, testes de privacidade, worker tests/audit e registrar resultados finais.
## Resultado final

- npm ci --ignore-scripts (site): PASS, lock reproduzido. Sem --force/--legacy-peer-deps.
- npm ci --ignore-scripts (worker): PASS, lock reproduzido com Zod4.6.7.
- npm run audit:runtime (site): exit0,0high/0critical,7low relacionados ao deepmerge e sua cadeia. Não zerado nem omitido: advisory GHSA-gcqx-w48m-w2h4 não tem patch publicado.
- npm run audit:runtime (worker): exit0,0 vulnerabilidades de produção.
- node --test test/dependency-compat.test.mjs:2/2 PASS depois da instalação limpa. Schemas reais Expo/Zod4, MCP strict e API gRPC/Firestore sem requests externos.
- npm run typecheck (site e worker): PASS.
- npm run build:web: PASS, Expo57 e Firebase12 preservados, seis rotas exportadas incluindo /privacidade.
- node --test test/privacy-page.test.mjs:2/2 PASS; navegador sem JS/sem rede externa em1440 e390:PASS.
- npm test no Worker:14/14 PASS em4 arquivos.
- YAML dos dois workflows validado; teste de compatibilidade incluído exatamente uma vez em cada fluxo, gates audit existentes preservados.
- Scanner existente:166 arquivos rastreados sem achados; git diff --check:PASS. Novos testes/plano revisados sem credenciais, scanner não afirma cobertura de arquivos novos.
- Total incluindo dev ainda11 achados no site (7low/2moderate/2high) e8 no worker (2moderate/6high); fora dos gates omit=dev, não alegar zero global.

Limitações: localNode26.8.2 fora da engine24; CI usaNode24 e deve ser reexecutado após subir os arquivos. Recursos nativos do Expo não foram testados; alvo deste repositório é a exportação web. Revisão independente somente leitura não identificou Critical/Important no diff; não houve re-review. Nenhum commit, push, deploy, publicação de pacote ou alteração de segredos foi executado.
Arquivos a subir: package.json, package-lock.json, worker/package-lock.json, os dois workflows, test/dependency-compat.test.mjs e este plano. Logs locais ficam fora do repo do site em ../jasper-avatar/.superpowers/site-dependency-audit.