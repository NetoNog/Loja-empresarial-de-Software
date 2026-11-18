import { Suspense, type ReactNode } from 'react';
import { StoreShell } from '@/components/StoreShell';
import { getCurrentUser } from '@/lib/auth/session';

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <Suspense>
      <StoreShell user={user ? { name: user.name, email: user.email, role: user.role } : null}>{children}</StoreShell>
    </Suspense>
  );
}
