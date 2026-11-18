import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Text } from '@astryxdesign/core/Text';

/** Ícone do app. Sem ícone, mostra a inicial sobre um cartão colorido. */
export function AppIcon({ src, name, size = 56 }: { src: string | null; name: string; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className="app-icon" loading="lazy" />;
  }
  const variants = ['blue', 'purple', 'teal', 'orange', 'pink', 'green', 'cyan'] as const;
  const variant = variants[(name.codePointAt(0) ?? 0) % variants.length];
  return (
    <Card variant={variant} padding={0} width={size} height={size}>
      <Center axis="both" height="100%">
        <Text type="large" weight="bold" size={size >= 96 ? '3xl' : size >= 56 ? 'xl' : 'base'}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </Center>
    </Card>
  );
}
