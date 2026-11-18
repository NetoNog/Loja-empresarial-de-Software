import type { ReactNode } from 'react';
import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs';
import { HStack, Layout, LayoutContent, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Link } from '@astryxdesign/core/Link';

/** Moldura padrão de página dentro do AppShell. */
export function Page({ children, width = 1200 }: { children: ReactNode; width?: number }) {
  return (
    <Layout
      height="fill"
      contentWidth={width}
      content={
        <LayoutContent padding={6}>
          <VStack gap={8}>{children}</VStack>
        </LayoutContent>
      }
    />
  );
}

export function PageHeader({
  title,
  description,
  actions,
  crumbs,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  crumbs?: { label: string; href?: string }[];
}) {
  return (
    <VStack gap={3}>
      {crumbs && crumbs.length > 0 && (
        <Breadcrumbs label="Navegação estrutural">
          {crumbs.map((c) => (
            <BreadcrumbItem key={c.label} href={c.href}>
              {c.label}
            </BreadcrumbItem>
          ))}
        </Breadcrumbs>
      )}
      <HStack gap={4} hAlign="between" vAlign="center" wrap="wrap">
        <VStack gap={1}>
          <Heading level={1}>{title}</Heading>
          {description && <Text color="secondary">{description}</Text>}
        </VStack>
        {actions && (
          <HStack gap={2} wrap="wrap">
            {actions}
          </HStack>
        )}
      </HStack>
    </VStack>
  );
}

export function SectionHeader({ title, href, linkLabel = 'Ver tudo' }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <HStack gap={2} hAlign="between" vAlign="center">
      <Heading level={2}>{title}</Heading>
      {href && (
        <Link href={href} type="label">
          {linkLabel}
        </Link>
      )}
    </HStack>
  );
}
