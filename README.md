# 🌌 Jasper Avatar Platform (Web & Mobile Foundation)

Plataforma comercial e console administrativo de alta performance para o ecossistema **Jasper Avatar**, desenvolvida em **Expo SDK 57** Web-first, com backend **Firebase JS SDK**, design *Cyberpunk Holographic HUD Luxury*, efeitos parallax suaves, internacionalização nativa (PT-BR, EN, ES) com conversão monetária dinâmica e sistema de licenciamento restrito por máquina (*Node-Locking*).

---

## ⚡ Tecnologias e Arquitetura

- **Framework**: Expo SDK 57 (`expo@~57.0.24`, `react-native@0.86.3`, `react@19.2.3`).
- **Roteamento**: `expo-router` com File-based routing e renderização estática.
- **Backend & Banco de Dados**: Firebase JS SDK modular (`firebase@^12.19.0`) — 100% compatível com Web e Mobile, sem dependências nativas:
  - **Firebase Authentication**: Autenticação restrita com validação de Custom Claims e Whitelist.
  - **Cloud Firestore**: Coleções `licenses` (chaves de clientes com HWID), `site_config` (CMS dinâmico) e `promotions` (campanhas de desconto com contagem regressiva).
- **Scripts Administrativos**: Firebase Admin SDK (`firebase-admin@^14.4.0`) para gerenciamento seguro via linha de comando.
- **Internacionalização (i18n)**: Suporte dinâmico a 3 idiomas (Português, Inglês e Espanhol) e formatação monetária automática (`BRL`, `USD`, `EUR`) via `Intl.NumberFormat`.
- **UI/UX Cyber-Luxury**: Paleta *Void* (`#04060c`), *Abyss* (`#070b14`), *Neon Cyan* (`#3ff2ff`) e *Lime* (`#c8ff4d`), scanlines CRT, molduras HUD holográficas, anel orbital SVG animado e tipografias `Unbounded`, `Space Grotesk` e `JetBrains Mono`.

---

## 📂 Estrutura do Projeto

