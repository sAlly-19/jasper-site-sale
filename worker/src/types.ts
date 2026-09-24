export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGINS: string;
  PUBLIC_SITE_URL: string;
  API_PUBLIC_URL: string;
  MERCADO_PAGO_API_URL: string;
  MERCADO_PAGO_LIVE_MODE: string;
  LEASE_TTL_SECONDS: string;
  WEBHOOK_MAX_SKEW_SECONDS: string;
  MAX_ORDER_QUANTITY: string;
  PRODUCT_PRICE_BRL_CENTS: string;
  PRODUCT_PRICE_USD_CENTS: string;
  PRODUCT_PRICE_EUR_CENTS: string;
  MERCADO_PAGO_ACCESS_TOKEN: string;
  MERCADO_PAGO_WEBHOOK_SECRET: string;
  LICENSE_PEPPER: string;
  ORDER_TOKEN_PEPPER: string;
  DELIVERY_ENCRYPTION_KEY: string;
  DEVICE_SECRET_PEPPER: string;
  LEASE_PRIVATE_JWK: string;
  LEASE_PUBLIC_JWK: string;
}

export interface FirebaseIdentity {
  uid: string;
  email?: string;
}

export interface LicenseLease {
  token: string;
  expiresAt: string;
}
