export function formatBytes(bytes: number | bigint): string {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** i).toLocaleString('pt-BR', { maximumFractionDigits: i ? 1 : 0 })} ${units[i]}`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Compara versões tipo 1.2.10 > 1.2.9. Retorna >0 se a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(/[.\-+]/).map((p) => (/^\d+$/.test(p) ? Number(p) : p));
  const pb = b.split(/[.\-+]/).map((p) => (/^\d+$/.test(p) ? Number(p) : p));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x === y) continue;
    if (typeof x === 'number' && typeof y === 'number') return x - y;
    return String(x).localeCompare(String(y));
  }
  return 0;
}

export const PLATFORMS: Record<string, string> = {
  'windows-x64': 'Windows (64 bits)',
  'windows-x86': 'Windows (32 bits)',
  'windows-arm64': 'Windows (ARM64)',
  linux: 'Linux',
  macos: 'macOS',
  android: 'Android',
  web: 'Web / Multiplataforma',
};
