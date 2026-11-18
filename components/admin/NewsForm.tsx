'use client';

import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/Layout';
import { Heading } from '@astryxdesign/core/Text';
import { saveNewsAction } from '@/app/actions/news';
import { ActionForm, FileField, SelectField, SubmitButton, SwitchField, TextAreaField, TextField } from '@/components/forms/ActionForm';

export type NewsFormValues = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  appId: string;
  published: boolean;
  hasCover: boolean;
};

export function NewsForm({ values, apps }: { values: NewsFormValues; apps: { id: string; name: string }[] }) {
  return (
    <ActionForm action={saveNewsAction} hidden={values.id ? { id: values.id } : undefined}>
      <Grid columns={{ minWidth: 340 }} gap={6} align="start">
        <Card padding={6}>
          <VStack gap={4}>
            <TextField name="title" label="Título" defaultValue={values.title} isRequired />
            <TextField name="summary" label="Resumo" description="Aparece na listagem e na página inicial" defaultValue={values.summary} isRequired />
            <TextAreaField name="body" label="Conteúdo" description="Aceita Markdown." defaultValue={values.body} rows={16} isRequired />
          </VStack>
        </Card>
        <VStack gap={6}>
          <Card padding={6}>
            <VStack gap={4}>
              <Heading level={2}>Publicação</Heading>
              <SwitchField name="published" label="Publicada" description="Visível em Notícias" defaultChecked={values.published} />
              <SelectField
                name="appId"
                label="Aplicativo relacionado"
                defaultValue={values.appId}
                placeholder="Nenhum"
                options={[{ value: '', label: 'Nenhum' }, ...apps.map((a) => ({ value: a.id, label: a.name }))]}
                isOptional
              />
              <FileField
                name="cover"
                label={values.hasCover ? 'Substituir capa' : 'Imagem de capa'}
                description="16:9 · PNG, JPG ou WEBP · até 5 MB"
                accept="image/png,image/jpeg,image/webp"
                maxSize={5 * 1024 * 1024}
                isOptional
              />
              <TextField name="slug" label="Endereço (slug)" description="Vazio = gerado a partir do título" defaultValue={values.slug} isOptional />
            </VStack>
          </Card>
          <SubmitButton label={values.id ? 'Salvar alterações' : 'Criar notícia'} />
        </VStack>
      </Grid>
    </ActionForm>
  );
}
