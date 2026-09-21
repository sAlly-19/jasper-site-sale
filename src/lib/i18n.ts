export type Locale = "pt-BR" | "en" | "es";

export interface LocaleMeta {
  code: Locale;
  short: string;
  label: string;
  intl: string;
  /** Default currency for this locale */
  currency: string;
  /** Currencies the user may pick while in this locale */
  currencies: string[];
}

export const LOCALES: LocaleMeta[] = [
  {
    code: "pt-BR",
    short: "PT",
    label: "Português",
    intl: "pt-BR",
    currency: "BRL",
    currencies: ["BRL"],
  },
  {
    code: "en",
    short: "EN",
    label: "English",
    intl: "en-US",
    currency: "USD",
    currencies: ["USD"],
  },
  {
    code: "es",
    short: "ES",
    label: "Español",
    intl: "es-ES",
    currency: "EUR",
    currencies: ["EUR", "USD"],
  },
];

export const LOCALE_BY_CODE: Record<string, LocaleMeta> = Object.fromEntries(
  LOCALES.map((l) => [l.code, l]),
);

export function formatMoney(amount: number, currency: string, intl: string) {
  const decimals = Number.isInteger(amount) ? 0 : 2;
  try {
    return new Intl.NumberFormat(intl, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(decimals)}`;
  }
}

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem("jasper_locale");
    if (stored && LOCALE_BY_CODE[stored]) return stored as Locale;
    const nav = (window.navigator.language || "en").toLowerCase();
    if (nav.startsWith("pt")) return "pt-BR";
    if (nav.startsWith("es")) return "es";
  } catch {}
  return "en";
}

