import { Readable } from 'node:stream';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { MEDIA_MIME, createReadStream, mediaAbsPath, stat } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const rel = parts.join('/');
  const abs = mediaAbsPath(rel);
  const mime = MEDIA_MIME[path.extname(rel).slice(1).toLowerCase()];
  if (!abs || !mime) return new NextResponse('Not found', { status: 404 });

  try {
    const s = await stat(abs);
    if (!s.isFile()) throw new Error();
    return new NextResponse(Readable.toWeb(createReadStream(abs)) as ReadableStream, {
      headers: {
        'Content-Type': mime,
        'Content-Length': String(s.size),
        // Nomes são UUIDs: arquivo novo = URL nova, então pode ser imutável.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
