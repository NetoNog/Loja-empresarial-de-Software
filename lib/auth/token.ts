// Edge-safe (usado no middleware e no servidor). Sem dependências de Node.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'loja_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h (jornada de trabalho)

export type SessionPayload = { sub: string; role: string };

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET ausente ou curto (mínimo 32 caracteres).');
    }
    return new TextEncoder().encode('dev-only-secret-change-me-dev-only-secret');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: String(payload.role ?? 'USER') };
  } catch {
    return null;
  }
}
