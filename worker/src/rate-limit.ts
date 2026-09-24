import { HttpError } from './http';
import type { Env } from './types';

export async function enforceRateLimit(
  request: Request,
  env: Env,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const client = request.headers.get('cf-connecting-ip') || 'local';
  const key = `${bucket}:${client}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const expiresAt = windowStart + windowSeconds;

  await env.DB.prepare(
    `INSERT INTO rate_limits (key, window_started_at, request_count, expires_at)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       request_count = CASE WHEN window_started_at = excluded.window_started_at THEN request_count + 1 ELSE 1 END,
       window_started_at = excluded.window_started_at,
       expires_at = excluded.expires_at`,
  ).bind(key, windowStart, expiresAt).run();

  const row = await env.DB.prepare('SELECT request_count FROM rate_limits WHERE key = ?').bind(key).first<{ request_count: number }>();
  if ((row?.request_count || 0) > limit) {
    throw new HttpError(429, 'rate_limited', 'Muitas solicitações. Tente novamente mais tarde.');
  }
}
