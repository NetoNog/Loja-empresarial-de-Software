import type { Metadata } from 'next';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/Layout';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { createCategoryAction, deleteCategoryAction } from '@/app/actions/apps';
import { ConfirmAction } from '@/components/admin/ActionButtons';
import { ActionForm, SubmitButton, TextField } from '@/components/forms/ActionForm';
import { Page, PageHeader } from '@/components/ui/Page';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Categorias' };
export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { apps: true } } } });

  return (
    <Page width={960}>
      <PageHeader title="Categorias" crumbs={[{ label: 'Administração', href: '/admin' }, { label: 'Categorias' }]} />
      <Grid columns={{ minWidth: 300 }} gap={6} align="start">
        <Card padding={0}>
          <Table density="compact" dividers="rows">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Aplicativos</TableHeaderCell>
                <TableHeaderCell> </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c._count.apps}</TableCell>
                  <TableCell>
                    <ConfirmAction
                      action={deleteCategoryAction.bind(null, c.id)}
                      label="Excluir categoria"
                      isIconOnly
                      title={`Excluir “${c.name}”?`}
                      description={`${c._count.apps} aplicativo(s) ficarão sem categoria.`}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell>
                    <Text color="secondary">Nenhuma categoria.</Text>
                  </TableCell>
                  <TableCell> </TableCell>
                  <TableCell> </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={2}>Nova categoria</Heading>
            <ActionForm action={createCategoryAction} resetOnSuccess>
              <TextField name="name" label="Nome" placeholder="Ex.: Produtividade" />
              <SubmitButton label="Adicionar" />
            </ActionForm>
          </VStack>
        </Card>
      </Grid>
    </Page>
  );
}
