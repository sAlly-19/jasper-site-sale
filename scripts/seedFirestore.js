const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.resolve(__dirname, "../jasper-avatar-firebase-adminsdk-fbsvc-fa198bd099.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("ERRO: Arquivo de credencial administrativa não encontrado em:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

const initialSiteConfig = {
  sections: {
    about: true,
    modules: true,
    security: true,
    pricing: true,
    faq: true,
    final: true,
  },
  media: {
    heroAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    hud: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
  },
  prices: {
    BRL: 1990,
    USD: 149,
    EUR: 129,
    BRL_original: 4990,
    USD_original: 499,
    EUR_original: 449,
  },
  content: {
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
        "Jasper é um avatar 3D que conversa por voz em tempo real, enxerga sua tela, executa código e pilota 17 módulos de autonomia — 100% local, zero-trust e seu para sempre.",
      en:
        "Jasper is a 3D avatar that talks in real time, sees your screen, runs code and pilots 17 autonomy modules — 100% local, zero-trust, and yours forever.",
      es:
        "Jasper es un avatar 3D que conversa en tiempo real, ve tu pantalla, ejecuta código y pilota 17 módulos de autonomía — 100% local, zero-trust y tuyo para siempre.",
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
        "Construído sobre Electron, Three.js e princípios local-first, o HUD holográfico do Jasper roda a 60 FPS com malha neural animada, visualizador espectral de áudio e memória semântica persistente.",
      en:
        "Built on Electron, Three.js and local-first principles, Jasper's holographic HUD runs at 60 FPS with an animated neural mesh, audio spectrum visualizer and persistent semantic memory.",
      es:
        "Construido sobre Electron, Three.js y principios local-first, el HUD holográfico de Jasper funciona a 60 FPS con malla neuronal animada, visualizador espectral de audio y memoria semántica persistente.",
    },
    "modules.eyebrow": {
      "pt-BR": "17 módulos de autonomia",
      en: "17 autonomy modules",
      es: "17 módulos de autonomía",
    },
    "modules.title": {
      "pt-BR": "AUTONOMIA TOTAL NO SISTEMA",
      en: "TOTAL SYSTEM AUTONOMY",
      es: "AUTONOMÍA TOTAL EN EL SISTEMA",
    },
    "modules.subtitle": {
      "pt-BR":
        "Cada serviço roda em background com total transparência: modo real de operação ou simulação, sempre declarado na UI.",
      en:
        "Every service runs in the background with total transparency: real operation or simulation mode, always declared in the UI.",
      es:
        "Cada servicio funciona en segundo plano con total transparencia: modo de operación real o simulación, siempre declarado en la interfaz.",
    },
    "security.eyebrow": {
      "pt-BR": "Segurança em camadas",
      en: "Layered security",
      es: "Seguridad en capas",
    },
    "security.title": {
      "pt-BR": "ZERO-TRUST LOCAL-FIRST",
      en: "ZERO-TRUST LOCAL-FIRST",
      es: "ZERO-TRUST LOCAL-FIRST",
    },
    "security.body": {
      "pt-BR":
        "Suas chaves de API, histórico de comandos e capturas de tela nunca saem do seu computador sem sua aprovação explícita na tela.",
      en:
        "Your API keys, command history, and screenshots never leave your computer without your explicit on-screen approval.",
      es:
        "Tus claves de API, historial de comandos y capturas de pantalla nunca salen de tu ordenador sin tu aprobación explícita en pantalla.",
    },
    "pricing.eyebrow": {
      "pt-BR": "Acesso vitalício",
      en: "Lifetime access",
      es: "Acceso de por vida",
    },
    "pricing.title": {
      "pt-BR": "PAGUE UMA VEZ. SEU PARA SEMPRE.",
      en: "PAY ONCE. OWN IT FOREVER.",
      es: "PAGA UNA VEZ. TUYO PARA SIEMPRE.",
    },
    "pricing.subtitle": {
      "pt-BR":
        "Sem assinaturas. Sem mensalidades. Uma licença vitalícia com suporte e atualizações incluídas.",
      en:
        "No subscription. No monthly fee. No surprises. One license, updates included, direct support from the developer.",
      es:
        "Sin suscripción. Sin cuota mensual. Una licencia con soporte y actualizaciones incluidas.",
    },
    "pricing.cta": {
      "pt-BR": "ATIVAR ACESSO VITALÍCIO",
      en: "ACTIVATE LIFETIME ACCESS",
      es: "ACTIVAR ACCESO DE POR VIDA",
    },
    "pricing.guarantee": {
      "pt-BR": "Garantia de 14 dias · Todos os updates incluídos · 1 licença por máquina",
      en: "14-day guarantee · Updates included · 1 license per machine",
      es: "Garantía de 14 días · Actualizaciones incluidas · 1 licencia por máquina",
    },
    "pricing.included.1": {
      "pt-BR": "Avatar 3D com lip-sync em tempo real e 17 módulos de autonomia",
      en: "3D avatar with lip sync and 17 autonomy modules",
      es: "Avatar 3D con lip-sync en tiempo real y 17 módulos de autonomía",
    },
    "pricing.included.2": {
      "pt-BR": "Wake word local treinado via TensorFlow.js sem envio de áudio",
      en: "Local wake word trained with TensorFlow.js",
      es: "Wake word local entrenado con TensorFlow.js",
    },
    "pricing.included.3": {
      "pt-BR": "Suporte vitalício direto com o desenvolvedor",
      en: "Lifetime direct support with the developer",
      es: "Soporte de por vida directo con el desarrollador",
    },
    "pricing.included.4": {
      "pt-BR": "Todos os futuros updates da estação de comando incluídos",
      en: "All future releases of the command station",
      es: "Todas las futuras versiones de la estación de mando",
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
      es: "¿LISTO PARA DESPERTAR A JASPER?",
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
        "Construído com Electron, Three.js e princípios local-first. Licença vitalícia comercial.",
      en:
        "Built with Electron, Three.js and local-first principles. Lifetime commercial license.",
      es:
        "Construido con Electron, Three.js y principios local-first. Licencia de por vida comercial.",
    },
  },
  faq: {
    "pt-BR": [
      {
        q: "É uma assinatura?",
        a: "Não. O modelo é exclusivamente Lifetime: você paga uma única vez e recebe a licença vitalícia, com todos os updates futuros incluídos.",
      },
      {
        q: "Preciso pagar por alguma API?",
        a: "Apenas uma chave gratuita do Google Gemini via AI Studio. Todos os 17 módulos de autonomia rodam 100% localmente, sem custo adicional.",
      },
      {
        q: "Funciona sem internet?",
        a: "O raciocínio avançado usa o Gemini via internet. Wake word, memória semântica, monitoramento de hardware e execução de código rodam localmente.",
      },
      {
        q: "Como recebo minha chave de acesso?",
        a: "Após a ativação, você recebe por e-mail e WhatsApp uma chave JASPER-LT exclusiva para liberar o HUD na sua máquina.",
      },
    ],
    en: [
      {
        q: "Is it a subscription?",
        a: "No. The model is exclusively Lifetime: you pay once and receive a lifetime license, with every future update included.",
      },
      {
        q: "Do I need to pay for any API?",
        a: "Only a free Google Gemini key via AI Studio. All 17 autonomy modules run 100% locally at no extra cost.",
      },
      {
        q: "Does it work offline?",
        a: "Advanced reasoning uses Gemini over the internet. Wake word, semantic memory, hardware monitoring and code execution all run locally.",
      },
      {
        q: "How do I get my access key?",
        a: "After activation you receive a unique JASPER-LT key by email and WhatsApp to unlock the HUD on your machine.",
      },
    ],
    es: [
      {
        q: "¿Es una suscripción?",
        a: "No. El modelo es exclusivamente de por vida (Lifetime): pagas una sola vez y recibes la licencia permanente, con todas las actualizaciones futuras incluidas.",
      },
      {
        q: "¿Necesito pagar por alguna API?",
        a: "Solo una clave gratuita de Google Gemini en AI Studio. Todos los 17 módulos de autonomía se ejecutan 100% localmente sin coste adicional.",
      },
      {
        q: "¿Funciona sin internet?",
        a: "El razonamiento avanzado utiliza Gemini por internet. Wake word, memoria semántica, monitorización y ejecución de código funcionan de forma local.",
      },
      {
        q: "¿Cómo recibo mi clave de acceso?",
        a: "Tras la activación recibirás por correo y WhatsApp una clave JASPER-LT única para desbloquear el HUD en tu máquina.",
      },
    ],
  },
};

