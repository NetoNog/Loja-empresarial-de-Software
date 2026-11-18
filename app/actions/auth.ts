'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { createSession, destroySession, getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { rateLimit, resetRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request';
import { emailSchema, passwordSchema, zodErrors, type ActionState } from '@/lib/validation';

// Hash fixo para equalizar o tempo de resposta quando o e-mail não existe.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash('dummy-password-timing', 12));

function safeNext(next: unknown): string {
  const n = typeof next === 'string' ? next : '/';
  return n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : '/';
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, 'Informe a senha').max(128) })
    .safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { errors: zodErrors(parsed.error) };

  const { email, password } = parsed.data;
  const ip = (await getClientIp()) ?? 'local';
  const limitKey = `login:${email}:${ip}`;
  const limit = rateLimit(limitKey, 8, 15 * 60 * 1000);
  if (!limit.ok) {
    return { message: `Muitas tentativas. Tente novamente em ${Math.ceil(limit.retryAfterS / 60)} min.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid || !user.active) {
    await audit(user?.id ?? null, 'login.failed', 'user', user?.id, { email, ip });
    return { message: user && !user.active ? 'Conta desativada. Procure um administrador.' : 'E-mail ou senha incorretos.' };
  }

  resetRateLimit(limitKey);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user);
  await audit(user.id, 'login', 'user', user.id, { ip });
  redirect(safeNext(formData.get('next')));
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (process.env.ALLOW_REGISTRATION === 'false') return { message: 'Cadastro desabilitado. Procure um administrador.' };

  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN?.trim().toLowerCase();
  const parsed = z
    .object({
      name: z.string().trim().min(3, 'Informe seu nome').max(80),
      email: emailSchema.refine((e) => !allowedDomain || e.endsWith(`@${allowedDomain}`), `Use seu e-mail @${allowedDomain}`),
      password: passwordSchema,
      confirm: z.string(),
    })
    .refine((d) => d.password === d.confirm, { message: 'As senhas não conferem', path: ['confirm'] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };

  const ip = (await getClientIp()) ?? 'local';
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000).ok) return { message: 'Muitos cadastros a partir deste endereço. Tente mais tarde.' };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { errors: { email: 'Já existe uma conta com este e-mail' } };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      role: 'USER',
    },
  });
  await audit(user.id, 'register', 'user', user.id);
  await createSession(user);
  redirect('/');
}

export async function logoutAction() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit(user.id, 'logout', 'user', user.id);
  redirect('/');
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  const parsed = z
    .object({ current: z.string().min(1, 'Informe a senha atual'), password: passwordSchema, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: 'As senhas não conferem', path: ['confirm'] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await bcrypt.compare(parsed.data.current, user.passwordHash))) return { errors: { current: 'Senha atual incorreta' } };

  await prisma.user.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } });
  await audit(me.id, 'password.change', 'user', me.id);
  return { ok: true, message: 'Senha alterada com sucesso.' };
}
