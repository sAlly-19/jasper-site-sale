import type { Locale } from "./i18n";

export type Localized = { "pt-BR"?: string; en?: string; es?: string };
export type FaqItem = { q: string; a: string };
export type FaqList = Record<Locale, FaqItem[]>;

export interface Promo {
  id: string;
  code: string;
  title: Localized;
  discountPercent: number;
  endsAt: string | null;
}

export interface Media {
  heroAvatar: string;
  hud: string;
}

export interface Prices {
  BRL: number;
  USD: number;
  EUR: number;
  BRL_original: number;
  USD_original: number;
  EUR_original: number;
  [k: string]: number;
}

export interface LandingData {
  content: Record<string, Localized>;
  sections: Record<string, boolean>;
  media: Media;
  prices: Prices;
  faq: FaqList;
  promo: Promo | null;
}

/* ------------------------------------------------------------------ */
/*  Default copy (3 locales) — CMS values in the DB override these.   */
/* ------------------------------------------------------------------ */

export const defaultContent: Record<string, Localized> = {
  "hero.eyebrow": {
    "pt-BR": "Assistente de voz 3D · Lip-sync · 17 módulos de autonomia",
    en: "3D voice assistant · Lip sync · 17 autonomy modules",
    es: "Asistente de voz 3D · Lip sync · 17 módulos de autonomía",
  },
  "hero.title": {
    "pt-BR": "SEU DESKTOP",
    en: "YOUR DESKTOP",
    es: "TU ESCRITORIO",
  },
  "hero.accent": {
    "pt-BR": "REIMAGINADO",
    en: "REIMAGINED",
    es: "REIMAGINADO",
  },
  "hero.subtitle": {
    "pt-BR":
      "Jasper é um avatar 3D que conversa por voz em tempo real, analisa sua tela com consentimento e pilota 17 módulos de autonomia no Windows.",
    en:
      "Jasper is a 3D avatar that talks in real time, analyzes your screen with consent, and runs 17 autonomy modules on Windows.",
    es:
      "Jasper es un avatar 3D que conversa en tiempo real, analiza tu pantalla con consentimiento y ejecuta 17 módulos de autonomía en Windows.",
  },
  "hero.cta": {
    "pt-BR": "GARANTIR ACESSO VITALÍCIO",
    en: "GET LIFETIME ACCESS",
    es: "CONSEGUIR ACCESO DE POR VIDA",
  },
  "hero.ctaGhost": {
    "pt-BR": "EXPLORAR OS MÓDULOS",
    en: "EXPLORE THE MODULES",
    es: "EXPLORAR LOS MÓDULOS",
  },
  "about.eyebrow": {
    "pt-BR": "Estação de comando",
    en: "Command station",
    es: "Estación de mando",
  },
  "about.title": {
    "pt-BR": "Não é um chatbot. É uma estação de comando.",
    en: "Not a chatbot. A command station.",
    es: "No es un chatbot. Es una estación de mando.",
  },
  "about.body": {
    "pt-BR":
      "Construído sobre Electron, Three.js e princípios local-first, o HUD holográfico do Jasper roda a 60 FPS com malha neural animada, visualizador de espectro de áudio e memória semântica persistente. Você fala, ele enxerga, pensa e age — sem enviar seus dados para servidores de terceiros.",
    en:
      "Built on Electron, Three.js and local-first principles, Jasper's holographic HUD runs at 60 FPS with an animated neural mesh, audio spectrum visualizer and persistent semantic memory. You speak — it sees, thinks and acts, without shipping your data to third-party servers.",
    es:
      "Construido sobre Electron, Three.js y principios local-first, el HUD holográfico de Jasper corre a 60 FPS con malla neural animada, visualizador de espectro de audio y memoria semántica persistente. Tú hablas — él ve, piensa y actúa, sin enviar tus datos a servidores de terceros.",
  },
  "modules.eyebrow": {
    "pt-BR": "17 módulos de autonomia",
    en: "17 autonomy modules",
    es: "17 módulos de autonomía",
  },
  "modules.title": {
    "pt-BR": "AUTONOMIA TOTAL DO SISTEMA",
    en: "TOTAL SYSTEM AUTONOMY",
    es: "AUTONOMÍA TOTAL DEL SISTEMA",
  },
  "modules.subtitle": {
    "pt-BR":
      "Cada serviço roda em segundo plano, com transparência total: operação real ou modo simulação, sempre declarado na interface.",
    en:
      "Every service runs in the background with total transparency: real operation or simulation mode, always declared in the UI.",
    es:
      "Cada servicio corre en segundo plano con total transparencia: operación real o modo simulación, siempre declarado en la interfaz.",
  },
  "security.eyebrow": {
    "pt-BR": "Zero-trust por padrão",
    en: "Zero-trust by default",
    es: "Zero-trust por defecto",
  },
  "security.title": {
    "pt-BR": "SEU PC. SUAS REGRAS.",
    en: "YOUR PC. YOUR RULES.",
    es: "TU PC. TUS REGLAS.",
  },
  "security.body": {
    "pt-BR":
      "Criptografia DPAPI para credenciais, firewall anti-SSRF em webhooks, allowlists para automações locais, redação automática de segredos e bloqueio de comandos de alto risco com autorização na tela. Profundidade de defesa em cada camada.",
    en:
      "DPAPI encryption for credentials, an anti-SSRF firewall on webhooks, allowlists for local automation, automatic secret redaction and on-screen approval for high-risk commands. Defense in depth at every layer.",
    es:
      "Cifrado DPAPI para credenciales, firewall anti-SSRF en webhooks, listas de permitidos para automatizaciones locales, redacción automática de secretos y aprobación en pantalla para comandos de alto riesgo. Defensa en profundidad en cada capa.",
  },
  "pricing.eyebrow": {
    "pt-BR": "Acesso vitalício",
    en: "Lifetime access",
    es: "Acceso de por vida",
  },
  "pricing.title": {
    "pt-BR": "PAGUE UMA VEZ. SEJA DONO PARA SEMPRE.",
    en: "PAY ONCE. OWN IT FOREVER.",
    es: "PAGA UNA VEZ. SE SUYO PARA SIEMPRE.",
  },
  "pricing.subtitle": {
    "pt-BR":
      "Sem assinatura. Sem mensalidade. Sem surpresas. Uma licença, atualizações incluídas e suporte direto com o desenvolvedor.",
    en:
      "No subscription. No monthly fee. No surprises. One license, updates included, direct support from the developer.",
    es:
      "Sin suscripción. Sin mensualidad. Sin sorpresas. Una licencia, actualizaciones incluidas y soporte directo del desarrollador.",
  },
  "pricing.cta": {
    "pt-BR": "ATIVAR ACESSO VITALÍCIO",
    en: "ACTIVATE LIFETIME ACCESS",
    es: "ACTIVAR ACCESO DE POR VIDA",
  },
  "pricing.guarantee": {
    "pt-BR": "Garantia de 7 dias · Atualizações incluídas · 1 licença por máquina",
    en: "7-day guarantee · Updates included · 1 license per machine",
    es: "Garantía de 7 días · Actualizaciones incluidas · 1 licencia por máquina",
  },
  "pricing.included.1": {
    "pt-BR": "Avatar 3D com lip-sync e 17 módulos de autonomia",
    en: "3D avatar with lip sync and 17 autonomy modules",
    es: "Avatar 3D con lip sync y 17 módulos de autonomía",
  },
  "pricing.included.2": {
    "pt-BR": "Wake word local treinado com TensorFlow.js",
    en: "Local wake word trained with TensorFlow.js",
    es: "Wake word local entrenada con TensorFlow.js",
  },
  "pricing.included.3": {
    "pt-BR": "Suporte vitalício direto com o desenvolvedor",
    en: "Lifetime direct support with the developer",
    es: "Soporte de por vida directo con el desarrollador",
  },
  "pricing.included.4": {
    "pt-BR": "Todos os releases futuros da estação de comando",
    en: "All future releases of the command station",
    es: "Todos los releases futuros de la estación de mando",
  },
  "faq.eyebrow": {
    "pt-BR": "Ficha técnica",
    en: "Spec sheet",
    es: "Ficha técnica",
  },
  "faq.title": {
    "pt-BR": "PERGUNTAS FREQUENTES",
    en: "FREQUENTLY ASKED",
    es: "PREGUNTAS FRECUENTES",
  },
  "final.title": {
    "pt-BR": "PRONTO PARA ACORDAR O JASPER?",
    en: "READY TO WAKE UP JASPER?",
    es: "¿LISTO PARA DESPIRTAR A JASPER?",
  },
  "final.body": {
    "pt-BR":
      "Instalação em minutos. Sua chave de Gemini gratuita no AI Studio e o HUD holográfico no seu desktop.",
    en:
      "Install in minutes. Your free Gemini key from AI Studio and the holographic HUD on your desktop.",
    es:
      "Instalación en minutos. Tu clave gratuita de Gemini en AI Studio y el HUD holográfico en tu escritorio.",
  },
  "final.cta": {
    "pt-BR": "COMEÇAR AGORA",
    en: "START NOW",
    es: "EMPEZAR AHORA",
  },
  "footer.tagline": {
    "pt-BR":
      "Construído com Electron, Three.js e princípios local-first. Licença MIT para fins educacionais.",
    en:
      "Built with Electron, Three.js and local-first principles. MIT licensed for educational use.",
    es:
      "Construido con Electron, Three.js y principios local-first. Licencia MIT para uso educativo.",
  },
};

