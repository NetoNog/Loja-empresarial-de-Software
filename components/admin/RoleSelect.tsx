'use client';

import { useState, useTransition } from 'react';
import { Selector } from '@astryxdesign/core/Selector';
import { useToast } from '@astryxdesign/core/Toast';
import { ROLES, ROLE_LABEL } from '@/lib/roles';
import type { ActionState } from '@/lib/validation';

export function RoleSelect({
  userName,
  value,
  action,
  isDisabled,
}: {
  userName: string;
  value: string;
  action: (role: string) => Promise<ActionState>;
  isDisabled?: boolean;
}) {
  const [role, setRole] = useState(value);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  return (
    <Selector
      label={`Papel de ${userName}`}
      isLabelHidden
      size="sm"
      width={180}
      isLoading={pending}
      isDisabled={isDisabled}
      disabledMessage="Você não pode alterar o próprio papel"
      options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
      value={role}
      onChange={(next) => {
        const prev = role;
        setRole(next);
        startTransition(async () => {
          const res = await action(next);
          if (res.message) toast({ body: res.message, type: res.ok ? 'info' : 'error' });
          if (!res.ok) setRole(prev);
        });
      }}
    />
  );
}
