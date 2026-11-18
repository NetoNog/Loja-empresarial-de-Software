import type { Metadata } from 'next';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Text';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { changePasswordAction } from '@/app/actions/auth';
import { ActionForm, SubmitButton, TextField } from '@/components/forms/ActionForm';
import { Page, PageHeader } from '@/components/ui/Page';
import { requireUser } from '@/lib/auth/session';
import { ROLE_LABEL, type Role } from '@/lib/roles';

export const metadata: Metadata = { title: 'Minha conta' };

export default async function AccountPage() {
  const user = await requireUser('/conta');
  return (
    <Page width={640}>
      <PageHeader title="Minha conta" />
      <Card padding={5}>
        <MetadataList>
          <MetadataListItem label="Nome">{user.name}</MetadataListItem>
          <MetadataListItem label="E-mail">{user.email}</MetadataListItem>
          <MetadataListItem label="Perfil">{ROLE_LABEL[user.role as Role] ?? user.role}</MetadataListItem>
        </MetadataList>
      </Card>
      <Card padding={5}>
        <ActionForm action={changePasswordAction} resetOnSuccess>
          <Heading level={2}>Alterar senha</Heading>
          <TextField name="current" label="Senha atual" type="password" autoComplete="current-password" />
          <TextField name="password" label="Nova senha" type="password" autoComplete="new-password" description="Mínimo de 10 caracteres, com letras e números" />
          <TextField name="confirm" label="Confirmar nova senha" type="password" autoComplete="new-password" />
          <SubmitButton label="Salvar nova senha" />
        </ActionForm>
      </Card>
    </Page>
  );
}
