'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Switch } from '@astryxdesign/core/Switch';
import { useToast } from '@astryxdesign/core/Toast';
import { ICONS, type IcoName } from '@/components/ui/Ico';
import type { ActionState } from '@/lib/validation';

/** Botão com confirmação (AlertDialog) para ações destrutivas. */
export function ConfirmAction({
  action,
  label,
  title,
  description,
  confirmLabel = 'Excluir',
  icon = 'trash',
  size = 'sm',
  isIconOnly = false,
}: {
  action: () => Promise<unknown>;
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  icon?: IcoName;
  size?: 'sm' | 'md';
  isIconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button
        label={label}
        variant={isIconOnly ? 'ghost' : 'destructive'}
        size={size}
        isIconOnly={isIconOnly}
        tooltip={isIconOnly ? label : undefined}
        icon={<Icon icon={ICONS[icon]} />}
        onClick={() => setOpen(true)}
      />
      <AlertDialog
        isOpen={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        actionLabel={confirmLabel}
        cancelLabel="Cancelar"
        actionVariant="destructive"
        isActionLoading={pending}
        onAction={() =>
          startTransition(async () => {
            await action();
            setOpen(false);
            router.refresh();
          })
        }
      />
    </>
  );
}

/** Switch que dispara uma server action imediatamente (publicar/despublicar, ativar conta…). */
export function ActionSwitch({
  label,
  value,
  action,
  isLabelHidden = true,
  isDisabled,
}: {
  label: string;
  value: boolean;
  action: (next: boolean) => Promise<ActionState | void>;
  isLabelHidden?: boolean;
  isDisabled?: boolean;
}) {
  const [checked, setChecked] = useState(value);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  return (
    <Switch
      label={label}
      isLabelHidden={isLabelHidden}
      value={checked}
      isLoading={pending}
      isDisabled={isDisabled}
      onChange={(next) => {
        setChecked(next);
        startTransition(async () => {
          const res = await action(next);
          if (res?.message) toast({ body: res.message, type: res.ok ? 'info' : 'error' });
          if (res && !res.ok) setChecked(!next);
        });
      }}
    />
  );
}

/** Botão que chama uma action e mostra o resultado em toast. */
export function ToastActionButton({
  label,
  action,
  icon,
  variant = 'secondary',
}: {
  label: string;
  action: () => Promise<ActionState>;
  icon?: IcoName;
  variant?: 'secondary' | 'ghost';
}) {
  const toast = useToast();
  return (
    <Button
      label={label}
      size="sm"
      variant={variant}
      icon={icon ? <Icon icon={ICONS[icon]} /> : undefined}
      clickAction={async () => {
        const res = await action();
        if (res.message) toast({ body: res.message, type: res.ok ? 'info' : 'error', isAutoHide: false });
      }}
    />
  );
}
