import { allowedOrigin, corsHeaders, HttpError, json, withCors } from './http';
import { requireAdmin } from './firebase-auth';
import { enforceRateLimit } from './rate-limit';
import { getPublicCatalog } from './catalog';
import { createOrder, getOrder, isOrderId, processMercadoPagoWebhook } from './orders';
import {
  activateLicense,
  createAdminLicenses,
  heartbeat,
  listAdminLicenses,
  updateAdminLicense,
} from './licenses';
import {
  createPromotion,
  deletePromotion,
  getActivePromotion,
  listPromotions,
  setPromotionActive,
} from './promotions';
import type { Env } from './types';

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'OPTIONS') {
    if (request.headers.get('origin') && !allowedOrigin(request, env)) {
      throw new HttpError(403, 'origin_denied', 'Origem não autorizada.');
    }
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }
  if (request.headers.get('origin') && !allowedOrigin(request, env)) {
    throw new HttpError(403, 'origin_denied', 'Origem não autorizada.');
  }

  if (request.method === 'GET' && path === '/health') {
    return json({ status: 'ok', environment: env.ENVIRONMENT });
  }
  if (request.method === 'GET' && path === '/v1/licenses/public-key') {
    return json({ key: JSON.parse(env.LEASE_PUBLIC_JWK), leaseTtlSeconds: Number(env.LEASE_TTL_SECONDS) });
  }
  if (request.method === 'GET' && path === '/v1/catalog') {
    return json(getPublicCatalog(env), 200, { 'cache-control': 'public, max-age=300' });
  }
  if (request.method === 'GET' && path === '/v1/promotions/active') {
    await enforceRateLimit(request, env, 'active-promotion', 300, 3600);
    return json(await getActivePromotion(env));
  }
  if (request.method === 'POST' && path === '/v1/orders') {
    await enforceRateLimit(request, env, 'create-order', 10, 3600);
    return json(await createOrder(request, env), 201);
  }
  const orderId = path.startsWith('/v1/orders/') ? path.slice('/v1/orders/'.length) : '';
  if (request.method === 'GET' && isOrderId(orderId)) {
    await enforceRateLimit(request, env, 'get-order', 120, 3600);
    return json(await getOrder(request, env, orderId));
  }
  if (request.method === 'POST' && path === '/v1/webhooks/mercado-pago') {
    return json(await processMercadoPagoWebhook(request, env), 202);
  }
  if (request.method === 'POST' && path === '/v1/licenses/activate') {
    await enforceRateLimit(request, env, 'activate', 20, 3600);
    return json(await activateLicense(request, env));
  }
  if (request.method === 'POST' && path === '/v1/licenses/heartbeat') {
    await enforceRateLimit(request, env, 'heartbeat', 240, 3600);
    return json(await heartbeat(request, env));
  }
  if (path === '/v1/admin/licenses') {
    await requireAdmin(request, env);
    if (request.method === 'GET') return json(await listAdminLicenses(env));
    if (request.method === 'POST') return json(await createAdminLicenses(request, env), 201);
  }
  if (path === '/v1/admin/promotions') {
    await requireAdmin(request, env);
    if (request.method === 'GET') return json(await listPromotions(env));
    if (request.method === 'POST') return json(await createPromotion(request, env), 201);
  }
  const adminPromotionMatch = path.match(/^\/v1\/admin\/promotions\/([0-9a-f-]{36})$/i);
  if (adminPromotionMatch) {
    await requireAdmin(request, env);
    if (request.method === 'PATCH') return json(await setPromotionActive(request, env, adminPromotionMatch[1]!));
    if (request.method === 'DELETE') return json(await deletePromotion(env, adminPromotionMatch[1]!));
  }
  const adminLicenseMatch = path.match(/^\/v1\/admin\/licenses\/([0-9a-f-]{36})$/i);
  if (request.method === 'PATCH' && adminLicenseMatch) {
    await requireAdmin(request, env);
    return json(await updateAdminLicense(request, env, adminLicenseMatch[1]!));
  }

  throw new HttpError(404, 'not_found', 'Rota não encontrada.');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return withCors(await route(request, env), request, env);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const code = error instanceof HttpError ? error.code : 'internal_error';
      const message = error instanceof HttpError ? error.message : 'Erro interno do servidor.';
      return withCors(json({ error: { code, message } }, status), request, env);
    }
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const deliveryCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now),
      env.DB.prepare('UPDATE orders SET delivery_ciphertext = NULL WHERE created_at < ?').bind(deliveryCutoff),
      env.DB.prepare('DELETE FROM payment_events WHERE received_at < ?').bind(deliveryCutoff),
      env.DB.prepare('DELETE FROM license_events WHERE created_at < ?').bind(deliveryCutoff),
      env.DB.prepare('DELETE FROM device_nonces WHERE created_at < ?').bind(deliveryCutoff),
      env.DB.prepare(`UPDATE orders
        SET buyer_name = '[deleted]', buyer_email = 'deleted+' || id || '@invalid.local', checkout_url = NULL
        WHERE created_at < ? AND buyer_name <> '[deleted]'`).bind(deliveryCutoff),
      env.DB.prepare(`UPDATE orders SET status = 'cancelled', updated_at = ?
        WHERE status IN ('creating', 'pending') AND expires_at < ?`).bind(new Date().toISOString(), new Date().toISOString()),
    ]);
  },
} satisfies ExportedHandler<Env>;
