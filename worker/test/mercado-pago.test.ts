import { describe, expect, it } from 'vitest';
import { hmacHex } from '../src/crypto';
import { HttpError } from '../src/http';
import { isMercadoPagoCheckoutUrl, verifyWebhookSignature } from '../src/mercado-pago';
import type { Env } from '../src/types';

const secret = 'webhook-secret-with-at-least-thirty-two-characters';

function env(): Env {
  return {
    MERCADO_PAGO_WEBHOOK_SECRET: secret,
    WEBHOOK_MAX_SKEW_SECONDS: '600',
  } as Env;
}

describe('Mercado Pago webhook signature', () => {
  it('accepts a valid, current signature', async () => {
    const dataId = '123456789';
    const requestId = 'request-123';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await hmacHex(secret, `id:${dataId};request-id:${requestId};ts:${timestamp};`);
    const request = new Request('https://api.example/v1/webhooks/mercado-pago', {
      headers: { 'x-request-id': requestId, 'x-signature': `ts=${timestamp},v1=${signature}` },
    });
    await expect(verifyWebhookSignature(request, env(), dataId)).resolves.toBeUndefined();
  });

  it('accepts the millisecond timestamp format documented by Mercado Pago', async () => {
    const dataId = 'ORD01ABCDEF';
    const requestId = 'request-ms';
    const timestamp = String(Date.now());
    const signature = await hmacHex(secret, `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`);
    const request = new Request('https://api.example/v1/webhooks/mercado-pago', {
      headers: { 'x-request-id': requestId, 'x-signature': `ts=${timestamp},v1=${signature}` },
    });
    await expect(verifyWebhookSignature(request, env(), dataId)).resolves.toBeUndefined();
  });

  it('rejects tampering and stale timestamps', async () => {
    const requestId = 'request-456';
    const timestamp = String(Math.floor(Date.now() / 1000) - 3600);
    const request = new Request('https://api.example/v1/webhooks/mercado-pago', {
      headers: { 'x-request-id': requestId, 'x-signature': `ts=${timestamp},v1=${'0'.repeat(64)}` },
    });
    await expect(verifyWebhookSignature(request, env(), '999')).rejects.toBeInstanceOf(HttpError);
  });
});

describe('Mercado Pago checkout redirect', () => {
  it('accepts only HTTPS URLs owned by Mercado Pago Brazil', () => {
    expect(isMercadoPagoCheckoutUrl('https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123')).toBe(true);
    expect(isMercadoPagoCheckoutUrl('https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123')).toBe(true);
    expect(isMercadoPagoCheckoutUrl('http://www.mercadopago.com.br/checkout')).toBe(false);
    expect(isMercadoPagoCheckoutUrl('https://mercadopago.com.br.attacker.example/checkout')).toBe(false);
    expect(isMercadoPagoCheckoutUrl('not-a-url')).toBe(false);
  });
});
