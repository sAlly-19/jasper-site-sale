import { constantTimeEqual, hmacHex } from './crypto';
import { HttpError } from './http';
import type { Env } from './types';

interface PreferenceInput {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  unitAmountCents: number;
}

export function isMercadoPagoCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === 'https:'
      && (hostname === 'mercadopago.com.br' || hostname.endsWith('.mercadopago.com.br'));
  } catch {
    return false;
  }
}

export async function createPreference(env: Env, input: PreferenceInput): Promise<{ id: string; checkoutUrl: string }> {
  const response = await fetch(`${env.MERCADO_PAGO_API_URL}/checkout/preferences`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
      'content-type': 'application/json',
      'x-idempotency-key': input.orderId,
    },
    body: JSON.stringify({
      external_reference: input.orderId,
      items: [{
        id: 'jasper-lifetime',
        title: 'Jasper Avatar - Licença vitalícia para 1 máquina',
        currency_id: 'BRL',
        quantity: input.quantity,
        unit_price: input.unitAmountCents / 100,
      }],
      payer: { name: input.buyerName, email: input.buyerEmail },
      notification_url: `${env.API_PUBLIC_URL}/v1/webhooks/mercado-pago`,
      back_urls: {
        success: `${env.PUBLIC_SITE_URL}/?payment=success&order=${input.orderId}`,
        pending: `${env.PUBLIC_SITE_URL}/?payment=pending&order=${input.orderId}`,
        failure: `${env.PUBLIC_SITE_URL}/?payment=failure&order=${input.orderId}`,
      },
      auto_return: 'approved',
      statement_descriptor: 'JASPER AVATAR',
    }),
  });

  if (!response.ok) {
    const providerError = await response.json().catch(() => null) as {
      error?: string;
      message?: string;
      status?: number;
      cause?: Array<{ code?: string; description?: string }>;
    } | null;
    console.error('[MercadoPago] Preference creation rejected', {
      httpStatus: response.status,
      error: providerError?.error,
      message: providerError?.message,
      status: providerError?.status,
      cause: providerError?.cause?.map(({ code, description }) => ({ code, description })).slice(0, 10),
    });
    throw new HttpError(502, 'payment_provider_error', 'Não foi possível iniciar o checkout.');
  }
  const data = await response.json() as { id?: string; init_point?: string; sandbox_init_point?: string };
  const checkoutUrl = env.MERCADO_PAGO_LIVE_MODE === 'true' ? data.init_point : data.sandbox_init_point || data.init_point;
  if (!data.id || !checkoutUrl || !isMercadoPagoCheckoutUrl(checkoutUrl)) {
    throw new HttpError(502, 'invalid_provider_response', 'Resposta inválida do Mercado Pago.');
  }
  return { id: data.id, checkoutUrl };
}

export async function verifyWebhookSignature(request: Request, env: Env, dataId: string): Promise<void> {
  const signature = request.headers.get('x-signature') || '';
  const requestId = request.headers.get('x-request-id') || '';
  const parts = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=', 2)));
  const timestamp = parts.ts;
  const received = parts.v1?.toLowerCase();
  if (!timestamp || !received || !requestId || !/^\d+$/.test(timestamp)) {
    throw new HttpError(401, 'invalid_webhook_signature', 'Assinatura do webhook ausente ou inválida.');
  }

  const timestampValue = Number(timestamp);
  const timestampSeconds = timestampValue > 1_000_000_000_000 ? timestampValue / 1000 : timestampValue;
  const maxSkew = Number(env.WEBHOOK_MAX_SKEW_SECONDS || '600');
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > maxSkew) {
    throw new HttpError(401, 'stale_webhook', 'Webhook fora da janela de tempo permitida.');
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expected = await hmacHex(env.MERCADO_PAGO_WEBHOOK_SECRET, manifest);
  if (!constantTimeEqual(expected, received)) {
    throw new HttpError(401, 'invalid_webhook_signature', 'Assinatura do webhook inválida.');
  }
}

export async function fetchPayment(env: Env, paymentId: string): Promise<{
  id: string;
  status: string;
  externalReference: string;
  amountCents: number;
  currency: string;
  approvedAt?: string;
}> {
  const response = await fetch(`${env.MERCADO_PAGO_API_URL}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}` },
  });
  if (!response.ok) throw new HttpError(502, 'payment_lookup_failed', 'Não foi possível confirmar o pagamento.');
  const payment = await response.json() as Record<string, unknown>;
  const result: {
    id: string;
    status: string;
    externalReference: string;
    amountCents: number;
    currency: string;
    approvedAt?: string;
  } = {
    id: String(payment.id || paymentId),
    status: String(payment.status || 'unknown'),
    externalReference: String(payment.external_reference || ''),
    amountCents: Math.round(Number(payment.transaction_amount || 0) * 100),
    currency: String(payment.currency_id || ''),
  };
  if (typeof payment.date_approved === 'string') result.approvedAt = payment.date_approved;
  return result;
}
