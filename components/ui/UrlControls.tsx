'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Selector } from '@astryxdesign/core/Selector';
import { Tab, TabList } from '@astryxdesign/core/TabList';

/** Abas como links (navegação por URL). */
export function LinkTabs({ value, tabs }: { value: string; tabs: { value: string; label: string; href: string }[] }) {
  return (
    <TabList value={value} onChange={() => {}} hasDivider overflow="auto">
      {tabs.map((t) => (
        <Tab key={t.value} value={t.value} label={t.label} href={t.href} />
      ))}
    </TabList>
  );
}

function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (key: string, value: string | null, resetPage = true) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage && key !== 'pagina') next.delete('pagina');
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };
}

export function UrlPagination({ page, totalItems, pageSize }: { page: number; totalItems: number; pageSize: number }) {
  const setParam = useSetParam();
  if (totalItems <= pageSize) return null;
  return (
    <Pagination
      label="Paginação"
      page={page}
      totalItems={totalItems}
      pageSize={pageSize}
      onChange={(p) => setParam('pagina', p > 1 ? String(p) : null, false)}
    />
  );
}

export function UrlSelect({
  param,
  label,
  value,
  options,
}: {
  param: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  const setParam = useSetParam();
  return (
    <Selector
      label={label}
      isLabelHidden
      size="sm"
      width={200}
      options={options}
      value={value}
      onChange={(v) => setParam(param, v || null)}
    />
  );
}
