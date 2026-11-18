'use server';

import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { requireMaster } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { isRole } from '@/lib/roles';
import { emailSchema, zodErrors, type ActionState } from '@/lib/validation';

/** Apenas o Admin Master gerencia papéis. Garante que sempre reste ao menos um MASTER ativo. */
async function assertNotLastMaster(userId: string) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (target?.role !== 'MASTER') return;
  const masters = await prisma.user.count({ where: { role: 'MASTER', active: true } });
  if (masters <= 1) throw new Error('Não é possível remover o último Admin Master.');
}

export async function setUserRoleAction(userId: string, role: string): Promise<ActionState> {
  const me = await requireMaster();
  if (!isRole(role)) return { message: 'Papel inválido.' };
  if (userId === me.id) return { message: 'Você não pode alterar o seu próprio papel.' };
  try {
    if (role !== 'MASTER') await assertNotLastMaster(userId);
  } catch (err) {
    return { message: (err as Error).message };
  }
  const u = await prisma.user.update({ where: { id: userId }, data: { role } });
  await audit(me.id, 'user.role', 'user', userId, { email: u.email, role });
  revalidatePath('/admin/usuarios');
  return { ok: true, message: `${u.name} agora é ${role === 'USER' ? 'Usuário' : role === 'ADMIN' ? 'Administrador' : 'Admin Master'}.` };
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<ActionState> {
  const me = await requireMaster();
  if (userId === me.id) return { message: 'Você não pode desativar a própria conta.' };
  try {
    if (!active) await assertNotLastMaster(userId);
  } catch (err) {
    return { message: (err as Error).message };
  }
  const u = await prisma.user.update({ where: { id: userId }, data: { active } });
  await audit(me.id, active ? 'user.activate' : 'user.deactivate', 'user', userId, { email: u.email });
  revalidatePath('/admin/usuarios');
  return { ok: true, message: active ? 'Conta reativada.' : 'Conta desativada.' };
}

function tempPassword() {
  // 14 caracteres, sem caracteres ambíguos; sempre com letra e número.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(14);
  const pwd = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return /\d/.test(pwd) && /[A-Za-z]/.test(pwd) ? pwd : `${pwd.slice(0, 12)}a7`;
}

export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireMaster();
  const parsed = z
    .object({
      name: z.string().trim().min(3, 'Informe o nome').max(80),
      email: emailSchema,
      role: z.string().refine(isRole, 'Papel inválido'),
    })
    .safeParse({ name: formData.get('name'), email: formData.get('email'), role: formData.get('role') || 'USER' });
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  if (await prisma.user.findUnique({ where: { email: parsed.data.email } })) return { errors: { email: 'E-mail já cadastrado' } };

  const password = tempPassword();
  const u = await prisma.user.create({
    data: { ...parsed.data, passwordHash: await bcrypt.hash(password, 12) },
  });
  await audit(me.id, 'user.create', 'user', u.id, { email: u.email, role: u.role });
  revalidatePath('/admin/usuarios');
  return { ok: true, message: `Conta criada. Senha temporária: ${password} — repasse ao colaborador e peça para trocá-la em "Minha conta".` };
}

export async function resetPasswordAction(userId: string): Promise<ActionState> {
  const me = await requireMaster();
  const password = tempPassword();
  const u = await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  await audit(me.id, 'user.reset_password', 'user', userId, { email: u.email });
  return { ok: true, message: `Nova senha temporária de ${u.name}: ${password}` };
}
