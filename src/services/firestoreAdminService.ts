import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { fetchActivePromotion, fetchPublicCatalog } from '@/services/workerApi';
import {
  defaultContent,
  defaultFaq,
  defaultMedia,
  defaultPrices,
  defaultSections,
  type LandingData,
  type Promo,
} from '@/lib/content';

let cachedLandingData: LandingData = {
  content: defaultContent,
  sections: defaultSections,
  media: defaultMedia,
  prices: defaultPrices,
  faq: defaultFaq,
  promo: null,
};

function normalizeLegacyContent(data: LandingData): LandingData {
  const content = { ...defaultContent, ...(data.content || {}) };
  const media = { ...defaultMedia, ...(data.media || {}) };
  const faq = data.faq && typeof data.faq === 'object' ? data.faq : defaultFaq;
  for (const locale of ['pt-BR', 'en', 'es'] as const) {
    const subtitle = content['hero.subtitle']?.[locale] || '';
    if (/executa código|runs code|ejecuta código/i.test(subtitle)) {
      content['hero.subtitle'] = { ...content['hero.subtitle'], [locale]: defaultContent['hero.subtitle'][locale] };
    }
    const guarantee = content['pricing.guarantee']?.[locale] || '';
    if (/14\s*(dias|days|días)/i.test(guarantee)) {
      content['pricing.guarantee'] = { ...content['pricing.guarantee'], [locale]: defaultContent['pricing.guarantee'][locale] };
    }
    const securityBody = content['security.body']?.[locale] || '';
    if (/execução de código|code execution|ejecución de código/i.test(securityBody)) {
      content['security.body'] = { ...content['security.body'], [locale]: defaultContent['security.body'][locale] };
    }
  }

  const legacyMedia = /(?:images\.unsplash\.com|github\.com\/sAlly-19\/jasper-avatar)/i;
  return {
    ...data,
    content,
    media: {
      heroAvatar: legacyMedia.test(media.heroAvatar) ? defaultMedia.heroAvatar : media.heroAvatar,
      hud: legacyMedia.test(media.hud) ? defaultMedia.hud : media.hud,
    },
    faq: Object.values(faq).flat().some((item) => /JASPER-LT|WhatsApp|100%\s*(local|locally|en local)|execução de código|code execution|ejecución de código/i.test(item.a))
      ? defaultFaq
      : faq,
  };
}

export async function fetchLandingData(): Promise<LandingData> {
  let nextData = cachedLandingData;
  try {
    const configSnap = await getDoc(doc(db, 'site_config', 'landing_page'));
    if (configSnap.exists()) {
      nextData = { ...nextData, ...(configSnap.data() as Partial<LandingData>) };
    }
  } catch {
    console.warn('Não foi possível atualizar o conteúdo público; usando os padrões locais.');
  }

  let activePromo: Promo | null = null;
  let checkoutPrices = {
    BRL: defaultPrices.BRL,
    USD: defaultPrices.USD,
    EUR: defaultPrices.EUR,
  };
  const [promotionResult, catalogResult] = await Promise.allSettled([
    fetchActivePromotion(),
    fetchPublicCatalog(),
  ]);
  if (promotionResult.status === 'fulfilled') {
    const { promotion } = promotionResult.value;
    activePromo = promotion ? {
      id: promotion.id,
      code: promotion.code,
      title: promotion.title,
      discountPercent: promotion.discountPercent,
      endsAt: promotion.endsAt,
    } : null;
  } else {
    console.warn('Não foi possível consultar promoções ativas.');
  }
  if (catalogResult.status === 'fulfilled') {
    const catalog = catalogResult.value;
    const { regionalPrices } = catalog.product;
    if (Object.values(regionalPrices).every((amount) => Number.isSafeInteger(amount) && amount > 0)) {
      checkoutPrices = {
        BRL: regionalPrices.BRL / 100,
        USD: regionalPrices.USD / 100,
        EUR: regionalPrices.EUR / 100,
      };
    }
  } else {
    console.warn('Não foi possível consultar o catálogo de checkout.');
  }

  cachedLandingData = normalizeLegacyContent({
    ...nextData,
    prices: {
      ...nextData.prices,
      ...checkoutPrices,
      BRL_original: checkoutPrices.BRL,
      USD_original: checkoutPrices.USD,
      EUR_original: checkoutPrices.EUR,
    },
    promo: activePromo,
  });
  return cachedLandingData;
}

export async function saveCmsData(data: Partial<LandingData>): Promise<void> {
  const next = { ...cachedLandingData, ...data };
  await setDoc(doc(db, 'site_config', 'landing_page'), next, { merge: true });
  cachedLandingData = next;
}
