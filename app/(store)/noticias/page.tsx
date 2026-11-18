import type { Metadata } from 'next';
import { AspectRatio } from '@astryxdesign/core/AspectRatio';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { Ico } from '@/components/ui/Ico';
import { Page, PageHeader } from '@/components/ui/Page';
import { getNewsList } from '@/lib/data';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Notícias' };
export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const news = await getNewsList(60);

  return (
    <Page>
      <PageHeader title="Notícias" description="Lançamentos, comunicados e novidades da equipe de Desenvolvimento de Soluções." />
      {news.length === 0 ? (
        <EmptyState title="Nenhuma notícia publicada" icon={<Ico name="news" size="lg" />} />
      ) : (
        <Grid columns={{ minWidth: 300 }} gap={5}>
          {news.map((n) => (
            <ClickableCard key={n.id} label={n.title} href={`/noticias/${n.slug}`} padding={0} height="100%">
              <VStack gap={0}>
                {n.coverUrl && (
                  <AspectRatio ratio={16 / 9}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.coverUrl} alt="" className="media-cover" loading="lazy" />
                  </AspectRatio>
                )}
                <VStack gap={2} padding={4}>
                  <Text type="supporting">
                    {formatDate(n.publishedAt)}
                    {n.app ? ` · ${n.app.name}` : ''}
                  </Text>
                  <Text type="large" weight="semibold" maxLines={2}>
                    {n.title}
                  </Text>
                  <Text color="secondary" maxLines={3}>
                    {n.summary}
                  </Text>
                </VStack>
              </VStack>
            </ClickableCard>
          ))}
        </Grid>
      )}
    </Page>
  );
}
