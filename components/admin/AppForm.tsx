'use client';

import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { saveAppAction } from '@/app/actions/apps';
import { ActionForm, FileField, SelectField, SubmitButton, SwitchField, TextAreaField, TextField } from '@/components/forms/ActionForm';
import { AppIcon } from '@/components/ui/AppIcon';

export type AppFormValues = {
  id?: string;
  name: string;
  slug: string;
  publisher: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  website: string;
  tags: string;
  itomPackageId: string;
  featured: boolean;
  published: boolean;
  iconUrl: string | null;
  bannerUrl: string | null;
};

const IMG = 'image/png,image/jpeg,image/webp,image/gif';
const MAX_IMG = 5 * 1024 * 1024;

export function AppForm({
  values,
  categories,
  itomEnabled,
}: {
  values: AppFormValues;
  categories: { id: string; name: string }[];
  itomEnabled: boolean;
}) {
  return (
    <ActionForm action={saveAppAction} hidden={values.id ? { id: values.id } : undefined}>
      <Grid columns={{ minWidth: 340 }} gap={6} align="start">
        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={2}>Informações</Heading>
            <TextField name="name" label="Nome do aplicativo" defaultValue={values.name} isRequired />
            <Grid columns={{ minWidth: 200 }} gap={3}>
              <TextField name="publisher" label="Publicador / equipe" defaultValue={values.publisher} isRequired />
              <SelectField
                name="categoryId"
                label="Categoria"
                defaultValue={values.categoryId}
                placeholder="Sem categoria"
                options={[{ value: '', label: 'Sem categoria' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </Grid>
            <TextField
              name="shortDescription"
              label="Resumo"
              description="Uma frase que aparece nos cards da vitrine (até 160 caracteres)"
              defaultValue={values.shortDescription}
              isRequired
            />
            <TextAreaField
              name="description"
              label="Descrição completa"
              description="Aceita Markdown: **negrito**, listas, links, títulos (##)."
              defaultValue={values.description}
              rows={12}
              isRequired
            />
            <Grid columns={{ minWidth: 200 }} gap={3}>
              <TextField name="tags" label="Palavras-chave" description="Separadas por vírgula" defaultValue={values.tags} isOptional />
              <TextField name="website" label="Site / documentação" type="url" placeholder="https://" defaultValue={values.website} isOptional />
            </Grid>
            <TextField
              name="slug"
              label="Endereço (slug)"
              description="Deixe vazio para gerar a partir do nome. Ex.: meu-app → /apps/meu-app"
              defaultValue={values.slug}
              isOptional
            />
          </VStack>
        </Card>

        <VStack gap={6}>
          <Card padding={6}>
            <VStack gap={4}>
              <Heading level={2}>Publicação</Heading>
              <SwitchField name="published" label="Publicado na loja" description="Visível para todos os usuários" defaultChecked={values.published} />
              <SwitchField name="featured" label="Em destaque" description="Aparece no carrossel da página inicial" defaultChecked={values.featured} />
              {itomEnabled && (
                <TextField
                  name="itomPackageId"
                  label="ID do pacote no ITAM"
                  description="Habilita o botão “Instalar no meu computador”"
                  defaultValue={values.itomPackageId}
                  isOptional
                />
              )}
              {!itomEnabled && <input type="hidden" name="itomPackageId" value={values.itomPackageId} />}
            </VStack>
          </Card>

          <Card padding={6}>
            <VStack gap={4}>
              <Heading level={2}>Imagens</Heading>
              <HStack gap={3} vAlign="center">
                <AppIcon src={values.iconUrl} name={values.name || '?'} size={64} />
                <Text type="supporting">{values.iconUrl ? 'Ícone atual' : 'Sem ícone (será exibida a inicial)'}</Text>
              </HStack>
              <FileField name="icon" label="Ícone" description="Quadrado, 256×256 px ou maior · PNG, JPG ou WEBP · até 5 MB" accept={IMG} maxSize={MAX_IMG} isOptional />
              <FileField name="banner" label="Banner de destaque" description="16:9, ex.: 1600×900 px · usado no carrossel" accept={IMG} maxSize={MAX_IMG} isOptional />
            </VStack>
          </Card>

          <SubmitButton label={values.id ? 'Salvar alterações' : 'Criar e enviar instalador'} />
        </VStack>
      </Grid>
    </ActionForm>
  );
}
