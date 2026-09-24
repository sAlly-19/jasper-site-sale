const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : "";

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error("ERRO: defina FIREBASE_SERVICE_ACCOUNT_PATH com o caminho da conta de serviço.");
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
    heroAvatar: "/assets/screenshots/01_avatar_hud.png",
    hud: "/assets/screenshots/02_autonomy_modules.png",
  },
  prices: {
    BRL: 497,
    USD: 149,
    EUR: 129,
    BRL_original: 497,
    USD_original: 149,
    EUR_original: 129,
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
      "pt-BR": "Garantia de 7 dias · Todos os updates incluídos · 1 licença por máquina",
      en: "7-day guarantee · Updates included · 1 license per machine",
      es: "Garantía de 7 días · Actualizaciones incluidas · 1 licencia por máquina",
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
        a: "No. El modelo es exclusivamente de por vida (Lifetime): pagas una sola vez y recibes la licencia permanente, con todas las actualizaciones futuras incluidas.",
      },
      {
        q: "¿Necesito pagar por alguna API?",
        a: "Se necesita una clave de Google Gemini de AI Studio para las conversaciones de voz. Los módulos locales no requieren otra suscripción de Jasper.",
      },
      {
        q: "¿Funciona sin internet?",
        a: "El razonamiento avanzado utiliza Gemini por internet. Wake word, memoria semántica y monitorización funcionan de forma local. La licencia puede permanecer hasta 72 horas sin una nueva verificación.",
      },
      {
        q: "¿Cómo recibo mi clave de acceso?",
        a: "Tras aprobarse el pago, tus claves aparecen en la pantalla de confirmación. Cada clave desbloquea el HUD en una máquina.",
      },
    ],
  },
};

async function seedFirestore() {
  console.log("Iniciando carga de dados no Cloud Firestore (Projeto: %s)...", serviceAccount.project_id);

  try {
    // 1. Configuração do CMS da Landing Page
    console.log("Salvando 'site_config/landing_page'...");
    await db.collection("site_config").doc("landing_page").set(initialSiteConfig, { merge: true });
    console.log("✓ site_config/landing_page configurado com sucesso!");

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

