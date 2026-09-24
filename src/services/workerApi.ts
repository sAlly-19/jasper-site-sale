import { auth } from '@/config/firebase';

const API_BASE_URL = (process.env.EXPO_PUBLIC_JASPER_API_URL || '').replace(/\/+$/, '');

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

async function apiRequest<T>(path: string, init: RequestInit = {}, requireAdmin = false): Promise<T> {
  if (!API_BASE_URL) throw new Error('API de pagamento não configurada.');
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (requireAdmin) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Sessão administrativa expirada.');
    headers.set('authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({})) as ApiErrorBody & T;
  if (!response.ok) throw new Error(body.error?.message || 'Não foi possível concluir a operação.');
  return body;
}

export interface CheckoutOrder {
  orderId: string;
  accessToken: string;
  status: 'pending';
  checkoutUrl: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  currency: 'BRL';
}

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

export interface WorkerPromotion {
  id: string;
  code: string;
  title: Record<string, string>;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function fetchActivePromotion(): Promise<{ promotion: WorkerPromotion | null }> {
  return apiRequest('/v1/promotions/active');
}

export function fetchPublicCatalog(): Promise<PublicCatalog> {
  return apiRequest('/v1/catalog');
}

export function fetchAdminPromotions(): Promise<{ promotions: WorkerPromotion[] }> {
  return apiRequest('/v1/admin/promotions', {}, true);
}

export function createAdminPromotion(input: {
  code: string;
  discountPercent: number;
  title: Record<string, string>;
  startsAt?: string;
  endsAt: string;
}): Promise<{ promotion: WorkerPromotion }> {
  return apiRequest('/v1/admin/promotions', { method: 'POST', body: JSON.stringify(input) }, true);
}

export function setAdminPromotionActive(id: string, active: boolean): Promise<{ promotion: WorkerPromotion }> {
  return apiRequest(`/v1/admin/promotions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  }, true);
}

export function deleteAdminPromotion(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/v1/admin/promotions/${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
}

export function createCheckoutOrder(input: {
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  promotionCode?: string;
}): Promise<CheckoutOrder> {
  return apiRequest('/v1/orders', { method: 'POST', body: JSON.stringify(input) });
}

export function getCheckoutOrder(orderId: string, accessToken: string): Promise<Record<string, unknown>> {
  return apiRequest(`/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
}

export function fetchAdminLicenses(): Promise<{ licenses: Array<Record<string, unknown>> }> {
  return apiRequest('/v1/admin/licenses', {}, true);
}

export function createAdminLicenses(quantity: number): Promise<{ licenses: Array<{ id: string; key: string }> }> {
  return apiRequest('/v1/admin/licenses', { method: 'POST', body: JSON.stringify({ quantity }) }, true);
}

export function updateAdminLicense(id: string, action: 'revoke' | 'reactivate' | 'release_device'): Promise<{ success: boolean }> {
  return apiRequest(`/v1/admin/licenses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  }, true);
}
