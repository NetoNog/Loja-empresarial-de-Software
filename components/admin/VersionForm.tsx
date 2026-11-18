'use client';

import { useRef, useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { FileInput } from '@astryxdesign/core/FileInput';
import { Grid } from '@astryxdesign/core/Grid';
import { VStack } from '@astryxdesign/core/Layout';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Text } from '@astryxdesign/core/Text';
import { createVersionAction } from '@/app/actions/apps';
import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from '@/components/forms/ActionForm';
import { PLATFORMS, formatBytes } from '@/lib/format';

type Uploaded = { tempId: string; size: number; sha256: string; fileName: string };

/** Envia o instalador via PUT em streaming (XHR para ter progresso). */
function InstallerUpload({ accept }: { accept: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  function start(f: File | null) {
    xhrRef.current?.abort();
    setFile(f);
    setUploaded(null);
    setError(null);
    setProgress(null);
    if (!f) return;

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('PUT', `/api/admin/upload?name=${encodeURIComponent(f.name)}`);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: Uploaded & { error?: string };
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = { error: `Falha no envio (HTTP ${xhr.status})` } as never;
      }
      if (xhr.status >= 200 && xhr.status < 300) setUploaded(data);
      else setError(data.error ?? `Falha no envio (HTTP ${xhr.status})`);
      setProgress(null);
    };
    xhr.onerror = () => {
      setError('Falha de rede durante o envio.');
      setProgress(null);
    };
    setProgress(0);
    xhr.send(f);
  }

  return (
    <VStack gap={2}>
      <FileInput
        label="Instalador"
        description="EXE, MSI, MSIX, ZIP, APK… O arquivo é enviado assim que selecionado."
        accept={accept}
        value={file}
        onChange={(v) => start(Array.isArray(v) ? (v[0] ?? null) : v)}
        isRequired
      />
      <input type="hidden" name="tempId" value={uploaded?.tempId ?? ''} />
      {progress !== null && <ProgressBar label="Enviando arquivo" value={progress} max={100} hasValueLabel />}
      {progress !== null && <Button label="Cancelar envio" size="sm" variant="ghost" onClick={() => start(null)} />}
      {uploaded && (
        <Banner
          status="success"
          title={`Arquivo recebido: ${uploaded.fileName} (${formatBytes(uploaded.size)})`}
          description={`SHA-256: ${uploaded.sha256}`}
          collapsible={false}
        />
      )}
      {error && <Banner status="error" title={error} collapsible={false} />}
    </VStack>
  );
}

export function VersionForm({ appId, suggestedVersion, accept }: { appId: string; suggestedVersion: string; accept: string }) {
  return (
    <ActionForm action={createVersionAction} hidden={{ appId }} resetOnSuccess>
      <InstallerUpload accept={accept} />
      <Grid columns={{ minWidth: 200 }} gap={3}>
        <TextField name="version" label="Versão" placeholder={suggestedVersion || '1.0.0'} isRequired />
        <SelectField
          name="platform"
          label="Plataforma"
          defaultValue="windows-x64"
          options={Object.entries(PLATFORMS).map(([value, label]) => ({ value, label }))}
        />
      </Grid>
      <TextAreaField
        name="changelog"
        label="Notas da versão (o que há de novo)"
        description="Aparece em “Novidades” e na página Atualizações. Aceita Markdown."
        rows={6}
        isOptional
      />
      <Text type="supporting">Usuários que baixaram versões anteriores verão o aviso de atualização na Biblioteca.</Text>
      <SubmitButton label="Publicar versão" />
    </ActionForm>
  );
}
