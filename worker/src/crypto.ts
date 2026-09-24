const encoder = new TextEncoder();
const LICENSE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function ownedBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function randomToken(byteLength = 32): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

function licenseKeyFromBytes(bytes: Uint8Array): string {
  if (bytes.byteLength < 16) throw new Error('A chave requer pelo menos 128 bits de entropia.');
  let bitBuffer = 0;
  let bitCount = 0;
  let randomBody = '';
  for (const byte of bytes.slice(0, 16)) {
    bitBuffer = (bitBuffer << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      bitCount -= 5;
      randomBody += LICENSE_ALPHABET[(bitBuffer >>> bitCount) & 31];
    }
  }
  if (bitCount > 0) randomBody += LICENSE_ALPHABET[(bitBuffer << (5 - bitCount)) & 31];

  const checksumIndex = [...randomBody].reduce(
    (sum, character, index) => (sum + (index + 1) * LICENSE_ALPHABET.indexOf(character)) % 32,
    0,
  );
  const body = `${randomBody}${LICENSE_ALPHABET[checksumIndex]}`;
  return `JASPER-${body.match(/.{1,5}/g)?.join('-')}`;
}

export function generateLicenseKey(): string {
  return licenseKeyFromBytes(crypto.getRandomValues(new Uint8Array(16)));
}

async function hmacBytes(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

export async function deriveOrderLicenseKey(secret: string, orderId: string, orderSlot: number): Promise<string> {
  if (!secret || !orderId || !Number.isSafeInteger(orderSlot) || orderSlot < 0) throw new Error('Dados de emissão inválidos.');
  return licenseKeyFromBytes(await hmacBytes(secret, `jasper-license:v1:${orderId}:${orderSlot}`));
}

export async function hmacHex(secret: string, value: string): Promise<string> {
  return Array.from(await hmacBytes(secret, value), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function encryptJson(value: unknown, base64UrlKey: string): Promise<string> {
  const rawKey = base64UrlToBytes(base64UrlKey);
  if (rawKey.byteLength !== 32) throw new Error('DELIVERY_ENCRYPTION_KEY deve conter 32 bytes.');
  const key = await crypto.subtle.importKey('raw', ownedBuffer(rawKey), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(value)));
  return `${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptJson<T>(encrypted: string, base64UrlKey: string): Promise<T> {
  const [ivValue, ciphertextValue] = encrypted.split('.');
  if (!ivValue || !ciphertextValue) throw new Error('Conteúdo criptografado inválido.');
  const key = await crypto.subtle.importKey('raw', ownedBuffer(base64UrlToBytes(base64UrlKey)), 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ownedBuffer(base64UrlToBytes(ivValue)) },
    key,
    ownedBuffer(base64UrlToBytes(ciphertextValue)),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}
