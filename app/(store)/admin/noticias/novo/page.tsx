import type { Metadata } from 'next';
import { NewsForm } from '@/components/admin/NewsForm';
import { Page, PageHeader } from '@/components/ui/Page';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Nova notícia' };

export default async function NewNewsPage() {
  const apps = await prisma.app.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } });
  return (
    <Page>
      <PageHeader
        title="Nova notícia"
        crumbs={[{ label: 'Administração', href: '/admin' }, { label: 'Notícias', href: '/admin/noticias' }, { label: 'Nova' }]}
      />
      <NewsForm apps={apps} values={{ title: '', slug: '', summary: '', body: '', appId: '', published: true, hasCover: false }} />
    </Page>
  );
}
