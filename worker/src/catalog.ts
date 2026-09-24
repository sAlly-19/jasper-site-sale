import { HttpError } from './http';
import type { Env } from './types';

export interface PublicCatalog {
  product: {
    id: 'jasper-lifetime';
    checkoutCurrency: 'BRL';
    unitAmount: number;
    regionalPrices: { BRL: number; USD: number; EUR: number };
    maximumQuantity: number;
    bundleDiscounts: Array<{ minimumQuantity: number; discountPercent: number }>;
  };
}

export function getPublicCatalog(env: Env): PublicCatalog {
  const unitAmount = Number(env.PRODUCT_PRICE_BRL_CENTS);
  const usdAmount = Number(env.PRODUCT_PRICE_USD_CENTS);
  const eurAmount = Number(env.PRODUCT_PRICE_EUR_CENTS);
  const maximumQuantity = Number(env.MAX_ORDER_QUANTITY || '20');
  if (![unitAmount, usdAmount, eurAmount].every((amount) => Number.isSafeInteger(amount) && amount > 0)) {
    throw new HttpError(503, 'price_unavailable', 'Preco indisponivel.');
  }
  if (!Number.isSafeInteger(maximumQuantity) || maximumQuantity < 1) {
    throw new HttpError(503, 'catalog_unavailable', 'Catalogo indisponivel.');
  }

  return {
    product: {
      id: 'jasper-lifetime',
      checkoutCurrency: 'BRL',
      unitAmount,
      regionalPrices: { BRL: unitAmount, USD: usdAmount, EUR: eurAmount },
      maximumQuantity,
      bundleDiscounts: [
        { minimumQuantity: 2, discountPercent: 10 },
        { minimumQuantity: 3, discountPercent: 15 },
        { minimumQuantity: 5, discountPercent: 25 },
      ],
    },
  };
}