const initialPromo = {
  id: "promo_launch",
  code: "LIFETIME50",
  discountPercent: 50,
  active: true,
  endsAt: new Date(Date.now() + 86400000 * 5).toISOString(),
  title: {
    "pt-BR": "🔥 Oferta de Lançamento: 50% de desconto vitalício",
    en: "🔥 Launch Offer: 50% lifetime discount",
    es: "🔥 Oferta de Lanzamiento: 50% de descuento de por vida",
  },
  createdAt: new Date().toISOString(),
};

const initialKey = {
  id: "key_dev_master",
  name: "Alisson Santos",
  email: "alisson@example.com",
  whatsapp: "+55 11 99999 8888",
  key: "JASPER-LT-7A4F-88E1-99B2",
  status: "active",
  notes: "Licença Master Developer (Node-Locked)",
  createdAt: new Date().toISOString(),
  invalidatedAt: null,
  machineId: "HWID-8F92-A7C1-44B0",
  machineName: "DESKTOP-MASTER",
  activatedAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
};

async function seedFirestore() {
  console.log("Iniciando carga de dados no Cloud Firestore (Projeto: %s)...", serviceAccount.project_id);

  try {
    // 1. Configuração do CMS da Landing Page
    console.log("Salvando 'site_config/landing_page'...");
    await db.collection("site_config").doc("landing_page").set(initialSiteConfig, { merge: true });
    console.log("✓ site_config/landing_page configurado com sucesso!");

    // 2. Promoção ativa inicial
    console.log("Criando promoção inicial 'promotions/promo_launch'...");
    await db.collection("promotions").doc("promo_launch").set(initialPromo, { merge: true });
    console.log("✓ Promoção 'LIFETIME50' (50% OFF) criada com sucesso!");

    // 3. Licença de demonstração inicial
    console.log("Criando licença inicial 'licenses/key_dev_master'...");
    await db.collection("licenses").doc("key_dev_master").set(initialKey, { merge: true });
    console.log("✓ Licença inicial criada com sucesso!");

    console.log("\n=======================================================");
    console.log(" BANCO DE DADOS FIRESTORE PRONTO E POVOADO COM SUCESSO! ");
    console.log("=======================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("ERRO ao popular o Firestore:", err.message || err);
    console.error("\nLembre-se: Certifique-se de que o Cloud Firestore foi criado no Firebase Console em:");
    console.error("https://console.firebase.google.com/project/" + serviceAccount.project_id + "/firestore\n");
    process.exit(1);
  }
}

seedFirestore();

