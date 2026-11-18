import 'server-only';
import { prisma } from '@/lib/prisma';

export async function audit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown> | string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        details: typeof details === 'string' ? details : details ? JSON.stringify(details) : '',
      },
    });
  } catch (err) {
    // Auditoria nunca deve derrubar a operação principal.
    console.error('[audit] falha ao registrar', err);
  }
}
