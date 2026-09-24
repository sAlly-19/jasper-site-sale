import { z } from 'zod';
import { HttpError, readJson } from './http';
import type { Env } from './types';

const titleSchema = z.object({
  'pt-BR': z.string().trim().max(160).optional(),
  en: z.string().trim().max(160).optional(),
  es: z.string().trim().max(160).optional(),
}).refine((title) => Object.values(title).some(Boolean), 'Título obrigatório.');

const createSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,24}$/),
  discountPercent: z.number().int().min(1).max(90),
  title: titleSchema,
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime(),
});

interface PromotionRow {
  id: string;
  code: string;
  title: string;
  discount_percent: number;
  starts_at: string;
  ends_at: string;
  active: number;
  created_at: string;
  updated_at: string;
}

function toPromotion(row: PromotionRow): Record<string, unknown> {
  let title: Record<string, string> = {};
  try {
    title = JSON.parse(row.title) as Record<string, string>;
  } catch {
    title = { en: row.title };
  }
  return {
    id: row.id,
    code: row.code,
    title,
    discountPercent: row.discount_percent,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActivePromotion(env: Env): Promise<Record<string, unknown>> {
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `SELECT * FROM promotions
     WHERE active = 1 AND starts_at <= ? AND ends_at > ?
     ORDER BY created_at DESC LIMIT 1`,
  ).bind(now, now).first<PromotionRow>();
  return { promotion: row ? toPromotion(row) : null };
}

export async function listPromotions(env: Env): Promise<Record<string, unknown>> {
  const result = await env.DB.prepare('SELECT * FROM promotions ORDER BY created_at DESC LIMIT 200').all<PromotionRow>();
  return { promotions: result.results.map(toPromotion) };
}

export async function createPromotion(request: Request, env: Env): Promise<Record<string, unknown>> {
  const parsed = createSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError(400, 'invalid_promotion', 'Dados da promoção inválidos.');
  const now = new Date().toISOString();
  const startsAt = parsed.data.startsAt || now;
  if (Date.parse(parsed.data.endsAt) <= Date.parse(startsAt)) {
    throw new HttpError(400, 'invalid_period', 'A data final deve ser posterior à data inicial.');
  }

  const id = crypto.randomUUID();
  try {
    await env.DB.batch([
      env.DB.prepare('UPDATE promotions SET active = 0, updated_at = ? WHERE active = 1').bind(now),
      env.DB.prepare(
        `INSERT INTO promotions
          (id, code, title, discount_percent, starts_at, ends_at, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      ).bind(
        id,
        parsed.data.code,
        JSON.stringify(parsed.data.title),
        parsed.data.discountPercent,
        startsAt,
        parsed.data.endsAt,
        now,
        now,
      ),
    ]);
  } catch {
    throw new HttpError(409, 'code_taken', 'Este código promocional já existe.');
  }
  const row = await env.DB.prepare('SELECT * FROM promotions WHERE id = ?').bind(id).first<PromotionRow>();
  if (!row) throw new HttpError(500, 'promotion_create_failed', 'Não foi possível criar a promoção.');
  return { promotion: toPromotion(row) };
}

export async function setPromotionActive(
  request: Request,
  env: Env,
  promotionId: string,
): Promise<Record<string, unknown>> {
  const parsed = z.object({ active: z.boolean() }).safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError(400, 'invalid_promotion_status', 'Status inválido.');
  const existing = await env.DB.prepare('SELECT * FROM promotions WHERE id = ?').bind(promotionId).first<PromotionRow>();
  if (!existing) throw new HttpError(404, 'promotion_not_found', 'Promoção não encontrada.');
  const now = new Date().toISOString();
  if (parsed.data.active && Date.parse(existing.ends_at) <= Date.now()) {
    throw new HttpError(409, 'promotion_expired', 'Uma promoção expirada não pode ser ativada.');
  }
  const statements = [];
  if (parsed.data.active) {
    statements.push(env.DB.prepare('UPDATE promotions SET active = 0, updated_at = ? WHERE active = 1 AND id <> ?').bind(now, promotionId));
  }
  statements.push(env.DB.prepare('UPDATE promotions SET active = ?, updated_at = ? WHERE id = ?').bind(parsed.data.active ? 1 : 0, now, promotionId));
  await env.DB.batch(statements);
  const row = await env.DB.prepare('SELECT * FROM promotions WHERE id = ?').bind(promotionId).first<PromotionRow>();
  return { promotion: toPromotion(row!) };
}

export async function deletePromotion(env: Env, promotionId: string): Promise<Record<string, unknown>> {
  const result = await env.DB.prepare('DELETE FROM promotions WHERE id = ?').bind(promotionId).run();
  if (!result.meta.changes) throw new HttpError(404, 'promotion_not_found', 'Promoção não encontrada.');
  return { success: true };
}
