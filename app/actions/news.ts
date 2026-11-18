'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { audit } from '@/lib/audit';
import { requireAdmin } from '@/lib/auth/session';
import { slugify } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { deleteMedia, saveImage } from '@/lib/storage';
import { newsSchema, zodErrors, type ActionState } from '@/lib/validation';

async function uniqueNewsSlug(base: string, ignoreId?: string) {
  const root = base || 'noticia';
  let slug = root;
  for (let i = 2; ; i++) {
    const hit = await prisma.news.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${root}-${i}`;
  }
}

export async function saveNewsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const id = String(formData.get('id') ?? '') || null;
  const parsed = newsSchema.safeParse({
    title: formData.get('title') ?? '',
    slug: formData.get('slug') ?? '',
    summary: formData.get('summary') ?? '',
    body: formData.get('body') ?? '',
    appId: formData.get('appId') ?? '',
    published: formData.get('published') === 'on',
  });
  if (!parsed.success) return { errors: zodErrors(parsed.error), message: 'Revise os campos destacados.' };
  const d = parsed.data;

  if (d.appId && !(await prisma.app.findUnique({ where: { id: d.appId } }))) return { errors: { appId: 'App inválido' } };

  const cover = formData.get('cover');
  let coverPath: string | undefined;
  if (cover instanceof File && cover.size > 0) {
    try {
      coverPath = await saveImage(cover, 'news');
    } catch (err) {
      return { message: (err as Error).message };
    }
  }

  const before = id ? await prisma.news.findUnique({ where: { id } }) : null;
  if (id && !before) return { message: 'Notícia não encontrada.' };

  const data = {
    title: d.title,
    slug: await uniqueNewsSlug(d.slug || slugify(d.title), id ?? undefined),
    summary: d.summary,
    body: d.body,
    appId: d.appId,
    published: d.published,
    publishedAt: d.published ? (before?.publishedAt ?? new Date()) : null,
    ...(coverPath ? { coverPath } : {}),
  };

  if (before) {
    await prisma.news.update({ where: { id: before.id }, data });
    if (coverPath) await deleteMedia(before.coverPath);
    await audit(me.id, 'news.update', 'news', before.id, { title: d.title, published: d.published });
  } else {
    const created = await prisma.news.create({ data: { ...data, authorId: me.id } });
    await audit(me.id, 'news.create', 'news', created.id, { title: d.title });
  }
  revalidatePath('/', 'layout');
  if (!before) redirect('/admin/noticias');
  return { ok: true, message: 'Notícia salva.' };
}

export async function deleteNewsAction(id: string) {
  const me = await requireAdmin();
  const n = await prisma.news.findUnique({ where: { id } });
  if (!n) return;
  await prisma.news.delete({ where: { id } });
  await deleteMedia(n.coverPath);
  await audit(me.id, 'news.delete', 'news', id, { title: n.title });
  revalidatePath('/', 'layout');
  redirect('/admin/noticias');
}
