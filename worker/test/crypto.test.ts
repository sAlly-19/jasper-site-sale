import { describe, expect, it } from 'vitest';
import {
  bytesToBase64Url,
  constantTimeEqual,
  decryptJson,
  deriveOrderLicenseKey,
  encryptJson,
  generateLicenseKey,
  hmacHex,
} from '../src/crypto';

describe('license cryptography', () => {
  it('generates high-entropy keys in the public format', () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const keys = new Set(Array.from({ length: 500 }, () => generateLicenseKey()));
    expect(keys.size).toBe(500);
    for (const key of keys) {
      expect(key).toMatch(/^JASPER-(?:[A-HJ-NP-Z2-9]{5}-){5}[A-HJ-NP-Z2-9]{2}$/);
      const body = key.slice('JASPER-'.length).replaceAll('-', '');
      const checksum = [...body.slice(0, -1)].reduce(
        (sum, character, index) => (sum + (index + 1) * alphabet.indexOf(character)) % 32,
        0,
      );
      expect(body.at(-1)).toBe(alphabet[checksum]);
    }
  });

  it('hashes keys deterministically without storing the plaintext', async () => {
    const first = await hmacHex('pepper-with-more-than-thirty-two-characters', 'JASPER-ABCDE-FGHJK-LMNPQ-RSTUV-WXYZ2-34');
    const second = await hmacHex('pepper-with-more-than-thirty-two-characters', 'JASPER-ABCDE-FGHJK-LMNPQ-RSTUV-WXYZ2-34');
    expect(first).toHaveLength(64);
    expect(constantTimeEqual(first, second)).toBe(true);
    expect(first).not.toContain('JASPER');
  });

  it('derives the same license for an order slot during concurrent retries', async () => {
    const secret = 'license-pepper-with-at-least-thirty-two-characters';
    const [first, retry, nextSlot] = await Promise.all([
      deriveOrderLicenseKey(secret, 'order-with-256-bits-of-randomness', 0),
      deriveOrderLicenseKey(secret, 'order-with-256-bits-of-randomness', 0),
      deriveOrderLicenseKey(secret, 'order-with-256-bits-of-randomness', 1),
    ]);
    expect(first).toBe(retry);
    expect(first).not.toBe(nextSlot);
    expect(first).toMatch(/^JASPER-(?:[A-HJ-NP-Z2-9]{5}-){5}[A-HJ-NP-Z2-9]{2}$/);
  });

  it('encrypts and decrypts delivery data with AES-GCM', async () => {
    const key = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    const licenses = ['JASPER-ABCDE-FGHJK-LMNPQ-RSTUV-WXYZ2-34'];
    const encrypted = await encryptJson(licenses, key);
    expect(encrypted).not.toContain(licenses[0]);
    await expect(decryptJson<string[]>(encrypted, key)).resolves.toEqual(licenses);
  });
});
