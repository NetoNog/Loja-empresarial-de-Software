import 'server-only';
import { headers } from 'next/headers';

/** IP do cliente. Só confia em X-Forwarded-For atrás de proxy conhecido (TRUST_PROXY=true). */
export function clientIpFrom(h: Headers): string | null {
  if (process.env.TRUST_PROXY === 'true') {
    const fwd = h.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (fwd) return fwd.replace(/^::ffff:/, '');
    const real = h.get('x-real-ip');
    if (real) return real.replace(/^::ffff:/, '');
  }
  return null;
}

export async function getClientIp(): Promise<string | null> {
  return clientIpFrom(await headers());
}

/** Proteção CSRF para route handlers que alteram estado. */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
