import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import type { AppCardData } from '@/lib/data';
import { formatNumber } from '@/lib/format';
import { AppIcon } from './AppIcon';

/** Bloco de app no estilo vitrine: ícone, nome, categoria e resumo. */
export function AppCard({ app }: { app: AppCardData }) {
  return (
    <ClickableCard label={`Abrir ${app.name}`} href={`/apps/${app.slug}`} padding={4} height="100%">
      <VStack gap={3}>
        <HStack gap={3} vAlign="center">
          <AppIcon src={app.iconUrl} name={app.name} size={56} />
          <VStack gap={0.5}>
            <Text type="label" weight="semibold" maxLines={1}>
              {app.name}
            </Text>
            <Text type="supporting" maxLines={1}>
              {app.category ?? app.publisher}
            </Text>
          </VStack>
        </HStack>
        <Text type="body" color="secondary" maxLines={2}>
          {app.shortDescription}
        </Text>
        <HStack gap={2} hAlign="between" vAlign="center">
          <Text type="supporting">{app.latestVersion ? `v${app.latestVersion}` : ''}</Text>
          <Text type="supporting" hasTabularNumbers>
            {formatNumber(app.downloadCount)} downloads
          </Text>
        </HStack>
      </VStack>
    </ClickableCard>
  );
}

/** Linha compacta (rankings, listas laterais). */
export function AppRow({ app, rank }: { app: AppCardData; rank?: number }) {
  return (
    <ClickableCard label={`Abrir ${app.name}`} href={`/apps/${app.slug}`} padding={2} variant="transparent">
      <HStack gap={3} vAlign="center">
        {rank !== undefined && (
          <Text type="large" weight="bold" color="secondary" hasTabularNumbers>
            {rank}
          </Text>
        )}
        <AppIcon src={app.iconUrl} name={app.name} size={44} />
        <VStack gap={0.5}>
          <Text type="label" maxLines={1}>
            {app.name}
          </Text>
          <Text type="supporting" maxLines={1}>
            {app.category ?? app.publisher}
          </Text>
        </VStack>
      </HStack>
    </ClickableCard>
  );
}
