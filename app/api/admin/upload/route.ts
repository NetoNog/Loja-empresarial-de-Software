import { NextResponse, type NextRequest } from 'next/server';
import { getAdminOrNull } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rate-limit';
import { isSameOrigin } from '@/lib/request';
import { MAX_PACKAGE_BYTES, packageExtAllowed, sanitizeFileName, saveTempUpload } from '@/lib/storage';

export const runtime = 'nodejs';
export const maxDuration = 3600;

/**
 * Upload de instalador em streaming (sem carregar o arquivo em memória).
 * PUT /api/admin/upload?name=<arquivo>  body: bytes do arquivo
 * Retorna { tempId, size, sha256, fileName } para ser usado em createVersionAction.
 */
export async function PUT(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Origem inválida' }, { status: 403 });
  const admin = await getAdminOrNull();
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (!rateLimit(`upload:${admin.id}`, 30, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: 'Limite de uploads por hora atingido' }, { status: 429 });
  }

  const name = sanitizeFileName(req.nextUrl.searchParams.get('name') ?? '');
  if (!packageExtAllowed(name)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 415 });
  }
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_PACKAGE_BYTES) {
    return NextResponse.json({ error: 'Arquivo excede o limite permitido' }, { status: 413 });
  }
  if (!req.body) return NextResponse.json({ error: 'Corpo vazio' }, { status: 400 });

  try {
    const result = await saveTempUpload(req.body, name);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
