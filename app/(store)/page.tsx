import { AspectRatio } from '@astryxdesign/core/AspectRatio';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Carousel } from '@astryxdesign/core/Carousel';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { AppCard, AppRow } from '@/components/ui/AppCard';
import { AppIcon } from '@/components/ui/AppIcon';
import { Ico } from '@/components/ui/Ico';
import { Page, SectionHeader } from '@/components/ui/Page';
import { getHomeData, type AppCardData } from '@/lib/data';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

function Hero({ app }: { app: AppCardData }) {
  return (
    <Card padding={0} variant="muted">
      <Grid columns={{ minWidth: 300 }} gap={0} align="center">
        <VStack gap={4} padding={8}>
          <HStack gap={3} vAlign="center">
            <AppIcon src={app.iconUrl} name={app.name} size={72} />
            <VStack gap={1}>
              <Text type="supporting">Em destaque</Text>
              <Heading level={2} type="display-3">
                {app.name}
              </Heading>
            </VStack>
          </HStack>
          <Text type="large" color="secondary" maxLines={3}>
            {app.shortDescription}
          </Text>
          <HStack gap={2}>
            <Button label="Ver detalhes" variant="primary" size="lg" href={`/apps/${app.slug}`} icon={<Ico name="download" />} />
          </HStack>
        </VStack>
        <AspectRatio ratio={16 / 9}>
          {app.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.bannerUrl} alt="" className="media-cover" />
          ) : (
            <Card variant="blue" padding={0} width="100%" height="100%">
              <VStack height="100%" hAlign="center" vAlign="center">
                <AppIcon src={app.iconUrl} name={app.name} size={128} />
              </VStack>
            </Card>
          )}
        </AspectRatio>
      </Grid>
    </Card>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const [{ featured, recent, popular, news, categories }, { erro }] = await Promise.all([getHomeData(), searchParams]);
  const isEmpty = recent.length === 0;

  return (
    <Page>
      {erro === 'sem-permissao' && (
        <Banner status="warning" title="Você não tem permissão para acessar essa área." isDismissable />
      )}

      {isEmpty ? (
        <EmptyState
          title="Nenhum aplicativo publicado ainda"
          description="Assim que a equipe publicar aplicativos, eles aparecerão aqui."
          icon={<Ico name="cube" size="lg" />}
        />
      ) : (
        <>
          {featured.length > 0 && (
            <Carousel aria-label="Aplicativos em destaque" hasButtons hasSnap gap={4}>
              {featured.map((app) => (
                <VStack key={app.id} width="min(1100px, 85vw)">
                  <Hero app={app} />
                </VStack>
              ))}
            </Carousel>
          )}

          {categories.length > 0 && (
            <HStack gap={2} wrap="wrap">
              {categories.map((c) => (
                <Token key={c.slug} label={`${c.name} (${c.count})`} href={`/apps?categoria=${c.slug}`} />
              ))}
            </HStack>
          )}

          <VStack gap={4}>
            <SectionHeader title="Novidades na loja" href="/apps" />
            <Grid columns={{ minWidth: 260 }} gap={4}>
              {recent.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </Grid>
          </VStack>

          <Grid columns={{ minWidth: 340 }} gap={6} align="start">
            <VStack gap={4}>
              <SectionHeader title="Mais baixados" href="/apps?ordem=populares" />
              <Card padding={2}>
                <VStack gap={0.5}>
                  {popular.map((app, i) => (
                    <AppRow key={app.id} app={app} rank={i + 1} />
                  ))}
                </VStack>
              </Card>
            </VStack>

            <VStack gap={4}>
              <SectionHeader title="Notícias" href="/noticias" />
              {news.length === 0 ? (
                <Card>
                  <Text color="secondary">Nenhuma notícia publicada.</Text>
                </Card>
              ) : (
                <VStack gap={3}>
                  {news.map((n) => (
                    <ClickableCard key={n.id} label={n.title} href={`/noticias/${n.slug}`} padding={4}>
                      <VStack gap={1}>
                        <Text type="supporting">{formatDate(n.publishedAt)}</Text>
                        <Text type="label" weight="semibold" maxLines={2}>
                          {n.title}
                        </Text>
                        <Text color="secondary" maxLines={2}>
                          {n.summary}
                        </Text>
                      </VStack>
                    </ClickableCard>
                  ))}
                </VStack>
              )}
            </VStack>
          </Grid>
        </>
      )}
    </Page>
  );
}
