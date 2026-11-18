'use client';

import NextLink from 'next/link';
import type { ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { LinkProvider } from '@astryxdesign/core/Link';
import { themes, defaultThemeSlug } from '@/astryx-themes';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Theme theme={themes[defaultThemeSlug]}>
      <LinkProvider component={NextLink}>{children}</LinkProvider>
    </Theme>
  );
}
