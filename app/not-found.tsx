import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Ico } from '@/components/ui/Ico';

export default function NotFound() {
  return (
    <Center axis="both" minHeight="100dvh" padding={6}>
      <EmptyState
        title="Página não encontrada"
        description="O endereço pode estar errado ou o conteúdo foi removido."
        icon={<Ico name="search" size="lg" />}
        actions={<Button label="Voltar à loja" variant="primary" href="/" />}
      />
    </Center>
  );
}
