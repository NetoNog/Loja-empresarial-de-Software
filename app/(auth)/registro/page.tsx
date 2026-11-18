import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Banner } from '@astryxdesign/core/Banner';
import { Divider } from '@astryxdesign/core/Divider';
import { VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { registerAction } from '@/app/actions/auth';
import { ActionForm, SubmitButton, TextField } from '@/components/forms/ActionForm';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Criar conta' };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/');
  const domain = process.env.ALLOWED_EMAIL_DOMAIN;

  if (process.env.ALLOW_REGISTRATION === 'false') {
    return (
      <VStack gap={4}>
        <Banner status="info" title="Cadastro desabilitado" description="Solicite sua conta a um administrador da loja." collapsible={false} />
        <Link href="/login">Voltar ao login</Link>
      </VStack>
    );
  }

  return (
    <VStack gap={6}>
      <Text color="secondary" justify="center">
        {domain ? `Crie sua conta com o e-mail @${domain}` : 'Crie sua conta com seu e-mail corporativo'}
      </Text>
      <ActionForm action={registerAction}>
        <TextField name="name" label="Nome completo" placeholder="Nome completo" isLabelHidden size="lg" autoComplete="name" hasAutoFocus />
        <TextField name="email" label="E-mail" placeholder="E-mail corporativo" isLabelHidden size="lg" type="email" autoComplete="email" />
        <TextField
          name="password"
          label="Senha"
          placeholder="Senha (mín. 10 caracteres, letras e números)"
          isLabelHidden
          size="lg"
          type="password"
          autoComplete="new-password"
        />
        <TextField name="confirm" label="Confirmar senha" placeholder="Confirmar senha" isLabelHidden size="lg" type="password" autoComplete="new-password" />
        <SubmitButton label="Criar conta" size="lg" className="login-submit" />
      </ActionForm>
      <VStack gap={3} hAlign="center">
        <Divider label="ou" />
        <Text type="supporting">
          Já tem conta? <Link href="/login" type="supporting">Entrar</Link>
        </Text>
      </VStack>
    </VStack>
  );
}
