'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { requireAdmin } from '@/lib/auth/session';
import { PLATFORMS, slugify } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import {
  commitTempUpload,
  deleteAppPackages,
  deleteMedia,
  deletePackage,
  packageExtAllowed,
  readTempUpload,
  saveImage,
} from '@/lib/storage';
import { appSchema, versionSchema, zodErrors, type ActionState } from '@/lib/validation';

function revalidateStore(slug?: string) {
  revalidatePath('/', 'layout');
  if (slug) revalidatePath(`/apps/${slug}`);
}

async function uniqueAppSlug(base: string, ignoreId?: string) {
  const root = base || 'app';
  let slug = root;
  for (let i = 2; ; i++) {
    const hit = await prisma.app.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${root}-${i}`;
  }
}

function readAppForm(formData: FormData) {
  return appSchema.safeParse({
    name: formData.get('name') ?? '',
    slug: formData.get('slug') ?? '',
    publisher: formData.get('publisher') ?? '',
    shortDescription: formData.get('shortDescription') ?? '',
    description: formData.get('description') ?? '',
    categoryId: formData.get('categoryId') ?? '',
    website: formData.get('website') ?? '',
    tags: formData.get('tags') ?? '',
    itomPackageId: formData.get('itomPackageId') ?? '',
    featured: formData.get('featured') === 'on',
    published: formData.get('published') === 'on',
  });
}

function imageFrom(formData: FormData, key: string): File | null {
  const f = formData.get(key);
  return f instanceof File && f.size > 0 ? f : null;
}

// ---------- Apps ----------

export async function saveAppAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const id = String(formData.get('id') ?? '') || null;
  const parsed = readAppForm(formData);
  if (!parsed.success) return { errors: zodErrors(parsed.error), message: 'Revise os campos destacados.' };
  const data = parsed.data;

  if (data.categoryId && !(await prisma.category.findUnique({ where: { id: data.categoryId } }))) {
    return { errors: { categoryId: 'Categoria inválida' } };
  }

  const slug = await uniqueAppSlug(data.slug || slugify(data.name), id ?? undefined);
  const icon = imageFrom(formData, 'icon');
  const banner = imageFrom(formData, 'banner');

  let iconPath: string | undefined;
  let bannerPath: string | undefined;
  try {
    if (icon) iconPath = await saveImage(icon, 'icons');
    if (banner) bannerPath = await saveImage(banner, 'banners');
  } catch (err) {
    return { message: (err as Error).message };
  }

  const payload = {
    name: data.name,
    slug,
    publisher: data.publisher,
    shortDescription: data.shortDescription,
    description: data.description,
    categoryId: data.categoryId,
    website: data.website,
    tags: data.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .join(','),
    itomPackageId: data.itomPackageId,
    featured: data.featured,
    published: data.published,
    ...(iconPath ? { iconPath } : {}),
    ...(bannerPath ? { bannerPath } : {}),
  };

  let appId: string;
  if (id) {
    const before = await prisma.app.findUnique({ where: { id } });
    if (!before) return { message: 'Aplicativo não encontrado.' };
    await prisma.app.update({ where: { id }, data: payload });
    if (iconPath) await deleteMedia(before.iconPath);
    if (bannerPath) await deleteMedia(before.bannerPath);
    await audit(me.id, 'app.update', 'app', id, { name: data.name, published: data.published });
    appId = id;
    revalidateStore(before.slug);
  } else {
    const created = await prisma.app.create({ data: payload });
    await audit(me.id, 'app.create', 'app', created.id, { name: data.name });
    appId = created.id;
  }

  revalidateStore(slug);
  if (!id) redirect(`/admin/apps/${appId}?aba=versoes&novo=1`);
  return { ok: true, message: 'Alterações salvas.' };
}

export async function deleteAppAction(appId: string) {
  const me = await requireAdmin();
  const app = await prisma.app.findUnique({ where: { id: appId }, include: { screenshots: true } });
  if (!app) return;
  await prisma.app.delete({ where: { id: appId } });
  await Promise.all([
    deleteAppPackages(appId),
    deleteMedia(app.iconPath),
    deleteMedia(app.bannerPath),
    ...app.screenshots.map((s) => deleteMedia(s.path)),
  ]);
  await audit(me.id, 'app.delete', 'app', appId, { name: app.name });
  revalidateStore(app.slug);
  redirect('/admin/apps');
}

export async function togglePublishAction(appId: string, published: boolean) {
  const me = await requireAdmin();
  const app = await prisma.app.update({ where: { id: appId }, data: { published } });
  await audit(me.id, published ? 'app.publish' : 'app.unpublish', 'app', appId, { name: app.name });
  revalidateStore(app.slug);
}

// ---------- Versões ----------

export async function createVersionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const parsed = versionSchema.safeParse({
    appId: formData.get('appId'),
    tempId: formData.get('tempId'),
    version: formData.get('version'),
    platform: formData.get('platform'),
    changelog: formData.get('changelog') ?? '',
  });
  if (!parsed.success) return { errors: zodErrors(parsed.error), message: 'Revise os campos destacados.' };
  const { appId, tempId, version, platform, changelog } = parsed.data;
  if (!PLATFORMS[platform]) return { errors: { platform: 'Plataforma inválida' } };

  const app = await prisma.app.findUnique({ where: { id: appId } });
  if (!app) return { message: 'Aplicativo não encontrado.' };

  const dup = await prisma.appVersion.findUnique({ where: { appId_version_platform: { appId, version, platform } } });
  if (dup) return { errors: { version: 'Esta versão já existe para a plataforma escolhida' } };

  const temp = await readTempUpload(tempId);
  if (!temp) return { message: 'Upload expirado ou não encontrado. Envie o arquivo novamente.' };
  if (!packageExtAllowed(temp.fileName)) return { message: 'Tipo de arquivo não permitido.' };

  const filePath = await commitTempUpload(tempId, appId, randomUUID(), temp.fileName);
  const created = await prisma.appVersion.create({
    data: {
      appId,
      version,
      platform,
      changelog,
      fileName: temp.fileName,
      filePath,
      fileSize: BigInt(temp.size),
      sha256: temp.sha256,
      uploadedById: me.id,
    },
  });
  await prisma.app.update({ where: { id: appId }, data: { updatedAt: new Date() } });
  await audit(me.id, 'version.create', 'app', appId, { version, platform, file: temp.fileName, size: temp.size });
  revalidateStore(app.slug);
  return { ok: true, message: `Versão ${created.version} publicada.` };
}

export async function deleteVersionAction(versionId: string) {
  const me = await requireAdmin();
  const v = await prisma.appVersion.findUnique({ where: { id: versionId }, include: { app: true } });
  if (!v) return;
  await prisma.appVersion.delete({ where: { id: versionId } });
  await deletePackage(v.filePath);
  await audit(me.id, 'version.delete', 'app', v.appId, { version: v.version, platform: v.platform });
  revalidateStore(v.app.slug);
}

// ---------- Capturas de tela ----------

export async function addScreenshotsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const appId = String(formData.get('appId') ?? '');
  const app = await prisma.app.findUnique({ where: { id: appId }, include: { _count: { select: { screenshots: true } } } });
  if (!app) return { message: 'Aplicativo não encontrado.' };
  const files = formData.getAll('screenshots').filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { message: 'Selecione ao menos uma imagem.' };
  if (app._count.screenshots + files.length > 10) return { message: 'Máximo de 10 capturas por aplicativo.' };

  try {
    let order = app._count.screenshots;
    for (const f of files) {
      const path = await saveImage(f, `screenshots/${appId}`);
      await prisma.screenshot.create({ data: { appId, path, order: order++ } });
    }
  } catch (err) {
    return { message: (err as Error).message };
  }
  await audit(me.id, 'screenshot.add', 'app', appId, { count: files.length });
  revalidateStore(app.slug);
  return { ok: true, message: `${files.length} imagem(ns) adicionada(s).` };
}

export async function deleteScreenshotAction(id: string) {
  const me = await requireAdmin();
  const s = await prisma.screenshot.findUnique({ where: { id }, include: { app: true } });
  if (!s) return;
  await prisma.screenshot.delete({ where: { id } });
  await deleteMedia(s.path);
  await audit(me.id, 'screenshot.delete', 'app', s.appId);
  revalidateStore(s.app.slug);
}

// ---------- Categorias ----------

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const parsed = z.string().trim().min(2, 'Mínimo de 2 caracteres').max(40).safeParse(formData.get('name'));
  if (!parsed.success) return { errors: { name: parsed.error.issues[0].message } };
  const slug = slugify(parsed.data);
  const exists = await prisma.category.findFirst({ where: { OR: [{ name: parsed.data }, { slug }] } });
  if (exists) return { errors: { name: 'Categoria já existe' } };
  const c = await prisma.category.create({ data: { name: parsed.data, slug } });
  await audit(me.id, 'category.create', 'category', c.id, { name: c.name });
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Categoria criada.' };
}

export async function deleteCategoryAction(id: string) {
  const me = await requireAdmin();
  const c = await prisma.category.delete({ where: { id } }).catch(() => null);
  if (c) await audit(me.id, 'category.delete', 'category', id, { name: c.name });
  revalidatePath('/', 'layout');
}
