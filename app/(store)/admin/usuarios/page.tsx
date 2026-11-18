import type { Metadata } from 'next';
import { Banner } from '@astryxdesign/core/Banner';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { createUserAction, resetPasswordAction, setUserActiveAction, setUserRoleAction } from '@/app/actions/users';
import { ActionSwitch, ToastActionButton } from '@/components/admin/ActionButtons';
import { RoleSelect } from '@/components/admin/RoleSelect';
import { ActionForm, SelectField, SubmitButton, TextField } from '@/components/forms/ActionForm';
import { Page, PageHeader } from '@/components/ui/Page';
import { UrlPagination } from '@/components/ui/UrlControls';
import { requireMaster } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { ROLES, ROLE_LABEL } from '@/lib/roles';

export const metadata: Metadata = { title: 'Usuários e permissões' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const me = await requireMaster();
  const { q, pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);
  const where = q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <Page>
      <PageHeader
        title="Usuários e permissões"
        description="Conceda o papel de Administrador aos colaboradores que vão gerenciar aplicativos e notícias."
        crumbs={[{ label: 'Administração', href: '/admin' }, { label: 'Usuários' }]}
      />

      <Banner
        status="info"
        title="Papéis"
        description="Usuário: baixa aplicativos · Administrador: gerencia aplicativos, versões, categorias e notícias · Admin Master: tudo, mais usuários, permissões e auditoria."
        collapsible={false}
      />

      <Grid columns={{ minWidth: 340 }} gap={6} align="start">
        <VStack gap={3}>
          <Card padding={0}>
            <Table dividers="rows">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Colaborador</TableHeaderCell>
                  <TableHeaderCell>Papel</TableHeaderCell>
                  <TableHeaderCell>Ativo</TableHeaderCell>
                  <TableHeaderCell>Último acesso</TableHeaderCell>
                  <TableHeaderCell> </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <VStack gap={0.5}>
                        <Text weight="semibold">
                          {u.name}
                          {u.id === me.id ? ' (você)' : ''}
                        </Text>
                        <Text type="supporting">{u.email}</Text>
                      </VStack>
                    </TableCell>
                    <TableCell>
                      <RoleSelect userName={u.name} value={u.role} action={setUserRoleAction.bind(null, u.id)} isDisabled={u.id === me.id} />
                    </TableCell>
                    <TableCell>
                      <ActionSwitch
                        label={`Conta de ${u.name} ativa`}
                        value={u.active}
                        action={setUserActiveAction.bind(null, u.id)}
                        isDisabled={u.id === me.id}
                      />
                    </TableCell>
                    <TableCell>
                      <Text type="supporting">{formatDateTime(u.lastLoginAt)}</Text>
                    </TableCell>
                    <TableCell>
                      {u.id !== me.id && (
                        <ToastActionButton label="Redefinir senha" icon="key" variant="ghost" action={resetPasswordAction.bind(null, u.id)} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <HStack hAlign="center">
            <UrlPagination page={page} totalItems={total} pageSize={PAGE_SIZE} />
          </HStack>
        </VStack>

        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={2}>Cadastrar colaborador</Heading>
            <Text type="supporting">Uma senha temporária será gerada e exibida uma única vez.</Text>
            <ActionForm action={createUserAction} resetOnSuccess>
              <TextField name="name" label="Nome" />
              <TextField name="email" label="E-mail" type="email" />
              <SelectField name="role" label="Papel" defaultValue="USER" options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
              <SubmitButton label="Cadastrar" />
            </ActionForm>
          </VStack>
        </Card>
      </Grid>
    </Page>
  );
}
