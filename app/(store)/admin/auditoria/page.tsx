import type { Metadata } from 'next';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/Layout';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { Page, PageHeader } from '@/components/ui/Page';
import { UrlPagination } from '@/components/ui/UrlControls';
import { requireMaster } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Auditoria' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

const ACTIONS: Record<string, string> = {
  login: 'Login',
  'login.failed': 'Falha de login',
  logout: 'Logout',
  register: 'Cadastro',
  'password.change': 'Troca de senha',
  'app.create': 'App criado',
  'app.update': 'App alterado',
  'app.delete': 'App excluído',
  'app.publish': 'App publicado',
  'app.unpublish': 'App despublicado',
  'version.create': 'Versão publicada',
  'version.delete': 'Versão excluída',
  'screenshot.add': 'Capturas adicionadas',
  'screenshot.delete': 'Captura removida',
  'category.create': 'Categoria criada',
  'category.delete': 'Categoria excluída',
  'news.create': 'Notícia criada',
  'news.update': 'Notícia alterada',
  'news.delete': 'Notícia excluída',
  'user.role': 'Papel alterado',
  'user.activate': 'Conta reativada',
  'user.deactivate': 'Conta desativada',
  'user.create': 'Usuário cadastrado',
  'user.reset_password': 'Senha redefinida',
  'install.remote': 'Instalação remota',
};

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  await requireMaster();
  const page = Math.max(1, Number((await searchParams).pagina) || 1);
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  return (
    <Page>
      <PageHeader
        title="Auditoria"
        description="Registro de todas as ações administrativas e de acesso."
        crumbs={[{ label: 'Administração', href: '/admin' }, { label: 'Auditoria' }]}
      />
      <Card padding={0}>
        <Table density="compact" dividers="rows" textOverflow="truncate">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Quando</TableHeaderCell>
              <TableHeaderCell>Usuário</TableHeaderCell>
              <TableHeaderCell>Ação</TableHeaderCell>
              <TableHeaderCell>Detalhes</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{formatDateTime(l.createdAt)}</TableCell>
                <TableCell>{l.user ? `${l.user.name} (${l.user.email})` : '—'}</TableCell>
                <TableCell>{ACTIONS[l.action] ?? l.action}</TableCell>
                <TableCell>
                  <Text type="code" size="xsm" maxLines={1}>
                    {l.details || '—'}
                  </Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <HStack hAlign="center">
        <UrlPagination page={page} totalItems={total} pageSize={PAGE_SIZE} />
      </HStack>
    </Page>
  );
}
