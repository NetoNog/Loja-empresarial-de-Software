import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Divider } from '@astryxdesign/core/Divider';
import { VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { loginAction } from '@/app/actions/auth';
import { ActionForm, SubmitButton, TextField } from '@/components/forms/ActionForm';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Entrar' };

function safeNext(next?: string) {
  return next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/';
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));
  const allowRegistration = process.env.ALLOW_REGISTRATION !== 'false';

  return (
    <VStack gap={6}>
      <ActionForm action={loginAction} hidden={{ next: safeNext(next) }}>
        <TextField name="email" label="E-mail" placeholder="E-mail corporativo" isLabelHidden size="lg" type="email" autoComplete="username" hasAutoFocus />
        <TextField name="password" label="Senha" placeholder="Senha" isLabelHidden size="lg" type="password" autoComplete="current-password" />
        <SubmitButton label="Entrar" size="lg" className="login-submit" />
      </ActionForm>

      {allowRegistration && (
        <VStack gap={3} hAlign="center">
          <Divider label="ou" />
          <Text type="supporting">
            Primeiro acesso? <Link href="/registro" type="supporting">Criar conta</Link>
          </Text>
        </VStack>
      )}
    </VStack>
  );
}
