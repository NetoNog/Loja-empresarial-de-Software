'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@astryxdesign/core/AppShell';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { Icon } from '@astryxdesign/core/Icon';
import { NavIcon } from '@astryxdesign/core/NavIcon';
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TopNav } from '@astryxdesign/core/TopNav';
import { logoutAction } from '@/app/actions/auth';
import { ICONS } from '@/components/ui/Ico';
import { ROLE_LABEL, type Role } from '@/lib/roles';

export type ShellUser = { name: string; email: string; role: string } | null;

const STORE_NAV = [
  { href: '/', label: 'Início', icon: ICONS.home, exact: true },
  { href: '/apps', label: 'Aplicativos', icon: ICONS.apps },
  { href: '/atualizacoes', label: 'Atualizações', icon: ICONS.updates },
  { href: '/noticias', label: 'Notícias', icon: ICONS.news },
  { href: '/biblioteca', label: 'Biblioteca', icon: ICONS.library },
];

const ADMIN_NAV = [
  { href: '/admin', label: 'Painel', icon: ICONS.dashboard, exact: true },
  { href: '/admin/apps', label: 'Aplicativos', icon: ICONS.cube },
  { href: '/admin/noticias', label: 'Notícias', icon: ICONS.news },
  { href: '/admin/categorias', label: 'Categorias', icon: ICONS.tag },
];

const MASTER_NAV = [
  { href: '/admin/usuarios', label: 'Usuários e permissões', icon: ICONS.users },
  { href: '/admin/auditoria', label: 'Auditoria', icon: ICONS.audit },
];

function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const submit = () => {
    const term = q.trim();
    router.push(term ? `/apps?q=${encodeURIComponent(term)}` : '/apps');
  };
  return (
    <TextInput
      label="Buscar aplicativos"
      isLabelHidden
      placeholder="Buscar aplicativos, ferramentas…"
      value={q}
      onChange={setQ}
      onEnter={submit}
      startIcon={ICONS.search}
      hasClear
      enterKeyHint="search"
      width="min(560px, 100%)"
    />
  );
}

export function StoreShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER';
  const isMaster = user?.role === 'MASTER';

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const accountMenu = user ? (
    <DropdownMenu
      alignment="end"
      hasChevron={false}
      renderTrigger={(props) => (
        <Avatar {...(props as object)} name={user.name} size="sm" tooltip={`${user.name} · ${ROLE_LABEL[user.role as Role] ?? ''}`} />
      )}
      items={[
        { label: user.name, description: user.email, isDisabled: true },
        { label: 'Minha conta', href: '/conta' },
        { label: 'Biblioteca', href: '/biblioteca' },
        ...(isAdmin ? [{ label: 'Painel administrativo', href: '/admin' }] : []),
        { label: 'Sair', onClick: () => void logoutAction() },
      ]}
    />
  ) : (
    <Button label="Entrar" variant="primary" size="sm" href="/login" icon={<Icon icon={ICONS.login} />} />
  );

  return (
    <AppShell
      height="fill"
      variant="elevated"
      contentPadding={0}
      topNav={<TopNav label="Barra superior" centerContent={<SearchBox />} endContent={accountMenu} />}
      sideNav={
        <SideNav
          collapsible
          aria-label="Navegação principal"
          header={
            <SideNavHeading
              heading="Loja de Software"
              subheading="Desenvolvimento de Soluções"
              headingHref="/"
              icon={<NavIcon icon={<Icon icon={ICONS.cube} size="sm" />} />}
            />
          }
        >
          <SideNavSection title="Loja" isHeaderHidden>
            {STORE_NAV.map((item) => (
              <SideNavItem key={item.href} label={item.label} icon={item.icon} href={item.href} isSelected={isActive(item.href, item.exact)} />
            ))}
          </SideNavSection>
          {isAdmin && (
            <>
              <Divider />
              <SideNavSection title="Administração">
                {ADMIN_NAV.map((item) => (
                  <SideNavItem key={item.href} label={item.label} icon={item.icon} href={item.href} isSelected={isActive(item.href, item.exact)} />
                ))}
                {isMaster &&
                  MASTER_NAV.map((item) => (
                    <SideNavItem key={item.href} label={item.label} icon={item.icon} href={item.href} isSelected={isActive(item.href)} />
                  ))}
              </SideNavSection>
            </>
          )}
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
