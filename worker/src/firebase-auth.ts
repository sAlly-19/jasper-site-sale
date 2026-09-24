import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HttpError } from './http';
import type { Env, FirebaseIdentity } from './types';

const GOOGLE_FIREBASE_KEYS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

export async function requireFirebaseIdentity(request: Request, env: Env): Promise<FirebaseIdentity> {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, 'authentication_required', 'Autenticação obrigatória.');

  try {
    const issuer = `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`;
    const { payload } = await jwtVerify(match[1]!, GOOGLE_FIREBASE_KEYS, {
      issuer,
      audience: env.FIREBASE_PROJECT_ID,
      algorithms: ['RS256'],
    });
    if (!payload.sub) throw new Error('Token sem subject.');
    return typeof payload.email === 'string'
      ? { uid: payload.sub, email: payload.email }
      : { uid: payload.sub };
  } catch {
    throw new HttpError(401, 'invalid_token', 'Token Firebase inválido ou expirado.');
  }
}

export async function requireAdmin(request: Request, env: Env): Promise<FirebaseIdentity> {
  const identity = await requireFirebaseIdentity(request, env);
  const admin = await env.DB.prepare('SELECT status FROM admins WHERE uid = ?').bind(identity.uid).first<{ status: string }>();
  if (!admin || admin.status !== 'active') throw new HttpError(403, 'admin_required', 'Acesso administrativo negado.');
  return identity;
}
