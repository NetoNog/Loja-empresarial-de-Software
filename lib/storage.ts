import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/**
 * Estrutura:
 *   STORAGE_DIR/media/...      imagens públicas (ícones, capturas, capas) — servidas por /api/media
 *   STORAGE_DIR/packages/...   instaladores — servidos só por /api/download (contabiliza)
 *   STORAGE_DIR/tmp/...        uploads em andamento
 */
export const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR ?? path.join(process.cwd(), 'storage'));
const MEDIA_DIR = path.join(STORAGE_DIR, 'media');
const PACKAGES_DIR = path.join(STORAGE_DIR, 'packages');
const TMP_DIR = path.join(STORAGE_DIR, 'tmp');

export const MAX_PACKAGE_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 2048) * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_PACKAGE_EXT = new Set(
  (process.env.ALLOWED_PACKAGE_EXT ?? '.exe,.msi,.msix,.msixbundle,.appx,.zip,.7z,.rar,.apk,.dmg,.pkg,.deb,.rpm,.appimage,.jar,.pdf')
    .split(',')
    .map((e) => e.trim().toLowerCase()),
);

/** Resolve um caminho relativo dentro de base, bloqueando path traversal. */
export function safeJoin(base: string, rel: string): string | null {
  const full = path.resolve(base, rel);
  const relative = path.relative(base, full);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return full;
}

export function sanitizeFileName(name: string): string {
  const base = path.basename(name).normalize('NFKC');
  const clean = base.replace(/[^\w.\- ()]/g, '_').replace(/\s+/g, ' ').trim();
  return clean.slice(-150) || 'arquivo';
}

export function packageExtAllowed(fileName: string): boolean {
  return ALLOWED_PACKAGE_EXT.has(path.extname(fileName).toLowerCase());
}

// ---------- Pacotes (instaladores) ----------

export type TempUpload = { tempId: string; size: number; sha256: string; fileName: string };

/** Grava o corpo da requisição em disco via streaming, calculando SHA-256 e limitando tamanho. */
export async function saveTempUpload(body: ReadableStream<Uint8Array>, fileName: string): Promise<TempUpload> {
  await mkdir(TMP_DIR, { recursive: true });
  const tempId = randomUUID();
  const dest = path.join(TMP_DIR, tempId);
  const hash = createHash('sha256');
  let size = 0;

  const meter = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      size += chunk.length;
      if (size > MAX_PACKAGE_BYTES) return cb(new Error('LIMIT'));
      hash.update(chunk);
      cb(null, chunk);
    },
  });

  try {
    await pipeline(Readable.fromWeb(body as never), meter, createWriteStream(dest));
  } catch (err) {
    await rm(dest, { force: true });
    if (err instanceof Error && err.message === 'LIMIT') {
      throw new Error(`Arquivo excede o limite de ${Math.round(MAX_PACKAGE_BYTES / 1024 / 1024)} MB.`);
    }
    throw err;
  }
  if (size === 0) {
    await rm(dest, { force: true });
    throw new Error('Arquivo vazio.');
  }
  const meta = { fileName: sanitizeFileName(fileName), size, sha256: hash.digest('hex') };
  await writeFile(`${dest}.json`, JSON.stringify(meta));
  return { tempId, ...meta };
}

export async function readTempUpload(tempId: string): Promise<TempUpload | null> {
  if (!/^[0-9a-f-]{36}$/.test(tempId)) return null;
  const file = path.join(TMP_DIR, tempId);
  try {
    const meta = JSON.parse(await readFile(`${file}.json`, 'utf8'));
    await stat(file);
    return { tempId, ...meta };
  } catch {
    return null;
  }
}

/** Move o upload temporário para packages/<appId>/<versionId>/<nome>. Retorna caminho relativo. */
export async function commitTempUpload(tempId: string, appId: string, versionKey: string, fileName: string): Promise<string> {
  const rel = path.posix.join(appId, versionKey, sanitizeFileName(fileName));
  const dest = safeJoin(PACKAGES_DIR, rel);
  if (!dest) throw new Error('Caminho inválido');
  await mkdir(path.dirname(dest), { recursive: true });
  await rename(path.join(TMP_DIR, tempId), dest);
  await rm(path.join(TMP_DIR, `${tempId}.json`), { force: true });
  return rel;
}

export function packageAbsPath(rel: string): string | null {
  return safeJoin(PACKAGES_DIR, rel);
}

export async function deletePackage(rel: string) {
  const abs = packageAbsPath(rel);
  if (abs) await rm(path.dirname(abs), { recursive: true, force: true });
}

export async function deleteAppPackages(appId: string) {
  const abs = safeJoin(PACKAGES_DIR, appId);
  if (abs) await rm(abs, { recursive: true, force: true });
}

// ---------- Mídia (imagens) ----------

const IMAGE_SIGNATURES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: 'png', mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  { ext: 'gif', mime: 'image/gif', test: (b) => b.subarray(0, 4).toString() === 'GIF8' },
];

export const MEDIA_MIME: Record<string, string> = Object.fromEntries(IMAGE_SIGNATURES.map((s) => [s.ext, s.mime]));

/**
 * Salva imagem validando pela assinatura binária (não confia na extensão/MIME do cliente).
 * SVG é recusado de propósito (pode carregar script).
 */
export async function saveImage(file: File, folder: string): Promise<string> {
  if (file.size === 0) throw new Error('Imagem vazia.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Imagem maior que 5 MB.');
  const buf = Buffer.from(await file.arrayBuffer());
  const sig = IMAGE_SIGNATURES.find((s) => s.test(buf));
  if (!sig) throw new Error('Formato de imagem não suportado (use PNG, JPG, WEBP ou GIF).');
  const rel = path.posix.join(folder, `${randomUUID()}.${sig.ext}`);
  const dest = safeJoin(MEDIA_DIR, rel);
  if (!dest) throw new Error('Caminho inválido');
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return rel;
}

export function mediaAbsPath(rel: string): string | null {
  return safeJoin(MEDIA_DIR, rel);
}

export async function deleteMedia(rel: string | null | undefined) {
  if (!rel) return;
  const abs = mediaAbsPath(rel);
  if (abs) await rm(abs, { force: true });
}

export function mediaUrl(rel: string | null | undefined): string | null {
  return rel ? `/api/media/${rel}` : null;
}

export { createReadStream, stat };
