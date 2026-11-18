import type { ReactNode } from 'react';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { Ico } from '@/components/ui/Ico';

/** Moldura das telas de login/cadastro: formulário à esquerda, ilustração à direita, ondas decorativas. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <VStack className="login-scene">
      <svg className="login-wave login-wave--top" viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="waveTop" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4aa3f7" />
            <stop offset="1" stopColor="#6b7cf6" />
          </linearGradient>
        </defs>
        <path
          fill="url(#waveTop)"
          d="M0 0 H1200 V200 C1150 240 1060 262 980 240 C900 218 860 140 780 90 C720 52 650 60 590 40 C520 18 470 30 380 26 C250 22 120 14 0 0 Z"
        />
      </svg>
      <svg className="login-wave login-wave--bottom" viewBox="0 0 900 200" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="waveBottom" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#6b7cf6" />
            <stop offset="1" stopColor="#4aa3f7" />
          </linearGradient>
        </defs>
        <path
          fill="url(#waveBottom)"
          d="M0 40 C60 10 110 20 140 50 C170 80 190 30 250 20 C320 8 340 70 400 100 C480 140 600 110 700 130 C780 146 840 170 900 200 H0 Z"
        />
      </svg>

      <VStack className="login-content">
        <VStack className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-2">
          <VStack hAlign="center" paddingInline={6} paddingBlock={8} className="min-w-0">
            <VStack gap={8} width="100%" maxWidth={420}>
              <HStack gap={3} hAlign="center" vAlign="center" wrap="wrap">
                <VStack className="login-logo-mark" hAlign="center" vAlign="center">
                  <Ico name="cube" size="lg" color="inherit" />
                </VStack>
                <Text type="display-3" weight="bold" color="inherit" className="login-brand">
                  Loja de Software
                </Text>
              </HStack>
              {children}
            </VStack>
          </VStack>

          <VStack hAlign="center" padding={6} className="max-lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/login-illustration.svg" alt="" width={560} height={490} className="login-illustration" />
          </VStack>
        </VStack>
      </VStack>

      <VStack gap={1} hAlign="center" paddingBlock={4} className="login-footer">
        <Text type="supporting">Loja de Software · Copyright © {year}</Text>
      </VStack>
    </VStack>
  );
}