```
├── app/
│   ├── +html.tsx                # Template raiz HTML (scroll nativo, fonts e estilos globais)
│   ├── _layout.tsx              # Root Layout
│   ├── index.tsx                # Rota pública: Landing Page comercial (/)
│   └── admin/
│       ├── _layout.tsx          # Layout do console
│       ├── index.tsx            # Rota administrativa (/admin)
│       └── [...all].tsx         # Rota de captura para sub-abas do admin (/admin/*)
├── src/
│   ├── components/
│   │   ├── motion.ts            # Motores de aceleração: ParallaxEngine e RevealEngine
│   │   ├── landing/
│   │   │   └── Landing.tsx      # Landing Page comercial completa (Hero, Módulos, Preços, FAQ)
│   │   └── admin/
│   │       ├── AdminApp.tsx     # Console administrativo e formulário seguro Firebase Auth
│   │       ├── KeysPanel.tsx    # Gestão de licenças (CRUD, status, busca e Node-Locking)
│   │       ├── PromosPanel.tsx  # Gestor de campanhas, descontos e banners dinâmicos
│   │       └── CmsPanel.tsx     # Editor de conteúdo CMS (Textos, Estrutura, Mídias e FAQ)
│   ├── config/
│   │   ├── firebase.ts          # Singleton oficial do Firebase (Auth, Firestore, Analytics)
│   │   └── theme.ts             # Tokens de estilo e cores do projeto
│   ├── lib/
│   │   ├── content.ts           # Conteúdo padrão multilíngue e fallbacks
│   │   └── i18n.ts              # Utilitários de internacionalização e moedas
│   ├── services/
│   │   ├── firebaseAuthService.ts   # Autenticação estrita e verificação de administradores
│   │   ├── firestoreAdminService.ts # Serviços de persistência e validação de chaves
│   │   └── desktopLicenseClient.ts  # Cliente de referência para o Jasper Desktop (HWID)
│   ├── utils/
│   │   ├── keyGenerator.ts      # Gerador de chaves formatadas (JASPER-LT-XXXX-XXXX)
│   │   └── validators.ts        # Validadores de e-mail e telefone
│   └── types/                   # Tipagens TypeScript estritas
├── scripts/
│   ├── createAdmin.js           # Utilitário para cadastrar/promover administradores
│   ├── seedFirestore.js         # Povoamento inicial das coleções no Cloud Firestore
│   └── testFirebase.js          # Verificador de conectividade com o Firebase
├── firestore.rules              # Regras oficiais de segurança do Cloud Firestore
├── .env.example                 # Modelo de variáveis de ambiente
└── package.json                 # Dependências e scripts do projeto
```

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js versão 18 ou superior.
- Conta e projeto configurados no [Google Firebase Console](https://console.firebase.google.com).

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Executar o Servidor de Desenvolvimento
```bash
npm run web
```
Acesse `http://localhost:8081` no navegador.

### 4. Build de Produção (Export Estático Web)
```bash
npm run build:web
```
Gera a distribuição estática otimizada na pasta `dist/`.

---

## 🔒 Segurança e Gestão de Administradores

A área administrativa (`/admin`) conta com **blindagem criptográfica no Firebase**:

1. **Sem senhas em texto puro**: Acesso exclusivo por contas autenticadas no Firebase Auth.
2. **Validação de Administrador em Duas Camadas**:
   - Custom Claim `{ admin: true }` no token JWT.
   - Registro do UID/E-mail na coleção `/admins` do Cloud Firestore.
3. **Regras Estritas no Banco ([`firestore.rules`](./firestore.rules))**:
   - `site_config` e `promotions`: Leitura pública, gravação exclusiva de admins.
   - `licenses`: Leitura e gravação **bloqueadas** para o público, acessíveis somente por administradores (`isAdmin()`).

### Como Cadastrar um Administrador:
Utilize o script com a chave de serviço administrativa:
```bash
node scripts/createAdmin.js seu-email@exemplo.com SuaSenhaForte123!
```

---

## 🔑 Sistema de Licenças e Restrição de Máquina Única (*Node-Locking*)

Cada chave emitida no painel administrativo possui o ciclo de vida completo de gestão e suporte a bloqueio por hardware:

### Recursos no Painel ([`KeysPanel.tsx`](./src/components/admin/KeysPanel.tsx)):
- **Emitir Chave**: Gera chaves no formato `JASPER-LT-XXXX-XXXX` vinculadas a Nome, E-mail, WhatsApp e Observações.
- **Alterar Dados**: Modal para editar nome, contatos e notas internas do cliente a qualquer momento.
- **Ativar / Desativar**: Permite suspender temporariamente o acesso do cliente sem revogar sua chave.
- **Revogar**: Invalidação definitiva da licença com registro de data/hora.
- **Excluir**: Remove a licença permanentemente da base de dados.
- **Liberar Máquina (Reset de HWID)**: Se o cliente formatar o computador ou trocar de hardware, o administrador clica em **"Liberar Máquina"** para permitir nova vinculação.

### Como funciona o bloqueio por Hardware ID (HWID):
1. **Impressão Digital**: O futuro aplicativo cliente (**Jasper Desktop**) extrai o identificador exclusivo da máquina do usuário (UUID da Placa-Mãe + CPU ID + Serial do Disco) e calcula um hash SHA-256 (`HWID-XXXX-XXXX`).
2. **Primeira Ativação**: Ao inserir a chave, o Jasper Desktop envia o HWID. O Firebase grava o identificador e vincula a chave àquele computador.
3. **Bloqueio em Outro PC**: Se a chave for inserida em um computador com HWID diferente, o sistema **rejeita a inicialização**, alertando que a licença já pertence a outro computador.
4. **Módulo de Referência Desktop**: O arquivo [`desktopLicenseClient.ts`](./src/services/desktopLicenseClient.ts) contém a implementação base pronta para ser consumida pelo Jasper Desktop.

---

## 🛠️ Scripts NPM Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run web` | Inicia o servidor de desenvolvimento Expo para Web |
| `npm run build:web` | Compila o build estático otimizado para produção na pasta `dist/` |
| `npm run seed` | Popula o Firestore com as configurações iniciais de CMS, cupons e licenças |
| `npm run create-admin` | Cria ou atualiza uma conta de administrador com privilégios completos |

---

## 📄 Licença
Propriedade privada de **Jasper Avatar Platform** © 2026. Todos os direitos reservados.
