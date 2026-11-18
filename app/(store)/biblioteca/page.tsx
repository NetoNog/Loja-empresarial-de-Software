import type { Metadata } from 'next';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { AppIcon } from '@/components/ui/AppIcon';
import { Ico } from '@/components/ui/Ico';
import { Page, PageHeader } from '@/components/ui/Page';
import { requireUser } from '@/lib/auth/session';
import { getUserLibrary } from '@/lib/data';
import { PLATFORMS, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Biblioteca' };
export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const user = await requireUser('/biblioteca');
  const items = await getUserLibrary(user.id);
  const updates = items.filter((i) => i.hasUpdate && i.app.published);

  return (
    <Page width={960}>
      <PageHeader title="Biblioteca" description="Aplicativos que você já baixou e atualizações disponíveis." />

      {updates.length > 0 && (
        <Banner
          status="info"
          title={`${updates.length} ${updates.length === 1 ? 'atualização disponível' : 'atualizações disponíveis'}`}
          description="Baixe a nova versão para manter seus aplicativos em dia."
          collapsible={false}
        />
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Sua biblioteca está vazia"
          description="Os aplicativos que você baixar aparecerão aqui, com aviso quando houver nova versão."
          icon={<Ico name="library" size="lg" />}
          actions={<Button label="Explorar aplicativos" variant="primary" href="/apps" />}
        />
      ) : (
        <Card padding={2}>
          <VStack gap={0}>
            {items.map((i) => (
              <HStack key={i.key} gap={3} vAlign="center" hAlign="between" padding={3} wrap="wrap">
                <HStack gap={3} vAlign="center">
                  <AppIcon src={i.app.iconUrl} name={i.app.name} size={44} />
                  <VStack gap={0.5}>
                    {i.app.published ? (
                      <Link href={`/apps/${i.app.slug}`} type="label" weight="semibold" color="primary">
                        {i.app.name}
                      </Link>
                    ) : (
                      <Text type="label" weight="semibold">
                        {i.app.name}
                      </Text>
                    )}
                    <Text type="supporting">
                      v{i.installedVersion} · {PLATFORMS[i.platform] ?? i.platform} · baixado em {formatDate(i.downloadedAt)}
                    </Text>
                  </VStack>
                </HStack>
                {!i.app.published ? (
                  <Badge label="Indisponível" variant="neutral" />
                ) : i.hasUpdate ? (
                  <Button label={`Atualizar para v${i.latestVersion}`} variant="primary" size="sm" href={`/apps/${i.app.slug}`} />
                ) : (
                  <Badge label="Atualizado" variant="success" />
                )}
              </HStack>
            ))}
          </VStack>
        </Card>
      )}
    </Page>
  );
}
