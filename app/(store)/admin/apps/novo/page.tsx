import type { Metadata } from 'next';
import { AppForm } from '@/components/admin/AppForm';
import { Page, PageHeader } from '@/components/ui/Page';
import { itomEnabled } from '@/lib/itom';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Novo aplicativo' };

export default async function NewAppPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } });
  return (
    <Page>
      <PageHeader
        title="Novo aplicativo"
        description="Depois de criar, você será levado ao envio do instalador (versão)."
        crumbs={[{ label: 'Administração', href: '/admin' }, { label: 'Aplicativos', href: '/admin/apps' }, { label: 'Novo' }]}
      />
      <AppForm
        categories={categories}
        itomEnabled={itomEnabled}
        values={{
          name: '',
          slug: '',
          publisher: 'Equipe de Desenvolvimento de Soluções',
          shortDescription: '',
          description: '',
          categoryId: '',
          website: '',
          tags: '',
          itomPackageId: '',
          featured: false,
          published: false,
          iconUrl: null,
          bannerUrl: null,
        }}
      />
    </Page>
  );
}
