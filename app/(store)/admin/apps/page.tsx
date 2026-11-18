import type { Metadata } from 'next';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { togglePublishAction } from '@/app/actions/apps';
import { ActionSwitch } from '@/components/admin/ActionButtons';
import { AppIcon } from '@/components/ui/AppIcon';
import { Ico } from '@/components/ui/Ico';
import { Page, PageHeader } from '@/components/ui/Page';
import { formatDate, formatNumber } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { mediaUrl } from '@/lib/storage';

export const metadata: Metadata = { title: 'Gerenciar aplicativos' };
export const dynamic = 'force-dynamic';

export default async function AdminAppsPage() {
  const apps = await prisma.app.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      category: { select: { name: true } },
      versions: { orderBy: { createdAt: 'desc' }, take: 1, select: { version: true } },
      _count: { select: { versions: true } },
    },
  });

  return (
    <Page>
      <PageHeader
        title="Aplicativos"
        description="Cadastre, versione e publique os aplicativos da loja."
        crumbs={[{ label: 'Administração', href: '/admin' }, { label: 'Aplicativos' }]}
        actions={<Button label="Novo aplicativo" variant="primary" href="/admin/apps/novo" icon={<Ico name="plus" />} />}
      />
      {apps.length === 0 ? (
        <EmptyState
          title="Nenhum aplicativo cadastrado"
          description="Cadastre o primeiro aplicativo e envie o instalador."
          icon={<Ico name="cube" size="lg" />}
          actions={<Button label="Novo aplicativo" variant="primary" href="/admin/apps/novo" />}
        />
      ) : (
        <Card padding={0}>
          <Table dividers="rows" hasHover>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Aplicativo</TableHeaderCell>
                <TableHeaderCell>Categoria</TableHeaderCell>
                <TableHeaderCell>Versão</TableHeaderCell>
                <TableHeaderCell>Downloads</TableHeaderCell>
                <TableHeaderCell>Atualizado</TableHeaderCell>
                <TableHeaderCell>Publicado</TableHeaderCell>
                <TableHeaderCell> </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <HStack gap={3} vAlign="center">
                      <AppIcon src={mediaUrl(a.iconPath)} name={a.name} size={36} />
                      <VStack gap={0.5}>
                        <Link href={`/admin/apps/${a.id}`} weight="semibold" color="primary">
                          {a.name}
                        </Link>
                        <HStack gap={1}>
                          {a.featured && <Badge label="Destaque" variant="purple" />}
                          {a._count.versions === 0 && <Badge label="Sem versão" variant="warning" />}
                        </HStack>
                      </VStack>
                    </HStack>
                  </TableCell>
                  <TableCell>{a.category?.name ?? '—'}</TableCell>
                  <TableCell>{a.versions[0]?.version ?? '—'}</TableCell>
                  <TableCell>
                    <Text hasTabularNumbers>{formatNumber(a.downloadCount)}</Text>
                  </TableCell>
                  <TableCell>{formatDate(a.updatedAt)}</TableCell>
                  <TableCell>
                    <ActionSwitch label={`Publicar ${a.name}`} value={a.published} action={togglePublishAction.bind(null, a.id)} />
                  </TableCell>
                  <TableCell>
                    <HStack gap={1}>
                      <Button label="Editar" size="sm" variant="ghost" isIconOnly tooltip="Editar" href={`/admin/apps/${a.id}`} icon={<Ico name="edit" />} />
                      <Button label="Ver na loja" size="sm" variant="ghost" isIconOnly tooltip="Ver na loja" href={`/apps/${a.slug}`} icon={<Ico name="eye" />} />
                    </HStack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Page>
  );
}
