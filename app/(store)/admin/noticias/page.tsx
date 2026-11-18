import type { Metadata } from 'next';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Link } from '@astryxdesign/core/Link';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { Ico } from '@/components/ui/Ico';
import { Page, PageHeader } from '@/components/ui/Page';
import { formatDate } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Gerenciar notícias' };
export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const news = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
    include: { app: { select: { name: true } }, author: { select: { name: true } } },
  });

  return (
    <Page>
      <PageHeader
        title="Notícias"
        crumbs={[{ label: 'Administração', href: '/admin' }, { label: 'Notícias' }]}
        actions={<Button label="Nova notícia" variant="primary" href="/admin/noticias/novo" icon={<Ico name="plus" />} />}
      />
      {news.length === 0 ? (
        <EmptyState title="Nenhuma notícia" description="Publique comunicados, lançamentos e novidades." icon={<Ico name="news" size="lg" />} />
      ) : (
        <Card padding={0}>
          <Table dividers="rows" hasHover>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Título</TableHeaderCell>
                <TableHeaderCell>App</TableHeaderCell>
                <TableHeaderCell>Autor</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Data</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {news.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>
                    <Link href={`/admin/noticias/${n.id}`} weight="semibold" color="primary">
                      {n.title}
                    </Link>
                  </TableCell>
                  <TableCell>{n.app?.name ?? '—'}</TableCell>
                  <TableCell>{n.author?.name ?? '—'}</TableCell>
                  <TableCell>{n.published ? <Badge label="Publicada" variant="success" /> : <Badge label="Rascunho" variant="neutral" />}</TableCell>
                  <TableCell>{formatDate(n.publishedAt ?? n.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Page>
  );
}
