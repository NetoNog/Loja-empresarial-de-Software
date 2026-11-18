import 'server-only';

// Limitador em memória (janela fixa). Suficiente para uma instância única;
// com várias instâncias, troque por Redis.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterS: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfterS: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterS: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterS: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
