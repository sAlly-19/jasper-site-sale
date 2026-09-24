import { importJWK, SignJWT, type JWK } from 'jose';
import { z } from 'zod';
import { constantTimeEqual, generateLicenseKey, hmacHex, randomToken } from './crypto';
import { HttpError, readJson } from './http';
import type { Env, LicenseLease } from './types';

const activateSchema = z.object({
  licenseKey: z.string().trim().min(20).max(128),
  installationId: z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9._-]+$/),
  machineHash: z.string().trim().min(32).max(256).regex(/^[A-Za-z0-9._-]+$/),
  deviceSecret: z.string().min(32).max(256).optional(),
});

const heartbeatSchema = z.object({
  deviceId: z.string().uuid(),
  deviceSecret: z.string().min(32).max(256),
  nonce: z.string().min(16).max(128).regex(/^[A-Za-z0-9._-]+$/),
});

async function createLease(env: Env, values: {
  licenseId: string;
  deviceId: string;
  installationId: string;
  machineHash: string;
}): Promise<LicenseLease> {
  const ttl = Math.min(259_200, Math.max(300, Number(env.LEASE_TTL_SECONDS || '259200')));
  const now = Math.floor(Date.now() / 1000);
  const privateJwk = JSON.parse(env.LEASE_PRIVATE_JWK) as JWK;
  const key = await importJWK(privateJwk, 'EdDSA');
  const token = await new SignJWT({
    licenseId: values.licenseId,
    deviceId: values.deviceId,
    installationId: values.installationId,
    machineHash: values.machineHash,
    status: 'active',
  })
    .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT', kid: String(privateJwk.kid || 'jasper-lease-1') })
    .setIssuer('jasper-license-api')
    .setAudience('jasper-avatar-desktop')
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .setJti(crypto.randomUUID())
    .sign(key);
  return { token, expiresAt: new Date((now + ttl) * 1000).toISOString() };
}

export async function activateLicense(request: Request, env: Env): Promise<Record<string, unknown>> {
  const parsed = activateSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError(400, 'invalid_activation', 'Dados de ativação inválidos.');
  const keyHash = await hmacHex(env.LICENSE_PEPPER, parsed.data.licenseKey.toUpperCase());
  const license = await env.DB.prepare('SELECT id, status FROM licenses WHERE key_hash = ?').bind(keyHash).first<{ id: string; status: string }>();
  if (!license || license.status !== 'active') throw new HttpError(404, 'license_unavailable', 'Licença inválida, revogada ou reembolsada.');

  const existing = await env.DB.prepare(
    `SELECT id, installation_id, machine_hash, secret_hash, status FROM devices WHERE license_id = ?`,
  ).bind(license.id).first<{ id: string; installation_id: string; machine_hash: string; secret_hash: string; status: string }>();

  if (existing) {
    if (existing.status !== 'active' || existing.installation_id !== parsed.data.installationId || existing.machine_hash !== parsed.data.machineHash) {
      throw new HttpError(409, 'license_already_bound', 'Esta licença já está vinculada a outra instalação.');
    }
    if (!parsed.data.deviceSecret) throw new HttpError(401, 'device_secret_required', 'Segredo do dispositivo obrigatório.');
    const suppliedHash = await hmacHex(env.DEVICE_SECRET_PEPPER, parsed.data.deviceSecret);
    if (!constantTimeEqual(existing.secret_hash, suppliedHash)) throw new HttpError(401, 'invalid_device_secret', 'Segredo do dispositivo inválido.');
    const lease = await createLease(env, {
      licenseId: license.id,
      deviceId: existing.id,
      installationId: existing.installation_id,
      machineHash: existing.machine_hash,
    });
    return { status: 'active', deviceId: existing.id, lease };
  }

  const deviceId = crypto.randomUUID();
  const deviceSecret = randomToken();
  const secretHash = await hmacHex(env.DEVICE_SECRET_PEPPER, deviceSecret);
  const now = new Date().toISOString();
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO devices
          (id, license_id, installation_id, machine_hash, secret_hash, status, last_seen_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      ).bind(deviceId, license.id, parsed.data.installationId, parsed.data.machineHash, secretHash, now, now, now),
      env.DB.prepare(
        `INSERT INTO license_events (id, license_id, device_id, event_type, actor_type, actor_id, created_at)
         VALUES (?, ?, ?, 'activated', 'device', ?, ?)`,
      ).bind(crypto.randomUUID(), license.id, deviceId, parsed.data.installationId, now),
    ]);
  } catch {
    throw new HttpError(409, 'activation_conflict', 'A licença ou instalação já foi vinculada.');
  }

  const lease = await createLease(env, { licenseId: license.id, deviceId, installationId: parsed.data.installationId, machineHash: parsed.data.machineHash });
  return { status: 'active', deviceId, deviceSecret, lease };
}

