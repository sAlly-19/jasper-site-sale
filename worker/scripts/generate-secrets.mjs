import { generateKeyPairSync, randomBytes } from 'node:crypto';

const randomSecret = () => randomBytes(32).toString('base64url');
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const privateJwk = privateKey.export({ format: 'jwk' });
const publicJwk = publicKey.export({ format: 'jwk' });
privateJwk.kid = 'jasper-lease-1';
publicJwk.kid = 'jasper-lease-1';

console.log(`LICENSE_PEPPER=${randomSecret()}`);
console.log(`ORDER_TOKEN_PEPPER=${randomSecret()}`);
console.log(`DEVICE_SECRET_PEPPER=${randomSecret()}`);
console.log(`DELIVERY_ENCRYPTION_KEY=${randomSecret()}`);
console.log(`LEASE_PRIVATE_JWK=${JSON.stringify(privateJwk)}`);
console.log(`LEASE_PUBLIC_JWK=${JSON.stringify(publicJwk)}`);
