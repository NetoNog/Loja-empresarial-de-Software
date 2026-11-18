'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import { addScreenshotsAction, deleteScreenshotAction } from '@/app/actions/apps';
import { ActionForm, FileField, SubmitButton } from '@/components/forms/ActionForm';

export function ScreenshotsManager({ appId, shots }: { appId: string; shots: { id: string; url: string }[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <VStack gap={5}>
      {shots.length === 0 ? (
        <Text color="secondary">Nenhuma captura de tela enviada.</Text>
      ) : (
        <Grid columns={{ minWidth: 140 }} gap={3}>
          {shots.map((s, i) => (
            <Thumbnail
              key={s.id}
              src={s.url}
              alt={`Captura ${i + 1}`}
              label={`Captura ${i + 1}`}
              isLoading={pending}
              showRemoveOn="always"
              onRemove={() =>
                startTransition(async () => {
                  await deleteScreenshotAction(s.id);
                  router.refresh();
                })
              }
            />
          ))}
        </Grid>
      )}
      <ActionForm action={addScreenshotsAction} hidden={{ appId }} resetOnSuccess>
        <FileField
          name="screenshots"
          label="Adicionar capturas de tela"
          description="Até 10 imagens · PNG, JPG ou WEBP · até 5 MB cada · proporção 16:10 recomendada"
          accept="image/png,image/jpeg,image/webp"
          maxSize={5 * 1024 * 1024}
          multiple
        />
        <SubmitButton label="Enviar imagens" variant="secondary" />
      </ActionForm>
    </VStack>
  );
}
