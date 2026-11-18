import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { audit } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth/session';
import { getHostsByIp, itomEnabled, postSoftwareJob } from '@/lib/itom';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { clientIpFrom, isSameOrigin } from '@/lib/request';

export const runtime = 'nodejs';

/** GET: máquinas gerenciadas do IP do solicitante. */
export async function GET(req: NextRequest) {
  if (!itomEnabled) return NextResponse.json({ enabled: false, hosts: [] });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Faça login para instalar remotamente' }, { status: 401 });
  const ip = clientIpFrom(req.headers);
  if (!ip) return NextResponse.json({ enabled: true, hosts: [] });
  try {
    const hosts = await getHostsByIp(ip);
    return NextResponse.json({ enabled: true, hosts: hosts.map((h) => ({ systemId: h.SystemID, hostName: h.HostName })) });
  } catch (err) {
    console.error('[install] falha ao consultar ITOM', err);
    return NextResponse.json({ error: 'Não foi possível consultar o inventário' }, { status: 502 });
  }
}

/** POST: dispara instalação remota do pacote ITAM vinculado ao app na máquina escolhida. */
export async function POST(req: NextRequest) {
  if (!itomEnabled) return NextResponse.json({ error: 'Instalação remota desabilitada' }, { status: 404 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Origem inválida' }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Faça login para instalar remotamente' }, { status: 401 });
  if (!rateLimit(`install:${user.id}`, 10, 10 * 60 * 1000).ok) {
    return NextResponse.json({ error: 'Muitas solicitações. Aguarde alguns minutos.' }, { status: 429 });
  }

  const body = z.object({ appId: z.string().min(1), systemId: z.number().int().positive() }).safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });

  const app = await prisma.app.findUnique({ where: { id: body.data.appId } });
  if (!app?.published || !app.itomPackageId) return NextResponse.json({ error: 'App sem pacote de instalação remota' }, { status: 404 });

  // A máquina precisa pertencer ao IP do solicitante (impede instalar em máquina alheia).
  const ip = clientIpFrom(req.headers);
  const hosts = ip ? await getHostsByIp(ip).catch(() => []) : [];
  if (!hosts.some((h) => Number(h.SystemID) === body.data.systemId)) {
    return NextResponse.json({ error: 'Máquina não associada ao seu endereço de rede' }, { status: 403 });
  }

  try {
    await postSoftwareJob(app.itomPackageId, body.data.systemId);
    await audit(user.id, 'install.remote', 'app', app.id, { systemId: body.data.systemId, ip });
    return NextResponse.json({ message: 'Instalação solicitada. O software será instalado em breve na sua máquina.' });
  } catch (err) {
    console.error('[install] falha ao postar job', err);
    return NextResponse.json({ error: 'O serviço de instalação não respondeu. Tente novamente mais tarde.' }, { status: 502 });
  }
}
