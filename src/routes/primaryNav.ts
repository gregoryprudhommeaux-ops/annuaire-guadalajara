import type { AppRole } from '@/auth/roleModel';

export type PrimaryNavItem = {
  /** Clé imbriquée résolue par `t()` (ex. `nav.home`). */
  labelKey: string;
  href: string;
  visibility: 'guest' | 'member' | 'admin' | 'all';
};

export const primaryNav: PrimaryNavItem[] = [
  { labelKey: 'nav.home', href: '/', visibility: 'all' },
  { labelKey: 'nav.network', href: '/network', visibility: 'all' },
  { labelKey: 'nav.requests', href: '/requests', visibility: 'all' },
  { labelKey: 'nav.radar', href: '/radar', visibility: 'all' },
  { labelKey: 'nav.myProfile', href: '/profile/edit', visibility: 'member' },
  { labelKey: 'nav.admin', href: '/admin', visibility: 'admin' },
];

export function getPrimaryNav(role: AppRole) {
  return primaryNav.filter((item) => {
    if (item.visibility === 'all') return true;
    if (item.visibility === 'guest') return role === 'guest';
    if (item.visibility === 'member') return role === 'member' || role === 'admin';
    if (item.visibility === 'admin') return role === 'admin';
    return false;
  });
}
