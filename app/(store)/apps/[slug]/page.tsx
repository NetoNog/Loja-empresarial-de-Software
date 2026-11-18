import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AspectRatio } from '@astryxdesign/core/AspectRatio';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { Carousel } from '@astryxdesign/core/Carousel';
import { Collapsible, CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { Markdown } from '@astryxdesign/core/Markdown';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { DownloadPanel } from '@/components/store/DownloadPanel';
import { AppIcon } from '@/components/ui/AppIcon';
import { Page } from '@/components/ui/Page';
import { getCurrentUser } from '@/lib/auth/session';
import { getAppBySlug } from '@/lib/data';
import { PLATFORMS, formatBytes, formatDate, formatNumber } from '@/lib/format';
import { itomEnabled } from '@/lib/itom';
import { isAdminRole } from '@/lib/roles';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const app = await getAppBySlug((await params).slug);
  return app ? { title: app.name, description: app.shortDescription } : { title: 'Aplicativo não encontrado' };
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const isAdmin = isAdminRole(user?.role);
  const app = await getAppBySlug(slug, { includeUnpublished: isAdmin });
  if (!app) notFound();

  const newest = app.versions[0];

  return (
    <Page>
      {!app.published && (
        <Banner
          status="warning"
          title="Pré-visualização: este aplicativo não está publicado"
          endContent={<Link href={`/admin/apps/${app.id}`}>Editar</Link>}
          collapsible={false}
        />
      )}

      {/* Cabeçalho + painel de download (fixo à direita em telas largas) */}
      <Grid columns={{ minWidth: 320 }} gap={6} align="start">
        <HStack gap={5} vAlign="start" wrap="wrap">
          <AppIcon src={app.iconUrl} name={app.name} size={112} />
          <VStack gap={2}>
            <Heading level={1} type="display-2">
              {app.name}
            </Heading>
            <Text color="secondary">{app.publisher}</Text>
            <HStack gap={2} wrap="wrap" vAlign="center">
              {app.category && <Token label={app.category.name} href={`/apps?categoria=${app.category.slug}`} size="sm" />}
              {newest && <Badge label={`v${newest.version}`} variant="info" />}
              <Text type="supporting" hasTabularNumbers>
                {formatNumber(app.downloadCount)} downloads
              </Text>
            </HStack>
            <Text type="large" color="secondary">
              {app.shortDescription}
            </Text>
          </VStack>
        </HStack>

        <Card padding={5} elevation="low">
          <DownloadPanel
            appId={app.id}
            latest={app.latest.map((l) => ({ id: l.id, version: l.version, platform: l.platform, fileSize: l.fileSize, fileName: l.fileName }))}
            remoteInstall={itomEnabled && !!app.itomPackageId}
            isLoggedIn={!!user}
          />
        </Card>
      </Grid>

      {app.screenshots.length > 0 && (
        <VStack gap={3}>
          <Heading level={2}>Capturas de tela</Heading>
          <Carousel aria-label="Capturas de tela" hasButtons hasEdgeFade gap={3}>
            {app.screenshots.map((s) => (
              <VStack key={s.id} width="min(560px, 80vw)">
                <Card padding={0}>
                  <AspectRatio ratio={16 / 10}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt={s.caption || `Captura de tela de ${app.name}`} className="media-cover" loading="lazy" />
                  </AspectRatio>
                </Card>
              </VStack>
            ))}
          </Carousel>
        </VStack>
      )}

      <Grid columns={{ minWidth: 320 }} gap={8} align="start">
        <VStack gap={6}>
          {newest?.changelog && (
            <VStack gap={2}>
              <Heading level={2}>Novidades da versão {newest.version}</Heading>
              <Text type="supporting">Publicada em {formatDate(newest.createdAt)}</Text>
              <Markdown density="compact">{newest.changelog}</Markdown>
            </VStack>
          )}
          <VStack gap={2}>
            <Heading level={2}>Descrição</Heading>
            <Markdown>{app.description}</Markdown>
          </VStack>

          {app.versions.length > 0 && (
            <CollapsibleGroup type="multiple">
              <Divider />
              <Collapsible value="historico" defaultIsOpen={false} trigger={<Heading level={3}>Histórico de versões ({app.versions.length})</Heading>}>
                <Table density="compact" dividers="rows">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Versão</TableHeaderCell>
                      <TableHeaderCell>Plataforma</TableHeaderCell>
                      <TableHeaderCell>Data</TableHeaderCell>
                      <TableHeaderCell>Tamanho</TableHeaderCell>
                      <TableHeaderCell>Arquivo</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {app.versions.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>{v.version}</TableCell>
                        <TableCell>{PLATFORMS[v.platform] ?? v.platform}</TableCell>
                        <TableCell>{formatDate(v.createdAt)}</TableCell>
                        <TableCell>{formatBytes(v.fileSize)}</TableCell>
                        <TableCell>
                          <Link href={`/api/download/${v.id}`}>Baixar</Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Collapsible>
              <Divider />
            </CollapsibleGroup>
          )}
        </VStack>

        <VStack gap={6}>
          <Card padding={5}>
            <MetadataList title={<Heading level={3}>Informações</Heading>}>
              <MetadataListItem label="Publicador">{app.publisher}</MetadataListItem>
              <MetadataListItem label="Versão atual">{newest?.version ?? '—'}</MetadataListItem>
              <MetadataListItem label="Atualizado em">{formatDate(newest?.createdAt ?? app.updatedAt)}</MetadataListItem>
              <MetadataListItem label="Lançado em">{formatDate(app.createdAt)}</MetadataListItem>
              <MetadataListItem label="Tamanho">{newest ? formatBytes(newest.fileSize) : '—'}</MetadataListItem>
              <MetadataListItem label="Plataformas">
                {app.latest.map((l) => PLATFORMS[l.platform] ?? l.platform).join(', ') || '—'}
              </MetadataListItem>
              {newest && (
                <MetadataListItem label="SHA-256">
                  <Text type="code" size="xsm" wordBreak="break-all">
                    {newest.sha256}
                  </Text>
                </MetadataListItem>
              )}
              {app.website && (
                <MetadataListItem label="Site / documentação">
                  <Link href={app.website} isExternalLink>
                    Abrir
                  </Link>
                </MetadataListItem>
              )}
            </MetadataList>
          </Card>

          {app.tags.length > 0 && (
            <HStack gap={2} wrap="wrap">
              {app.tags.map((t) => (
                <Token key={t} label={t} size="sm" href={`/apps?q=${encodeURIComponent(t)}`} />
              ))}
            </HStack>
          )}

          {app.news.length > 0 && (
            <VStack gap={2}>
              <Heading level={3}>Notícias relacionadas</Heading>
              {app.news.map((n) => (
                <Link key={n.slug} href={`/noticias/${n.slug}`}>
                  {n.title}
                </Link>
              ))}
            </VStack>
          )}
        </VStack>
      </Grid>
    </Page>
  );
}
