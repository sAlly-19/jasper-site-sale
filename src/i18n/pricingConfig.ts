import { PricingTier, SupportedLocale } from "@/types/cms";

export const defaultPricing: Record<SupportedLocale, PricingTier> = {
  pt: {
    currency: "BRL",
    symbol: "R$",
    originalPrice: 497,
    currentPrice: 197,
    installments: "ou 12x de R$ 19,70",
    lifetimeTag: "ACESSO VITALÍCIO",
  },
  en: {
    currency: "USD",
    symbol: "$",
    originalPrice: 99,
    currentPrice: 49,
    installments: "Single payment • No monthly fees",
    lifetimeTag: "LIFETIME ACCESS",
  },
  es: {
    currency: "EUR",
    symbol: "€",
    originalPrice: 89,
    currentPrice: 45,
    installments: "Pago único • Sin suscripciones",
    lifetimeTag: "ACCESO VITALICIO",
  },
};

