import type { Metadata } from 'next';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { Markdown } from '@astryxdesign/core/Markdown';
import { Text } from '@astryxdesign/core/Text';
import { AppIcon } from '@/components/ui/AppIcon';
import { Ico } from '@/components/ui/Ico';
import { Page, PageHeader } from '@/components/ui/Page';
import { getRecentUpdates } from '@/lib/data';
import { PLATFORMS, formatBytes, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Atualizações' };
export const dynamic = 'force-dynamic';

export default async function UpdatesPage() {
  const updates = await getRecentUpdates(40);

  return (
    <Page width={900}>
      <PageHeader
        title="Atualizações"
        description="Últimas versões publicadas pela equipe, com as notas de cada lançamento."
      />
      {updates.length === 0 ? (
        <EmptyState title="Nenhuma atualização ainda" icon={<Ico name="updates" size="lg" />} />
      ) : (
        <VStack gap={4}>
          {updates.map((u) => (
            <Card key={u.id} padding={5}>
              <VStack gap={3}>
                <HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
                  <HStack gap={3} vAlign="center">
                    <AppIcon src={u.app.iconUrl} name={u.app.name} size={48} />
                    <VStack gap={0.5}>
                      <Link href={`/apps/${u.app.slug}`} type="label" weight="semibold" color="primary">
                        {u.app.name}
                      </Link>
                      <Text type="supporting">
                        {formatDate(u.createdAt)} · {PLATFORMS[u.platform] ?? u.platform} · {formatBytes(u.fileSize)}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack gap={2} vAlign="center">
                    <Badge label={`v${u.version}`} variant="info" />
                    <Link href={`/api/download/${u.id}`}>Baixar</Link>
                  </HStack>
                </HStack>
                {u.changelog ? (
                  <Markdown density="compact">{u.changelog}</Markdown>
                ) : (
                  <Text color="secondary">Sem notas de versão.</Text>
                )}
              </VStack>
            </Card>
          ))}
        </VStack>
      )}
    </Page>
  );
}
