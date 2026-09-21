export type SupportedLocale = "pt" | "en" | "es";

export interface LocalizedString {
  pt: string;
  en: string;
  es: string;
}

export interface PricingTier {
  currency: string;
  symbol: string;
  originalPrice: number;
  currentPrice: number;
  installments: string;
  lifetimeTag: string;
}

export interface SiteConfig {
  hero: {
    badge: LocalizedString;
    title: LocalizedString;
    subtitle: LocalizedString;
    ctaPrimary: LocalizedString;
    ctaSecondary: LocalizedString;
  };
  pricing: {
    pt: PricingTier;
    en: PricingTier;
    es: PricingTier;
  };
  promotion: {
    active: boolean;
    bannerText: LocalizedString;
    discountPercent: number;
    urgencyBadge: LocalizedString;
  };
  updatedAt?: number;
}

