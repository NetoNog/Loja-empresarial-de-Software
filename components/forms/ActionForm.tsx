'use client';

import {
  createContext,
  startTransition,
  useActionState,
  useCallback,
  useContext,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { FileInput } from '@astryxdesign/core/FileInput';
import { VStack } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { Switch } from '@astryxdesign/core/Switch';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { ActionState } from '@/lib/validation';

type Ctx = {
  state: ActionState;
  pending: boolean;
  setFiles: (name: string, files: File[]) => void;
};
const FormCtx = createContext<Ctx>({ state: {}, pending: false, setFiles: () => {} });
const useForm = () => useContext(FormCtx);

function errorOf(state: ActionState, name: string) {
  const msg = state.errors?.[name];
  return msg ? ({ type: 'error', message: msg } as const) : undefined;
}

/**
 * Formulário ligado a uma Server Action. Os campos Astryx são controlados e
 * enviam via `htmlName`; arquivos são anexados ao FormData no envio.
 */
export function ActionForm({
  action,
  children,
  resetOnSuccess = false,
  hidden,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: ReactNode;
  resetOnSuccess?: boolean;
  hidden?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const files = useRef(new Map<string, File[]>());
  const [generation, setGeneration] = useState(0);
  const lastState = useRef(state);

  if (resetOnSuccess && state !== lastState.current) {
    lastState.current = state;
    if (state.ok) {
      files.current.clear();
      setGeneration((g) => g + 1);
    }
  }

  const setFiles = useCallback((name: string, list: File[]) => {
    files.current.set(name, list);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    for (const [name, list] of files.current) {
      fd.delete(name);
      for (const f of list) fd.append(name, f);
    }
    startTransition(() => formAction(fd));
  }

  return (
    <FormCtx.Provider value={{ state, pending, setFiles }}>
      <form onSubmit={onSubmit} noValidate>
        {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <VStack gap={4} key={generation}>
          {state.message && (
            <Banner status={state.ok ? 'success' : 'error'} title={state.message} collapsible={false} />
          )}
          {children}
        </VStack>
      </form>
    </FormCtx.Provider>
  );
}

export function SubmitButton({
  label,
  variant = 'primary',
  size,
  className,
  width,
}: {
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  width?: string;
}) {
  const { pending } = useForm();
  return <Button type="submit" label={label} variant={variant} size={size} width={width} className={className} isLoading={pending} />;
}

type Base = { name: string; label: string; description?: string; isRequired?: boolean; isOptional?: boolean };

export function TextField({
  defaultValue = '',
  type = 'text',
  placeholder,
  autoComplete,
  size,
  isLabelHidden,
  hasAutoFocus,
  ...p
}: Base & {
  defaultValue?: string;
  type?: 'text' | 'email' | 'password' | 'url';
  placeholder?: string;
  autoComplete?: string;
  size?: 'sm' | 'lg';
  isLabelHidden?: boolean;
  hasAutoFocus?: boolean;
}) {
  const { state } = useForm();
  const [value, setValue] = useState(defaultValue);
  return (
    <TextInput
      size={size}
      isLabelHidden={isLabelHidden}
      hasAutoFocus={hasAutoFocus}
      label={p.label}
      description={p.description}
      isRequired={p.isRequired}
      isOptional={p.isOptional}
      htmlName={p.name}
      type={type as 'text'}
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      autoComplete={autoComplete}
      status={errorOf(state, p.name)}
    />
  );
}

export function TextAreaField({ defaultValue = '', rows = 5, maxLength, ...p }: Base & { defaultValue?: string; rows?: number; maxLength?: number }) {
  const { state } = useForm();
  const [value, setValue] = useState(defaultValue);
  const err = state.errors?.[p.name];
  return (
    <VStack gap={1}>
      <TextArea
        label={p.label}
        description={p.description}
        isRequired={p.isRequired}
        isOptional={p.isOptional}
        htmlName={p.name}
        value={value}
        onChange={setValue}
        rows={rows}
        maxLength={maxLength}
      />
      {err && <Banner status="error" title={err} collapsible={false} />}
    </VStack>
  );
}

export function SelectField({
  defaultValue = '',
  options,
  placeholder,
  ...p
}: Base & { defaultValue?: string; options: { value: string; label: string }[]; placeholder?: string }) {
  const { state } = useForm();
  const [value, setValue] = useState(defaultValue);
  return (
    <Selector
      label={p.label}
      description={p.description}
      isRequired={p.isRequired}
      isOptional={p.isOptional}
      htmlName={p.name}
      options={options}
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      status={errorOf(state, p.name)}
    />
  );
}

export function SwitchField({ defaultChecked = false, ...p }: Base & { defaultChecked?: boolean }) {
  const [value, setValue] = useState(defaultChecked);
  return <Switch label={p.label} description={p.description} htmlName={p.name} value={value} onChange={setValue} />;
}

export function FileField({
  accept,
  maxSize,
  multiple = false,
  ...p
}: Base & { accept?: string; maxSize?: number; multiple?: boolean }) {
  const { state, setFiles } = useForm();
  const [value, setValue] = useState<File | File[] | null>(null);
  return (
    <FileInput
      label={p.label}
      description={p.description}
      isOptional={p.isOptional}
      isRequired={p.isRequired}
      accept={accept}
      maxSize={maxSize}
      isMultiple={multiple as never}
      value={value as never}
      onChange={((v: File | File[] | null) => {
        setValue(v);
        setFiles(p.name, v ? (Array.isArray(v) ? v : [v]) : []);
      }) as never}
      status={errorOf(state, p.name)}
    />
  );
}
