import type { Metadata } from 'next';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { AppCard } from '@/components/ui/AppCard';
import { Ico } from '@/components/ui/Ico';
import { Page, PageHeader } from '@/components/ui/Page';
import { LinkTabs, UrlPagination, UrlSelect } from '@/components/ui/UrlControls';
import { searchApps } from '@/lib/data';

export const metadata: Metadata = { title: 'Aplicativos' };
export const dynamic = 'force-dynamic';

type Search = { q?: string; categoria?: string; ordem?: string; pagina?: string };

function hrefWith(sp: Search, patch: Partial<Search>) {
  const p = new URLSearchParams();
  const merged = { ...sp, ...patch, pagina: undefined };
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
  const qs = p.toString();
  return qs ? `/apps?${qs}` : '/apps';
}

export default async function AppsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { apps, total, page, pageSize, categories } = await searchApps({
    q: sp.q,
    category: sp.categoria,
    sort: sp.ordem,
    page: Number(sp.pagina) || 1,
  });

  return (
    <Page>
      <PageHeader
        title={sp.q ? `Resultados para “${sp.q}”` : 'Aplicativos'}
        description={`${total} ${total === 1 ? 'aplicativo encontrado' : 'aplicativos encontrados'}`}
        actions={
          <UrlSelect
            param="ordem"
            label="Ordenar por"
            value={sp.ordem ?? ''}
            options={[
              { value: '', label: 'Atualizados recentemente' },
              { value: 'populares', label: 'Mais baixados' },
              { value: 'nome', label: 'Nome (A–Z)' },
            ]}
          />
        }
      />

      <LinkTabs
        value={sp.categoria ?? ''}
        tabs={[
          { value: '', label: 'Todos', href: hrefWith(sp, { categoria: undefined }) },
          ...categories.map((c) => ({ value: c.slug, label: c.name, href: hrefWith(sp, { categoria: c.slug }) })),
        ]}
      />

      {apps.length === 0 ? (
        <EmptyState
          title="Nenhum aplicativo encontrado"
          description="Tente outro termo de busca ou remova os filtros."
          icon={<Ico name="search" size="lg" />}
        />
      ) : (
        <VStack gap={6}>
          <Grid columns={{ minWidth: 260 }} gap={4}>
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </Grid>
          <HStack hAlign="center">
            <UrlPagination page={page} totalItems={total} pageSize={pageSize} />
          </HStack>
        </VStack>
      )}
    </Page>
  );
}
