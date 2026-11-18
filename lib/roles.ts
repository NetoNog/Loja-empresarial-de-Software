export const ROLES = ['USER', 'ADMIN', 'MASTER'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  USER: 'Usuário',
  ADMIN: 'Administrador',
  MASTER: 'Admin Master',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function isAdminRole(role: string | undefined | null): boolean {
  return role === 'ADMIN' || role === 'MASTER';
}

export function isMasterRole(role: string | undefined | null): boolean {
  return role === 'MASTER';
}
