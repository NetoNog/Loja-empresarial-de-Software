'use client';

import { useEffect } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/Layout';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Center axis="both" minHeight="100dvh" padding={6}>
      <EmptyState
        title="Algo deu errado"
        description={`Tente novamente. Se persistir, informe o código ${error.digest ?? '—'} ao suporte.`}
        actions={
          <HStack gap={2}>
            <Button label="Tentar novamente" variant="primary" onClick={reset} />
            <Button label="Ir para o início" href="/" />
          </HStack>
        }
      />
    </Center>
  );
}
