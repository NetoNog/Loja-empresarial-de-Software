import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Button } from '@astryxdesign/core/Button';
import { deleteNewsAction } from '@/app/actions/news';
import { ConfirmAction } from '@/components/admin/ActionButtons';
import { NewsForm } from '@/components/admin/NewsForm';
import { Ico } from '@/components/ui/Ico';
import { Page, PageHeader } from '@/components/ui/Page';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Editar notícia' };
export const dynamic = 'force-dynamic';

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [n, apps] = await Promise.all([
    prisma.news.findUnique({ where: { id } }),
    prisma.app.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);
  if (!n) notFound();

  return (
    <Page>
      <PageHeader
        title={n.title}
        crumbs={[{ label: 'Administração', href: '/admin' }, { label: 'Notícias', href: '/admin/noticias' }, { label: 'Editar' }]}
        actions={
          <>
            {n.published && <Button label="Ver publicada" href={`/noticias/${n.slug}`} icon={<Ico name="eye" />} />}
            <ConfirmAction
              action={deleteNewsAction.bind(null, n.id)}
              label="Excluir"
              size="md"
              title="Excluir notícia?"
              description="Esta ação não pode ser desfeita."
            />
          </>
        }
      />
      <NewsForm
        apps={apps}
        values={{
          id: n.id,
          title: n.title,
          slug: n.slug,
          summary: n.summary,
          body: n.body,
          appId: n.appId ?? '',
          published: n.published,
          hasCover: !!n.coverPath,
        }}
      />
    </Page>
  );
}
