import { Readable } from 'node:stream';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { clientIpFrom } from '@/lib/request';
import { createReadStream, packageAbsPath, stat } from '@/lib/storage';

export const runtime = 'nodejs';

function contentDisposition(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await ctx.params;
  const version = await prisma.appVersion.findUnique({
    where: { id: versionId },
    include: { app: { select: { id: true, published: true } } },
  });
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(req.nextUrl.pathname)}`, req.url));
  }
  const isAdmin = user.role === 'ADMIN' || user.role === 'MASTER';
  if (!version || (!version.app.published && !isAdmin)) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  const abs = packageAbsPath(version.filePath);
  const s = abs ? await stat(abs).catch(() => null) : null;
  if (!abs || !s?.isFile()) return NextResponse.json({ error: 'Arquivo indisponível no servidor' }, { status: 410 });

  const size = s.size;
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': contentDisposition(version.fileName),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    ETag: `"${version.sha256}"`,
    'X-Checksum-SHA256': version.sha256,
  };

  // Suporte a Range (retomar downloads grandes). Só a 1ª requisição (sem Range ou bytes=0-) é contabilizada.
  const range = req.headers.get('range');
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  let start = 0;
  let end = size - 1;
  if (match && (match[1] || match[2])) {
    if (match[1]) {
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    } else {
      start = Math.max(0, size - Number(match[2]));
    }
    if (start > end || start >= size) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
  }

  if (start === 0) {
    await prisma.$transaction([
      prisma.appVersion.update({ where: { id: version.id }, data: { downloads: { increment: 1 } } }),
      prisma.app.update({ where: { id: version.app.id }, data: { downloadCount: { increment: 1 } } }),
      prisma.download.create({
        data: { appId: version.app.id, versionId: version.id, userId: user.id, ip: clientIpFrom(req.headers) },
      }),
    ]);
  }

  const stream = Readable.toWeb(createReadStream(abs, { start, end })) as ReadableStream;
  const partial = start !== 0 || end !== size - 1;
  return new NextResponse(stream, {
    status: partial ? 206 : 200,
    headers: {
      ...headers,
      'Content-Length': String(end - start + 1),
      ...(partial ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
    },
  });
}
