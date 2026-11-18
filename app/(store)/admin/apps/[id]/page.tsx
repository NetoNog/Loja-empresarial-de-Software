import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/Layout';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { deleteAppAction, deleteVersionAction } from '@/app/actions/apps';
import { ConfirmAction } from '@/components/admin/ActionButtons';
import { AppForm } from '@/components/admin/AppForm';
import { ScreenshotsManager } from '@/components/admin/ScreenshotsManager';
import { VersionForm } from '@/components/admin/VersionForm';
import { Ico } from '@/components/ui/Ico';
import { Page, PageHeader } from '@/components/ui/Page';
import { LinkTabs } from '@/components/ui/UrlControls';
import { PLATFORMS, formatBytes, formatDateTime, formatNumber } from '@/lib/format';
import { itomEnabled } from '@/lib/itom';
import { prisma } from '@/lib/prisma';
import { mediaUrl } from '@/lib/storage';

export const metadata: Metadata = { title: 'Editar aplicativo' };
export const dynamic = 'force-dynamic';

const ACCEPT = process.env.ALLOWED_PACKAGE_EXT ?? '.exe,.msi,.msix,.msixbundle,.appx,.zip,.7z,.rar,.apk,.dmg,.pkg,.deb,.rpm,.appimage,.jar,.pdf';

export default async function EditAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string; novo?: string }>;
}) {
  const [{ id }, { aba = 'detalhes', novo }] = await Promise.all([params, searchParams]);
  const [app, categories] = await Promise.all([
    prisma.app.findUnique({
      where: { id },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, include: { uploadedBy: { select: { name: true } } } },
        screenshots: { orderBy: { order: 'asc' } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);
  if (!app) notFound();

  const base = `/admin/apps/${app.id}`;

  return (
    <Page>
      <PageHeader
        title={app.name}
        description={app.published ? 'Publicado na loja' : 'Rascunho (não publicado)'}
        crumbs={[{ label: 'Administração', href: '/admin' }, { label: 'Aplicativos', href: '/admin/apps' }, { label: app.name }]}
        actions={
          <>
            <Button label="Ver na loja" href={`/apps/${app.slug}`} icon={<Ico name="eye" />} />
            <ConfirmAction
              action={deleteAppAction.bind(null, app.id)}
              label="Excluir"
              size="md"
              title={`Excluir ${app.name}?`}
              description="O aplicativo, todas as versões, arquivos e estatísticas serão removidos permanentemente."
            />
          </>
        }
      />

      {novo && (
        <Banner
          status="success"
          title="Aplicativo criado!"
          description="Agora envie o instalador da primeira versão. Depois, marque “Publicado” na aba Detalhes."
          collapsible={false}
        />
      )}

      <LinkTabs
        value={aba}
        tabs={[
          { value: 'detalhes', label: 'Detalhes', href: `${base}?aba=detalhes` },
          { value: 'versoes', label: `Versões (${app.versions.length})`, href: `${base}?aba=versoes` },
          { value: 'midia', label: `Capturas de tela (${app.screenshots.length})`, href: `${base}?aba=midia` },
        ]}
      />

      {aba === 'detalhes' && (
        <AppForm
          categories={categories}
          itomEnabled={itomEnabled}
          values={{
            id: app.id,
            name: app.name,
            slug: app.slug,
            publisher: app.publisher,
            shortDescription: app.shortDescription,
            description: app.description,
            categoryId: app.categoryId ?? '',
            website: app.website ?? '',
            tags: app.tags,
            itomPackageId: app.itomPackageId?.toString() ?? '',
            featured: app.featured,
            published: app.published,
            iconUrl: mediaUrl(app.iconPath),
            bannerUrl: mediaUrl(app.bannerPath),
          }}
        />
      )}

      {aba === 'versoes' && (
        <Grid columns={{ minWidth: 360 }} gap={6} align="start">
          <Card padding={6}>
            <VStack gap={4}>
              <Heading level={2}>Nova versão</Heading>
              <VersionForm appId={app.id} suggestedVersion={app.versions[0]?.version ?? ''} accept={ACCEPT} />
            </VStack>
          </Card>
          <VStack gap={3}>
            <Heading level={2}>Versões publicadas</Heading>
            {app.versions.length === 0 ? (
              <Text color="secondary">Nenhuma versão enviada ainda.</Text>
            ) : (
              <Card padding={0}>
                <Table density="compact" dividers="rows">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Versão</TableHeaderCell>
                      <TableHeaderCell>Plataforma</TableHeaderCell>
                      <TableHeaderCell>Arquivo</TableHeaderCell>
                      <TableHeaderCell>Downloads</TableHeaderCell>
                      <TableHeaderCell>Enviado</TableHeaderCell>
                      <TableHeaderCell> </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {app.versions.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>{v.version}</TableCell>
                        <TableCell>{PLATFORMS[v.platform] ?? v.platform}</TableCell>
                        <TableCell>
                          <VStack gap={0.5}>
                            <Text maxLines={1}>{v.fileName}</Text>
                            <Text type="supporting">{formatBytes(v.fileSize)}</Text>
                          </VStack>
                        </TableCell>
                        <TableCell>{formatNumber(v.downloads)}</TableCell>
                        <TableCell>
                          <VStack gap={0.5}>
                            <Text>{formatDateTime(v.createdAt)}</Text>
                            <Text type="supporting">{v.uploadedBy?.name ?? '—'}</Text>
                          </VStack>
                        </TableCell>
                        <TableCell>
                          <ConfirmAction
                            action={deleteVersionAction.bind(null, v.id)}
                            label="Excluir versão"
                            isIconOnly
                            title={`Excluir versão ${v.version}?`}
                            description="O arquivo será apagado do servidor e não poderá mais ser baixado."
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </VStack>
        </Grid>
      )}

      {aba === 'midia' && (
        <Card padding={6}>
          <ScreenshotsManager appId={app.id} shots={app.screenshots.map((s) => ({ id: s.id, url: mediaUrl(s.path)! }))} />
        </Card>
      )}
    </Page>
  );
}
