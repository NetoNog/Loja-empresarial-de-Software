import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isAdminRole, isMasterRole } from '@/lib/roles';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from './token';

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function createSession(user: { id: string; role: string }) {
  const token = await signSession({ sub: user.id, role: user.role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Lê a sessão e SEMPRE revalida no banco: mudanças de papel ou desativação
 * de conta têm efeito imediato, sem esperar o token expirar.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

export async function requireUser(next = '/'): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser('/admin');
  if (!isAdminRole(user.role)) redirect('/?erro=sem-permissao');
  return user;
}

export async function requireMaster(): Promise<CurrentUser> {
  const user = await requireUser('/admin');
  if (!isMasterRole(user.role)) redirect('/admin?erro=sem-permissao');
  return user;
}

/** Para route handlers: retorna o usuário admin ou null (sem redirect). */
export async function getAdminOrNull(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user && isAdminRole(user.role) ? user : null;
}
