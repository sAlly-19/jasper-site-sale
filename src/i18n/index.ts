import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import pt from "./locales/pt.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import { SupportedLocale } from "@/types/cms";

const STORAGE_KEY = "@jasper_user_locale";

export const resources = {
  pt: { translation: pt },
  en: { translation: en },
  es: { translation: es },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: "pt", // Idioma padrão inicial
  fallbackLng: "pt",
  interpolation: {
    escapeValue: false, // React já faz escape de XSS
  },
  compatibilityJSON: "v4",
});

// Carrega preferência persistida no AsyncStorage (apenas se ambiente cliente/browser ou native)
if (typeof window !== "undefined") {
  try {
    AsyncStorage.getItem(STORAGE_KEY).then((savedLang) => {
      if (savedLang && (savedLang === "pt" || savedLang === "en" || savedLang === "es")) {
        i18n.changeLanguage(savedLang);
      }
    }).catch(() => {});
  } catch {}
}

// Helper para trocar idioma e salvar no AsyncStorage
export async function setAppLanguage(lang: SupportedLocale): Promise<void> {
  await i18n.changeLanguage(lang);
  if (typeof window !== "undefined") {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      console.warn("Falha ao salvar preferência de idioma:", err);
    }
  }
}

export default i18n;

