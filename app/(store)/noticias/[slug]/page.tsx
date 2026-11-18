import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AspectRatio } from '@astryxdesign/core/AspectRatio';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Markdown } from '@astryxdesign/core/Markdown';
import { Text } from '@astryxdesign/core/Text';
import { AppIcon } from '@/components/ui/AppIcon';
import { Page, PageHeader } from '@/components/ui/Page';
import { getNewsBySlug } from '@/lib/data';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = await getNewsBySlug((await params).slug);
  return n ? { title: n.title, description: n.summary } : { title: 'Notícia não encontrada' };
}

export default async function NewsDetailPage({ params }: Props) {
  const n = await getNewsBySlug((await params).slug);
  if (!n) notFound();

  return (
    <Page width={780}>
      <PageHeader
        title={n.title}
        description={`${formatDate(n.publishedAt)}${n.author ? ` · por ${n.author}` : ''}`}
        crumbs={[{ label: 'Notícias', href: '/noticias' }, { label: n.title }]}
      />
      {n.coverUrl && (
        <Card padding={0}>
          <AspectRatio ratio={16 / 9}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.coverUrl} alt="" className="media-cover" />
          </AspectRatio>
        </Card>
      )}
      <Text type="large" color="secondary">
        {n.summary}
      </Text>
      <Markdown contentWidth={780}>{n.body}</Markdown>
      {n.app && (
        <ClickableCard label={`Abrir ${n.app.name}`} href={`/apps/${n.app.slug}`} padding={4}>
          <HStack gap={3} vAlign="center">
            <AppIcon src={n.app.iconUrl} name={n.app.name} size={48} />
            <VStack gap={0.5}>
              <Text type="supporting">Aplicativo relacionado</Text>
              <Text type="label" weight="semibold">
                {n.app.name}
              </Text>
            </VStack>
          </HStack>
        </ClickableCard>
      )}
    </Page>
  );
}
