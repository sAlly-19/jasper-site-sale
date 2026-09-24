import { describe, expect, it } from 'vitest';
import { getPublicCatalog } from '../src/catalog';
import { randomToken } from '../src/crypto';
import { bundleDiscount, isOrderId } from '../src/orders';
import type { Env } from '../src/types';

describe('server-side bundle discounts', () => {
  it('applies only the documented quantity tiers', () => {
    expect(bundleDiscount(1)).toBe(0);
    expect(bundleDiscount(2)).toBe(10);
    expect(bundleDiscount(3)).toBe(15);
    expect(bundleDiscount(4)).toBe(15);
    expect(bundleDiscount(5)).toBe(25);
    expect(bundleDiscount(20)).toBe(25);
  });
});

describe('public checkout catalog', () => {
  it('publishes the authoritative BRL price in integer cents', () => {
    const catalog = getPublicCatalog({
      PRODUCT_PRICE_BRL_CENTS: '49700',
      PRODUCT_PRICE_USD_CENTS: '14900',
      PRODUCT_PRICE_EUR_CENTS: '12900',
      MAX_ORDER_QUANTITY: '20',
    } as Env);

    expect(catalog.product).toMatchObject({
      id: 'jasper-lifetime',
      checkoutCurrency: 'BRL',
      unitAmount: 49700,
      regionalPrices: { BRL: 49700, USD: 14900, EUR: 12900 },
      maximumQuantity: 20,
    });
  });
});

describe('order identifiers', () => {
  it('accepts generated 256-bit identifiers and rejects legacy or malformed values', () => {
    expect(isOrderId(randomToken())).toBe(true);
    expect(isOrderId('123e4567-e89b-12d3-a456-426614174000')).toBe(false);
    expect(isOrderId('../payment')).toBe(false);
    expect(isOrderId('a'.repeat(42))).toBe(false);
    expect(isOrderId('a'.repeat(44))).toBe(false);
  });
});