export async function heartbeat(request: Request, env: Env): Promise<Record<string, unknown>> {
  const parsed = heartbeatSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError(400, 'invalid_heartbeat', 'Heartbeat inválido.');
  const device = await env.DB.prepare(
    `SELECT d.id, d.license_id, d.installation_id, d.machine_hash, d.secret_hash, d.status, d.last_nonce,
            l.status AS license_status
     FROM devices d JOIN licenses l ON l.id = d.license_id WHERE d.id = ?`,
  ).bind(parsed.data.deviceId).first<{
    id: string;
    license_id: string;
    installation_id: string;
    machine_hash: string;
    secret_hash: string;
    status: string;
    last_nonce: string | null;
    license_status: string;
  }>();
  if (!device || device.status !== 'active' || device.license_status !== 'active') {
    throw new HttpError(403, 'device_revoked', 'Dispositivo ou licença revogada.');
  }
  const suppliedHash = await hmacHex(env.DEVICE_SECRET_PEPPER, parsed.data.deviceSecret);
  if (!constantTimeEqual(device.secret_hash, suppliedHash)) throw new HttpError(401, 'invalid_device_secret', 'Segredo do dispositivo inválido.');
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`INSERT INTO device_nonces (device_id, nonce, created_at) VALUES (?, ?, ?)`)
      .bind(device.id, parsed.data.nonce, now).run();
  } catch {
    throw new HttpError(409, 'replayed_nonce', 'Nonce já utilizado.');
  }
  await env.DB.prepare(`UPDATE devices SET last_nonce = ?, last_seen_at = ?, updated_at = ? WHERE id = ?`)
    .bind(parsed.data.nonce, now, now, device.id).run();
  const lease = await createLease(env, {
    licenseId: device.license_id,
    deviceId: device.id,
    installationId: device.installation_id,
    machineHash: device.machine_hash,
  });
  return { status: 'active', lease };
}

export async function listAdminLicenses(env: Env): Promise<Record<string, unknown>> {
  const result = await env.DB.prepare(
    `SELECT l.id, l.order_id, l.status, l.created_at, l.updated_at, l.revoked_at,
            d.id AS device_id, d.installation_id, d.machine_hash, d.last_seen_at
     FROM licenses l LEFT JOIN devices d ON d.license_id = l.id
     ORDER BY l.created_at DESC LIMIT 500`,
  ).all();
  return { licenses: result.results };
}

export async function createAdminLicenses(request: Request, env: Env): Promise<Record<string, unknown>> {
  const schema = z.object({ quantity: z.number().int().min(1).max(50) });
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError(400, 'invalid_quantity', 'Quantidade inválida.');
  const licenses = Array.from({ length: parsed.data.quantity }, () => ({ id: crypto.randomUUID(), key: generateLicenseKey() }));
  const now = new Date().toISOString();
  const statements = await Promise.all(licenses.map(async ({ id, key }) => env.DB.prepare(
    `INSERT INTO licenses (id, key_hash, status, created_at, updated_at) VALUES (?, ?, 'active', ?, ?)`,
  ).bind(id, await hmacHex(env.LICENSE_PEPPER, key), now, now)));
  await env.DB.batch(statements);
  return { licenses };
}

export async function updateAdminLicense(request: Request, env: Env, licenseId: string): Promise<Record<string, unknown>> {
  const schema = z.object({ action: z.enum(['revoke', 'reactivate', 'release_device']) });
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) throw new HttpError(400, 'invalid_action', 'Ação inválida.');
  const license = await env.DB.prepare('SELECT id FROM licenses WHERE id = ?').bind(licenseId).first();
  if (!license) throw new HttpError(404, 'license_not_found', 'Licença não encontrada.');
  const now = new Date().toISOString();
  if (parsed.data.action === 'release_device') {
    await env.DB.prepare(`DELETE FROM devices WHERE license_id = ?`).bind(licenseId).run();
  } else {
    const status = parsed.data.action === 'revoke' ? 'revoked' : 'active';
    await env.DB.prepare(`UPDATE licenses SET status = ?, revoked_at = ?, updated_at = ? WHERE id = ?`)
      .bind(status, status === 'revoked' ? now : null, now, licenseId).run();
    if (status === 'revoked') {
      await env.DB.prepare(`UPDATE devices SET status = 'revoked', updated_at = ? WHERE license_id = ?`).bind(now, licenseId).run();
    } else {
      await env.DB.prepare(`DELETE FROM devices WHERE license_id = ? AND status <> 'active'`).bind(licenseId).run();
    }
  }
  return { success: true };
}
