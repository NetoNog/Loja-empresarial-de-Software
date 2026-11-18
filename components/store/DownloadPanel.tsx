'use client';

import { useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { ICONS } from '@/components/ui/Ico';
import { PLATFORMS, formatBytes } from '@/lib/format';

type Latest = { id: string; version: string; platform: string; fileSize: number; fileName: string };

export function DownloadPanel({
  appId,
  latest,
  remoteInstall,
  isLoggedIn,
}: {
  appId: string;
  latest: Latest[];
  remoteInstall: boolean;
  isLoggedIn: boolean;
}) {
  const [platform, setPlatform] = useState(latest[0]?.platform ?? '');
  const current = latest.find((l) => l.platform === platform) ?? latest[0];

  if (!current) {
    return <Banner status="info" title="Nenhuma versão disponível para download no momento." collapsible={false} />;
  }

  return (
    <VStack gap={3}>
      {latest.length > 1 && (
        <Selector
          label="Plataforma"
          options={latest.map((l) => ({ value: l.platform, label: PLATFORMS[l.platform] ?? l.platform }))}
          value={platform}
          onChange={setPlatform}
        />
      )}
      <Button
        label={`Baixar v${current.version}`}
        variant="primary"
        size="lg"
        width="100%"
        href={`/api/download/${current.id}`}
        icon={<Icon icon={ICONS.download} />}
      />
      <Text type="supporting" justify="center">
        {PLATFORMS[current.platform] ?? current.platform} · {formatBytes(current.fileSize)}
      </Text>
      {remoteInstall && <RemoteInstall appId={appId} isLoggedIn={isLoggedIn} />}
    </VStack>
  );
}

type Host = { systemId: number; hostName: string };

function RemoteInstall({ appId, isLoggedIn }: { appId: string; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [hosts, setHosts] = useState<Host[] | null>(null);
  const [systemId, setSystemId] = useState('');
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function openDialog() {
    setOpen(true);
    setResult(null);
    setHosts(null);
    const res = await fetch('/api/install', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setResult({ ok: false, text: data.error ?? 'Falha ao consultar suas máquinas.' });
      setHosts([]);
      return;
    }
    setHosts(data.hosts ?? []);
    if (data.hosts?.length === 1) setSystemId(String(data.hosts[0].systemId));
  }

  async function install() {
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, systemId: Number(systemId) }),
    });
    const data = await res.json().catch(() => ({}));
    setResult({ ok: res.ok, text: data.message ?? data.error ?? 'Erro inesperado.' });
    setLoading(false);
  }

  if (!isLoggedIn) {
    return <Button label="Entrar para instalar remotamente" variant="secondary" width="100%" href="/login" icon={<Icon icon={ICONS.computer} />} />;
  }

  return (
    <>
      <Button label="Instalar no meu computador" variant="secondary" width="100%" onClick={openDialog} icon={<Icon icon={ICONS.computer} />} />
      <Dialog isOpen={open} onOpenChange={setOpen} width={460}>
        <DialogHeader title="Instalação remota" subtitle="O pacote é enviado pelo ITAM e instalado automaticamente." onOpenChange={setOpen} />
        <VStack gap={4} padding={4}>
          {hosts === null ? (
            <VStack hAlign="center" padding={4}>
              <Spinner />
            </VStack>
          ) : hosts.length === 0 ? (
            !result && (
              <Banner
                status="warning"
                title="Nenhuma máquina gerenciada encontrada"
                description="Seu computador não foi localizado no inventário a partir do seu endereço de rede. Use o download direto ou contate o suporte."
                collapsible={false}
              />
            )
          ) : (
            <Selector
              label="Computador de destino"
              placeholder="Selecione o nome do seu computador"
              options={hosts.map((h) => ({ value: String(h.systemId), label: h.hostName }))}
              value={systemId}
              onChange={setSystemId}
            />
          )}
          {result && <Banner status={result.ok ? 'success' : 'error'} title={result.text} collapsible={false} />}
          <Button
            label="Solicitar instalação"
            variant="primary"
            isDisabled={!systemId || !!result?.ok}
            isLoading={loading}
            onClick={install}
          />
        </VStack>
      </Dialog>
    </>
  );
}
