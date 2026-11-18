'use client';

import { Icon } from '@astryxdesign/core/Icon';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowRightEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ComputerDesktopIcon,
  CubeIcon,
  EyeIcon,
  EyeSlashIcon,
  HomeIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  TagIcon,
  TrashIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

export const ICONS = {
  home: HomeIcon,
  apps: Squares2X2Icon,
  updates: ArrowPathIcon,
  news: NewspaperIcon,
  library: BookOpenIcon,
  download: ArrowDownTrayIcon,
  upload: ArrowUpTrayIcon,
  dashboard: ChartBarIcon,
  users: UsersIcon,
  tag: TagIcon,
  audit: ClipboardDocumentListIcon,
  login: ArrowRightEndOnRectangleIcon,
  logout: ArrowRightStartOnRectangleIcon,
  user: UserCircleIcon,
  plus: PlusIcon,
  trash: TrashIcon,
  edit: PencilSquareIcon,
  external: ArrowTopRightOnSquareIcon,
  computer: ComputerDesktopIcon,
  sparkles: SparklesIcon,
  search: MagnifyingGlassIcon,
  check: CheckCircleIcon,
  eye: EyeIcon,
  eyeOff: EyeSlashIcon,
  shield: ShieldCheckIcon,
  cube: CubeIcon,
  key: KeyIcon,
  chevronRight: ChevronRightIcon,
  photo: PhotoIcon,
} as const;

export type IcoName = keyof typeof ICONS;

/** Ícone por nome — permite usar ícones a partir de Server Components (props serializáveis). */
export function Ico({
  name,
  size,
  color,
}: {
  name: IcoName;
  size?: 'xsm' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'inherit';
}) {
  return <Icon icon={ICONS[name]} size={size} color={color as never} />;
}
