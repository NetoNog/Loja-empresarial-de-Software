import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { compareVersions } from '@/lib/format';
import { mediaUrl } from '@/lib/storage';

// ---------- Tipos serializáveis (seguros para Client Components) ----------

export type AppCardData = {
  id: string;
  slug: string;
  name: string;
  publisher: string;
  shortDescription: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  category: string | null;
  downloadCount: number;
  latestVersion: string | null;
  updatedAt: string;
};

const cardInclude = {
  category: { select: { name: true } },
  versions: { select: { version: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.AppInclude;

type CardRow = Prisma.AppGetPayload<{ include: typeof cardInclude }>;

function toCard(a: CardRow): AppCardData {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    publisher: a.publisher,
    shortDescription: a.shortDescription,
    iconUrl: mediaUrl(a.iconPath),
    bannerUrl: mediaUrl(a.bannerPath),
    category: a.category?.name ?? null,
    downloadCount: a.downloadCount,
    latestVersion: a.versions[0]?.version ?? null,
    updatedAt: (a.versions[0]?.createdAt ?? a.updatedAt).toISOString(),
  };
}

const publishedWithVersion = { published: true, versions: { some: {} } } satisfies Prisma.AppWhereInput;

// ---------- Vitrine ----------

export async function getHomeData() {
  const [featured, recent, popular, news, categories] = await Promise.all([
    prisma.app.findMany({ where: { ...publishedWithVersion, featured: true }, include: cardInclude, orderBy: { updatedAt: 'desc' }, take: 6 }),
    prisma.app.findMany({ where: publishedWithVersion, include: cardInclude, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.app.findMany({ where: publishedWithVersion, include: cardInclude, orderBy: { downloadCount: 'desc' }, take: 8 }),
    getNewsList(3),
    prisma.category.findMany({
      where: { apps: { some: publishedWithVersion } },
      orderBy: { name: 'asc' },
      select: { name: true, slug: true, _count: { select: { apps: { where: publishedWithVersion } } } },
    }),
  ]);
  return {
    featured: featured.map(toCard),
    recent: recent.map(toCard),
    popular: popular.map(toCard),
    news,
    categories: categories.map((c) => ({ name: c.name, slug: c.slug, count: c._count.apps })),
  };
}

export async function searchApps(opts: { q?: string; category?: string; sort?: string; page?: number; pageSize?: number }) {
  const pageSize = opts.pageSize ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const q = opts.q?.trim().slice(0, 80);
  const where: Prisma.AppWhereInput = {
    ...publishedWithVersion,
    ...(opts.category ? { category: { slug: opts.category } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { shortDescription: { contains: q } },
            { tags: { contains: q } },
            { publisher: { contains: q } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.AppOrderByWithRelationInput =
    opts.sort === 'populares' ? { downloadCount: 'desc' } : opts.sort === 'nome' ? { name: 'asc' } : { updatedAt: 'desc' };

  const [rows, total, categories] = await Promise.all([
    prisma.app.findMany({ where, include: cardInclude, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.app.count({ where }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { name: true, slug: true } }),
  ]);
  return { apps: rows.map(toCard), total, page, pageSize, categories };
}

// ---------- Detalhe do app ----------

export async function getAppBySlug(slug: string, opts: { includeUnpublished?: boolean } = {}) {
  const app = await prisma.app.findUnique({
    where: { slug },
    include: {
      category: true,
      screenshots: { orderBy: { order: 'asc' } },
      versions: { orderBy: { createdAt: 'desc' } },
      news: { where: { published: true }, orderBy: { publishedAt: 'desc' }, take: 3 },
    },
  });
  if (!app || (!app.published && !opts.includeUnpublished)) return null;

  const versions = app.versions.map((v) => ({
    id: v.id,
    version: v.version,
    platform: v.platform,
    changelog: v.changelog,
    fileName: v.fileName,
    fileSize: Number(v.fileSize),
    sha256: v.sha256,
    downloads: v.downloads,
    createdAt: v.createdAt.toISOString(),
  }));

  // Versão mais recente por plataforma (ex.: x64 e x86 lado a lado).
  const latestByPlatform = new Map<string, (typeof versions)[number]>();
  for (const v of versions) {
    const cur = latestByPlatform.get(v.platform);
    if (!cur || compareVersions(v.version, cur.version) > 0) latestByPlatform.set(v.platform, v);
  }

  return {
    id: app.id,
    slug: app.slug,
    name: app.name,
    publisher: app.publisher,
    shortDescription: app.shortDescription,
    description: app.description,
    iconUrl: mediaUrl(app.iconPath),
    bannerUrl: mediaUrl(app.bannerPath),
    website: app.website,
    tags: app.tags.split(',').map((t) => t.trim()).filter(Boolean),
    category: app.category ? { name: app.category.name, slug: app.category.slug } : null,
    downloadCount: app.downloadCount,
    itomPackageId: app.itomPackageId,
    published: app.published,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    screenshots: app.screenshots.map((s) => ({ id: s.id, url: mediaUrl(s.path)!, caption: s.caption })),
    versions,
    latest: [...latestByPlatform.values()],
    news: app.news.map((n) => ({ slug: n.slug, title: n.title, summary: n.summary, publishedAt: n.publishedAt?.toISOString() ?? null })),
  };
}

export type AppDetail = NonNullable<Awaited<ReturnType<typeof getAppBySlug>>>;

// ---------- Atualizações (release notes) ----------

export async function getRecentUpdates(take = 30) {
  const rows = await prisma.appVersion.findMany({
    where: { app: { published: true } },
    orderBy: { createdAt: 'desc' },
    take,
    include: { app: { select: { name: true, slug: true, iconPath: true, publisher: true } } },
  });
  return rows.map((v) => ({
    id: v.id,
    version: v.version,
    platform: v.platform,
    changelog: v.changelog,
    fileSize: Number(v.fileSize),
    createdAt: v.createdAt.toISOString(),
    app: { name: v.app.name, slug: v.app.slug, publisher: v.app.publisher, iconUrl: mediaUrl(v.app.iconPath) },
  }));
}

// ---------- Notícias ----------

export async function getNewsList(take = 20, skip = 0) {
  const rows = await prisma.news.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take,
    skip,
    include: { app: { select: { name: true, slug: true } }, author: { select: { name: true } } },
  });
  return rows.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    summary: n.summary,
    coverUrl: mediaUrl(n.coverPath),
    publishedAt: n.publishedAt?.toISOString() ?? n.createdAt.toISOString(),
    app: n.app,
    author: n.author?.name ?? null,
  }));
}

export async function getNewsBySlug(slug: string) {
  const n = await prisma.news.findUnique({
    where: { slug },
    include: { app: { select: { name: true, slug: true, iconPath: true } }, author: { select: { name: true } } },
  });
  if (!n || !n.published) return null;
  return {
    title: n.title,
    summary: n.summary,
    body: n.body,
    coverUrl: mediaUrl(n.coverPath),
    publishedAt: n.publishedAt?.toISOString() ?? n.createdAt.toISOString(),
    app: n.app ? { name: n.app.name, slug: n.app.slug, iconUrl: mediaUrl(n.app.iconPath) } : null,
    author: n.author?.name ?? null,
  };
}

// ---------- Biblioteca do usuário ----------

export async function getUserLibrary(userId: string) {
  const downloads = await prisma.download.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      version: { select: { version: true, platform: true } },
      app: {
        select: {
          id: true,
          slug: true,
          name: true,
          publisher: true,
          iconPath: true,
          published: true,
          versions: { select: { version: true, platform: true, createdAt: true } },
        },
      },
    },
  });

  // Agrupa por app+plataforma: último download do usuário vs. última versão publicada.
  const seen = new Map<string, ReturnType<typeof row>>();
  function row(d: (typeof downloads)[number]) {
    const sameplat = d.app.versions.filter((v) => v.platform === d.version.platform);
    const latest = sameplat.reduce<string | null>((acc, v) => (!acc || compareVersions(v.version, acc) > 0 ? v.version : acc), null);
    return {
      key: `${d.app.id}:${d.version.platform}`,
      app: { slug: d.app.slug, name: d.app.name, publisher: d.app.publisher, iconUrl: mediaUrl(d.app.iconPath), published: d.app.published },
      platform: d.version.platform,
      installedVersion: d.version.version,
      latestVersion: latest,
      hasUpdate: !!latest && compareVersions(latest, d.version.version) > 0,
      downloadedAt: d.createdAt.toISOString(),
    };
  }
  for (const d of downloads) {
    const r = row(d);
    if (!seen.has(r.key)) seen.set(r.key, r);
  }
  return [...seen.values()];
}
