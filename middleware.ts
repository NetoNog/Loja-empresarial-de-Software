import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/token';

// Rotas acessíveis sem login. Todo o resto exige autenticação.
const PUBLIC_PATHS = ['/login', '/registro', '/api/health'];

// Primeira barreira (rápida). A autorização real é revalidada no servidor
// em cada página/ação via requireUser/requireAdmin/requireMaster (consulta o banco).
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/admin') && session.role !== 'ADMIN' && session.role !== 'MASTER') {
    return NextResponse.redirect(new URL('/?erro=sem-permissao', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Ignora assets do Next e arquivos estáticos da pasta public.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)'],
};
