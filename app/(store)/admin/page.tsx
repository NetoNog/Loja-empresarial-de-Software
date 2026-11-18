import type { Metadata } from 'next';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Ico } from '@/components/ui/Ico';
import { Page, PageHeader } from '@/components/ui/Page';
import { prisma } from '@/lib/prisma';
import { formatDateTime, formatNumber } from '@/lib/format';

export const metadata: Metadata = { title: 'Painel administrativo' };
export const dynamic = 'force-dynamic';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card padding={5}>
      <VStack gap={1}>
        <Text type="supporting">{label}</Text>
        <Text type="display-3" hasTabularNumbers>
          {value}
        </Text>
        {hint && <Text type="supporting">{hint}</Text>}
      </VStack>
    </Card>
  );
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [apps, published, downloads30, totalDownloads, users, admins, recentDownloads, topApps, drafts] = await Promise.all([
    prisma.app.count(),
    prisma.app.count({ where: { published: true } }),
    prisma.download.count({ where: { createdAt: { gte: since } } }),
    prisma.app.aggregate({ _sum: { downloadCount: true } }),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count({ where: { role: { in: ['ADMIN', 'MASTER'] }, active: true } }),
    prisma.download.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { app: { select: { name: true, slug: true } }, version: { select: { version: true } }, user: { select: { name: true } } },
    }),
    prisma.app.findMany({ orderBy: { downloadCount: 'desc' }, take: 5, select: { id: true, name: true, downloadCount: true } }),
    prisma.app.findMany({ where: { OR: [{ published: false }, { versions: { none: {} } }] }, take: 5, select: { id: true, name: true, published: true, _count: { select: { versions: true } } } }),
  ]);

  return (
    <Page>
      <PageHeader
        title="Painel administrativo"
        description="Visão geral da loja"
        actions={
          <>
            <Button label="Nova notícia" href="/admin/noticias/novo" icon={<Ico name="news" />} />
            <Button label="Novo aplicativo" variant="primary" href="/admin/apps/novo" icon={<Ico name="plus" />} />
          </>
        }
      />
      {erro === 'sem-permissao' && <Banner status="warning" title="Apenas o Admin Master pode acessar essa área." isDismissable />}

      <Grid columns={{ minWidth: 200 }} gap={4}>
        <Stat label="Aplicativos" value={formatNumber(apps)} hint={`${published} publicados`} />
        <Stat label="Downloads (30 dias)" value={formatNumber(downloads30)} />
        <Stat label="Downloads (total)" value={formatNumber(totalDownloads._sum.downloadCount ?? 0)} />
        <Stat label="Usuários ativos" value={formatNumber(users)} hint={`${admins} administradores`} />
      </Grid>

      <Grid columns={{ minWidth: 340 }} gap={6} align="start">
        <VStack gap={3}>
          <Heading level={2}>Downloads recentes</Heading>
          <Card padding={0}>
            <Table density="compact" dividers="rows">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Aplicativo</TableHeaderCell>
                  <TableHeaderCell>Versão</TableHeaderCell>
                  <TableHeaderCell>Usuário</TableHeaderCell>
                  <TableHeaderCell>Quando</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDownloads.length === 0 ? (
                  <TableRow>
                    <TableCell>Nenhum download ainda.</TableCell>
                    <TableCell> </TableCell>
                    <TableCell> </TableCell>
                    <TableCell> </TableCell>
                  </TableRow>
                ) : (
                  recentDownloads.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link href={`/apps/${d.app.slug}`}>{d.app.name}</Link>
                      </TableCell>
                      <TableCell>{d.version.version}</TableCell>
                      <TableCell>{d.user?.name ?? 'Anônimo'}</TableCell>
                      <TableCell>{formatDateTime(d.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </VStack>

        <VStack gap={6}>
          <VStack gap={3}>
            <Heading level={2}>Mais baixados</Heading>
            <Card padding={4}>
              <VStack gap={2}>
                {topApps.map((a) => (
                  <HStack key={a.id} hAlign="between">
                    <Link href={`/admin/apps/${a.id}`}>{a.name}</Link>
                    <Text hasTabularNumbers>{formatNumber(a.downloadCount)}</Text>
                  </HStack>
                ))}
                {topApps.length === 0 && <Text color="secondary">Sem dados.</Text>}
              </VStack>
            </Card>
          </VStack>
          {drafts.length > 0 && (
            <VStack gap={3}>
              <Heading level={2}>Pendências</Heading>
              <Card padding={4}>
                <VStack gap={2}>
                  {drafts.map((a) => (
                    <HStack key={a.id} hAlign="between" gap={2}>
                      <Link href={`/admin/apps/${a.id}`}>{a.name}</Link>
                      <Text type="supporting">{a._count.versions === 0 ? 'Sem versão' : 'Não publicado'}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Card>
            </VStack>
          )}
        </VStack>
      </Grid>
    </Page>
  );
}
