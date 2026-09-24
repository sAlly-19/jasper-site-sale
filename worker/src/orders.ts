import { z } from 'zod';
import { constantTimeEqual, decryptJson, deriveOrderLicenseKey, encryptJson, hmacHex, randomToken } from './crypto';
import { HttpError, readJson } from './http';
import { createPreference, fetchPayment, verifyWebhookSignature } from './mercado-pago';
import type { Env } from './types';

const orderSchema = z.object({
  buyerName: z.string().trim().min(2).max(120),
  buyerEmail: z.string().trim().email().max(254),
  quantity: z.number().int().min(1),
  promotionCode: z.string().trim().max(40).optional(),
});

const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isOrderId(value: string): boolean {
  return ORDER_ID_PATTERN.test(value);
}

export function bundleDiscount(quantity: number): number {
  if (quantity >= 5) return 25;
  if (quantity >= 3) return 15;
  if (quantity === 2) return 10;
  return 0;
}

export async function createOrder(request: Request, env: Env): Promise<Record<string, unknown>> {
  const parsed = orderSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError(400, 'invalid_order', 'Dados do pedido inválidos.');
  const maximum = Number(env.MAX_ORDER_QUANTITY || '20');
  if (parsed.data.quantity > maximum) throw new HttpError(400, 'quantity_exceeded', `Máximo de ${maximum} licenças por pedido.`);

  const now = new Date();
  let promotion: { id: string; discount_percent: number } | null = null;
  if (parsed.data.promotionCode) {
    promotion = await env.DB.prepare(
      `SELECT id, discount_percent FROM promotions
       WHERE code = ? COLLATE NOCASE AND active = 1 AND starts_at <= ? AND ends_at > ?`,
    ).bind(parsed.data.promotionCode, now.toISOString(), now.toISOString()).first();
    if (!promotion) throw new HttpError(409, 'promotion_unavailable', 'A promoção informada expirou ou não está disponível.');
  }

  const baseUnitAmount = Number(env.PRODUCT_PRICE_BRL_CENTS);
  if (!Number.isSafeInteger(baseUnitAmount) || baseUnitAmount <= 0) throw new HttpError(503, 'price_unavailable', 'Preço indisponível.');
  const discountPercent = Math.min(90, bundleDiscount(parsed.data.quantity) + (promotion?.discount_percent || 0));
  const unitAmount = Math.round(baseUnitAmount * (1 - discountPercent / 100));
  const totalAmount = unitAmount * parsed.data.quantity;
  const orderId = randomToken();
  const accessToken = randomToken();
  const accessTokenHash = await hmacHex(env.ORDER_TOKEN_PEPPER, accessToken);
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO orders
      (id, access_token_hash, buyer_name, buyer_email, product_id, quantity, currency, unit_amount,
       discount_amount, total_amount, promotion_id, status, created_at, updated_at, expires_at)
     VALUES (?, ?, ?, ?, 'jasper-lifetime', ?, 'BRL', ?, ?, ?, ?, 'creating', ?, ?, ?)`,
  ).bind(
    orderId,
    accessTokenHash,
    parsed.data.buyerName,
    parsed.data.buyerEmail.toLowerCase(),
    parsed.data.quantity,
    unitAmount,
    (baseUnitAmount - unitAmount) * parsed.data.quantity,
    totalAmount,
    promotion?.id || null,
    createdAt,
    createdAt,
    expiresAt,
  ).run();

  try {
    const preference = await createPreference(env, {
      orderId,
      buyerName: parsed.data.buyerName,
      buyerEmail: parsed.data.buyerEmail.toLowerCase(),
      quantity: parsed.data.quantity,
      unitAmountCents: unitAmount,
    });
    await env.DB.prepare(
      `UPDATE orders SET status = 'pending', payment_preference_id = ?, checkout_url = ?, updated_at = ? WHERE id = ?`,
    ).bind(preference.id, preference.checkoutUrl, new Date().toISOString(), orderId).run();
    return { orderId, accessToken, status: 'pending', checkoutUrl: preference.checkoutUrl, quantity: parsed.data.quantity, unitAmount, totalAmount, currency: 'BRL' };
  } catch (error) {
    await env.DB.prepare(`UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ?`).bind(new Date().toISOString(), orderId).run();
    throw error;
  }
}

export async function getOrder(request: Request, env: Env, orderId: string): Promise<Record<string, unknown>> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token) throw new HttpError(401, 'order_token_required', 'Token do pedido obrigatório.');
  const tokenHash = await hmacHex(env.ORDER_TOKEN_PEPPER, token);
  const order = await env.DB.prepare(
    `SELECT id, access_token_hash, quantity, currency, unit_amount, total_amount, status, delivery_ciphertext, created_at, updated_at
     FROM orders WHERE id = ?`,
  ).bind(orderId).first<Record<string, unknown>>();
  if (!order || !constantTimeEqual(String(order.access_token_hash), tokenHash)) {
    throw new HttpError(404, 'order_not_found', 'Pedido não encontrado.');
  }

  const licenses = order.delivery_ciphertext
    ? await decryptJson<string[]>(String(order.delivery_ciphertext), env.DELIVERY_ENCRYPTION_KEY)
    : undefined;
  delete order.access_token_hash;
  delete order.delivery_ciphertext;
  return { ...order, licenses };
}

async function issueLicenses(env: Env, orderId: string, quantity: number): Promise<void> {
  const order = await env.DB.prepare('SELECT delivery_ciphertext FROM orders WHERE id = ?').bind(orderId).first<{ delivery_ciphertext: string | null }>();
  if (order?.delivery_ciphertext) return;

  const keys = await Promise.all(Array.from(
    { length: quantity },
    (_, orderSlot) => deriveOrderLicenseKey(env.LICENSE_PEPPER, orderId, orderSlot),
  ));
  const now = new Date().toISOString();
  const statements = await Promise.all(keys.map(async (key, orderSlot) => env.DB.prepare(
    `INSERT OR IGNORE INTO licenses (id, key_hash, order_id, order_slot, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`,
  ).bind(crypto.randomUUID(), await hmacHex(env.LICENSE_PEPPER, key), orderId, orderSlot, now, now)));
  const delivery = await encryptJson(keys, env.DELIVERY_ENCRYPTION_KEY);
  statements.push(env.DB.prepare(
    `UPDATE orders SET status = 'paid', delivery_ciphertext = ?, updated_at = ?
     WHERE id = ? AND delivery_ciphertext IS NULL`,
  ).bind(delivery, now, orderId));
  await env.DB.batch(statements);
}

export async function processMercadoPagoWebhook(request: Request, env: Env): Promise<Record<string, unknown>> {
  const body = await readJson(request, 64_000) as Record<string, unknown>;
  const url = new URL(request.url);
  const bodyData = body.data as Record<string, unknown> | undefined;
  const paymentId = String(url.searchParams.get('data.id') || bodyData?.id || '');
  if (!paymentId || !/^\d+$/.test(paymentId)) throw new HttpError(400, 'invalid_payment_id', 'Pagamento inválido.');
  await verifyWebhookSignature(request, env, paymentId);

  const requestId = request.headers.get('x-request-id') || '';
  const eventKey = `${requestId}:${paymentId}`;
  const now = new Date().toISOString();
  const insert = await env.DB.prepare(
    `INSERT OR IGNORE INTO payment_events
      (id, provider_event_key, provider_resource_id, request_id, action, status, received_at)
     VALUES (?, ?, ?, ?, ?, 'received', ?)`,
  ).bind(crypto.randomUUID(), eventKey, paymentId, requestId, String(body.action || body.type || 'payment'), now).run();
  if (!insert.meta.changes) return { accepted: true, duplicate: true };

  try {
    const payment = await fetchPayment(env, paymentId);
    const order = await env.DB.prepare(
      'SELECT id, quantity, total_amount, currency FROM orders WHERE id = ?',
    ).bind(payment.externalReference).first<{ id: string; quantity: number; total_amount: number; currency: string }>();
    if (!order || payment.amountCents !== order.total_amount || payment.currency !== order.currency) {
      throw new Error('Pagamento não corresponde ao pedido registrado.');
    }

    await env.DB.prepare(
      `INSERT INTO payments (id, order_id, provider, provider_payment_id, provider_status, amount, currency, approved_at, created_at, updated_at)
       VALUES (?, ?, 'mercado_pago', ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider_payment_id) DO UPDATE SET provider_status = excluded.provider_status, updated_at = excluded.updated_at`,
    ).bind(crypto.randomUUID(), order.id, payment.id, payment.status, payment.amountCents, payment.currency, payment.approvedAt || null, now, now).run();

    if (payment.status === 'approved') await issueLicenses(env, order.id, order.quantity);
    if (payment.status === 'rejected') {
      await env.DB.prepare(`UPDATE orders SET status = 'rejected', updated_at = ? WHERE id = ? AND status <> 'paid'`).bind(now, order.id).run();
    }
    if (['refunded', 'charged_back', 'cancelled'].includes(payment.status)) {
      await env.DB.batch([
        env.DB.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).bind(payment.status === 'cancelled' ? 'cancelled' : payment.status, now, order.id),
        env.DB.prepare(`UPDATE licenses SET status = ?, revoked_at = ?, updated_at = ? WHERE order_id = ?`).bind(payment.status === 'refunded' ? 'refunded' : 'revoked', now, now, order.id),
      ]);
    }
    await env.DB.prepare(`UPDATE payment_events SET status = 'processed', processed_at = ? WHERE provider_event_key = ?`).bind(now, eventKey).run();
    return { accepted: true };
  } catch (error) {
    await env.DB.prepare(`UPDATE payment_events SET status = 'failed', error_code = ?, processed_at = ? WHERE provider_event_key = ?`)
      .bind(error instanceof Error ? error.message.slice(0, 200) : 'unknown', now, eventKey).run();
    throw error;
  }
}
