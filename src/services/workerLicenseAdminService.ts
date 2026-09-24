import { createAdminLicenses, fetchAdminLicenses, updateAdminLicense } from '@/services/workerApi';

export type LicenseStatus = 'active' | 'revoked';

export interface KeyRow {
  id: string;
  orderId: string | null;
  key: string;
  status: LicenseStatus;
  createdAt: string;
  revokedAt: string | null;
  deviceId: string | null;
  installationId: string | null;
  lastSeenAt: string | null;
}

function mapLicense(row: Record<string, unknown>): KeyRow {
  return {
    id: String(row.id),
    orderId: row.order_id ? String(row.order_id) : null,
    key: 'CHAVE-PROTEGIDA',
    status: row.status === 'active' ? 'active' : 'revoked',
    createdAt: String(row.created_at || ''),
    revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    deviceId: row.device_id ? String(row.device_id) : null,
    installationId: row.installation_id ? String(row.installation_id) : null,
    lastSeenAt: row.last_seen_at ? String(row.last_seen_at) : null,
  };
}

export async function fetchKeys(): Promise<KeyRow[]> {
  const response = await fetchAdminLicenses();
  return response.licenses.map(mapLicense);
}

export async function createKeysBatch(quantity: number): Promise<KeyRow[]> {
  const response = await createAdminLicenses(Math.max(1, Math.min(50, quantity)));
  const now = new Date().toISOString();
  return response.licenses.map(({ id, key }) => ({
    id,
    orderId: null,
    key,
    status: 'active',
    createdAt: now,
    revokedAt: null,
    deviceId: null,
    installationId: null,
    lastSeenAt: null,
  }));
}

async function runAction(id: string, action: 'revoke' | 'reactivate' | 'release_device'): Promise<KeyRow> {
  await updateAdminLicense(id, action);
  const row = (await fetchKeys()).find((item) => item.id === id);
  if (!row) throw new Error('Licença não encontrada.');
  return row;
}

export function setKeyStatus(id: string, status: LicenseStatus): Promise<KeyRow> {
  return runAction(id, status === 'active' ? 'reactivate' : 'revoke');
}

export function unlinkMachine(id: string): Promise<KeyRow> {
  return runAction(id, 'release_device');
}