export const defaultSections: Record<string, boolean> = {
  about: true,
  modules: true,
  security: true,
  pricing: true,
  faq: true,
  final: true,
};

export const defaultMedia: Media = {
  heroAvatar: "/assets/screenshots/01_avatar_hud.png",
  hud: "/assets/screenshots/02_autonomy_modules.png",
};

export const defaultPrices: Prices = {
  BRL: 497,
  USD: 149,
  EUR: 129,
  BRL_original: 497,
  USD_original: 149,
  EUR_original: 129,
};

export const defaultFaq: FaqList = {
  "pt-BR": [
    {
      q: "É uma assinatura?",
      a: "Não. O modelo é exclusivamente Lifetime: você paga uma única vez e recebe a licença vitalícia, com todos os updates futuros incluídos.",
    },
    {
      q: "Preciso pagar por alguma API?",
      a: "Uma chave do Google Gemini via AI Studio é necessária para a conversa por voz. Os módulos locais não exigem uma assinatura adicional do Jasper.",
    },
    {
      q: "Funciona sem internet?",
      a: "O raciocínio avançado usa o Gemini via internet. Wake word, memória semântica e monitoramento de hardware rodam localmente. A licença pode ficar até 72 horas sem nova verificação.",
    },
    {
      q: "Como recebo minha chave de acesso?",
      a: "Após a aprovação do pagamento, suas chaves aparecem na tela de confirmação. Cada chave libera o HUD em uma máquina.",
    },
  ],
  en: [
    {
      q: "Is it a subscription?",
      a: "No. The model is exclusively Lifetime: you pay once and receive a lifetime license, with every future update included.",
    },
    {
      q: "Do I need to pay for any API?",
      a: "A Google Gemini key from AI Studio is required for voice conversations. Local modules do not require an additional Jasper subscription.",
    },
    {
      q: "Does it work offline?",
      a: "Advanced reasoning uses Gemini over the internet. Wake word, semantic memory and hardware monitoring run locally. The license can remain offline for up to 72 hours between checks.",
    },
    {
      q: "How do I get my access key?",
      a: "After payment approval, your keys appear on the confirmation screen. Each key unlocks the HUD on one machine.",
    },
  ],
  es: [
    {
      q: "¿Es una suscripción?",
      a: "No. El modelo es exclusivamente de por vida: pagas una sola vez y recibes la licencia vitalicia, con todas las futuras actualizaciones incluidas.",
    },
    {
      q: "¿Tengo que pagar por alguna API?",
      a: "Se necesita una clave de Google Gemini de AI Studio para las conversaciones de voz. Los módulos locales no requieren otra suscripción de Jasper.",
    },
    {
      q: "¿Funciona sin internet?",
      a: "El razonamiento avanzado usa Gemini por internet. Wake word, memoria semántica y monitorización de hardware funcionan en local. La licencia puede permanecer hasta 72 horas sin una nueva verificación.",
    },
    {
      q: "¿Cómo recibo mi clave de acceso?",
      a: "Tras aprobarse el pago, tus claves aparecen en la pantalla de confirmación. Cada clave desbloquea el HUD en una máquina.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  17 autonomy modules                                                */
/* ------------------------------------------------------------------ */

export interface ModuleItem {
  icon: string;
  name: Localized;
  desc: Localized;
}

export const MODULES: ModuleItem[] = [
  {
    icon: "eye",
    name: { "pt-BR": "Visão de Tela", en: "Screen Vision", es: "Visión de Pantalla" },
    desc: {
      "pt-BR": "Enxerga seu desktop em tempo real, frame a frame.",
      en: "Sees your desktop in real time, frame by frame.",
      es: "Ve tu escritorio en tiempo real, frame a frame.",
    },
  },
  {
    icon: "window",
    name: { "pt-BR": "Rastreador de Janelas", en: "Window Tracker", es: "Rastreador de Ventanas" },
    desc: {
      "pt-BR": "Sabe sempre qual aplicação tem o foco.",
      en: "Always knows which application has focus.",
      es: "Sabe siempre qué aplicación tiene el foco.",
    },
  },
  {
    icon: "clipboard",
    name: { "pt-BR": "Observador do Clipboard", en: "Clipboard Watcher", es: "Observador del Portapapeles" },
    desc: {
      "pt-BR": "Captura stack traces e URLs que você copia.",
      en: "Catches stack traces and URLs you copy.",
      es: "Captura stack traces y URLs que copias.",
    },
  },
  {
    icon: "clock",
    name: { "pt-BR": "Motor Cron & Lembretes", en: "Cron & Reminders Engine", es: "Motor Cron y Recordatorios" },
    desc: {
      "pt-BR": "Lembretes que disparam, mesmo depois do suspend.",
      en: "Reminders that fire, even after suspend.",
      es: "Recordatorios que suenan, incluso tras suspender.",
    },
  },
  {
    icon: "pulse",
    name: { "pt-BR": "Monitor de Saúde", en: "System Health Watcher", es: "Monitor de Salud" },
    desc: {
      "pt-BR": "CPU, RAM e disco vigiados a cada 8 segundos.",
      en: "CPU, RAM and disk watched every 8 seconds.",
      es: "CPU, RAM y disco vigilados cada 8 segundos.",
    },
  },
  {
    icon: "sun",
    name: { "pt-BR": "Briefing Diário", en: "Daily Briefing", es: "Briefing Diario" },
    desc: {
      "pt-BR": "Resumo da manhã antes de você pedir.",
      en: "Morning report before you even ask.",
      es: "Resumen de la mañana antes de que pidas.",
    },
  },
  {
    icon: "brain",
    name: { "pt-BR": "Memória Semântica", en: "Semantic Memory", es: "Memoria Semántica" },
    desc: {
      "pt-BR": "TF-IDF + cosseno. Lembra localmente, para sempre.",
      en: "TF-IDF + cosine. Remembers locally, forever.",
      es: "TF-IDF + coseno. Recuerda en local, para siempre.",
    },
  },
  {
    icon: "graph",
    name: { "pt-BR": "Grafo de Conhecimento", en: "Knowledge Graph", es: "Grafo de Conocimiento" },
    desc: {
      "pt-BR": "Conecta pessoas, projetos e conceitos.",
      en: "Connects people, projects and concepts.",
      es: "Conecta personas, proyectos y conceptos.",
    },
  },
  {
    icon: "code",
    name: { "pt-BR": "Gerador de Relatórios", en: "Report Generator", es: "Generador de Informes" },
    desc: {
      "pt-BR": "Cria documentos PDF, Word e planilhas localmente.",
      en: "Creates PDF, Word, and spreadsheet documents locally.",
      es: "Crea documentos PDF, Word y hojas de cálculo localmente.",
    },
  },
  {
    icon: "globe",
    name: { "pt-BR": "Navegador Headless", en: "Headless Browser", es: "Navegador Headless" },
    desc: {
      "pt-BR": "Lê a web invisivelmente e mastiga o resultado.",
      en: "Reads the web invisibly and chews up the result.",
      es: "Lee la web invisiblemente y resume el resultado.",
    },
  },
  {
    icon: "git",
    name: { "pt-BR": "Git Watcher", en: "Git Watcher", es: "Git Watcher" },
    desc: {
      "pt-BR": "Commits semânticos, diffs e testes autônomos.",
      en: "Semantic commits, diffs and autonomous tests.",
      es: "Commits semánticos, diffs y pruebas autónomas.",
    },
  },
  {
    icon: "folder",
    name: { "pt-BR": "Organizador de Pastas", en: "Folder Organizer", es: "Organizador de Carpetas" },
    desc: {
      "pt-BR": "Caça duplicados e instaladores esquecidos.",
      en: "Hunts duplicates and forgotten installers.",
      es: "Caza duplicados e instaladores olvidados.",
    },
  },
  {
    icon: "users",
    name: { "pt-BR": "Subagentes Paralelos", en: "Parallel Subagents", es: "Subagentes Paralelos" },
    desc: {
      "pt-BR": "Worker pool que nunca bloqueia a conversa.",
      en: "Worker pool that never blocks the conversation.",
      es: "Pool de workers que nunca bloquea la conversación.",
    },
  },
  {
    icon: "shield",
    name: { "pt-BR": "Reflexion Guard", en: "Reflexion Guard", es: "Reflexion Guard" },
    desc: {
      "pt-BR": "Ações de alto risco exigem seu OK na tela.",
      en: "High-risk actions demand your on-screen OK.",
      es: "Acciones de alto riesgo exigen tu OK en pantalla.",
    },
  },
  {
    icon: "calendar",
    name: { "pt-BR": "Agenda & E-mails", en: "Calendar & Email", es: "Calendario y Correo" },
    desc: {
      "pt-BR": "iCal nativo com alarme 10 minutos antes.",
      en: "Native iCal with a 10-minute alarm.",
      es: "iCal nativo con alarma 10 minutos antes.",
    },
  },
  {
    icon: "zap",
    name: { "pt-BR": "Disparador de Webhooks", en: "Webhook Dispatcher", es: "Disparador de Webhooks" },
    desc: {
      "pt-BR": "n8n, Zapier, Make e Slack com firewall anti-SSRF.",
      en: "n8n, Zapier, Make and Slack with anti-SSRF firewall.",
      es: "n8n, Zapier, Make y Slack con firewall anti-SSRF.",
    },
  },
  {
    icon: "home",
    name: { "pt-BR": "Casa Inteligente", en: "Smart Home", es: "Casa Inteligente" },
    desc: {
      "pt-BR": "Home Assistant com allowlist zero-trust.",
      en: "Home Assistant with a zero-trust allowlist.",
      es: "Home Assistant con allowlist zero-trust.",
    },
  },
];

