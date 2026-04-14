import type { AppRole } from '@/auth/roleModel';

export type PrimaryNavItem = {
  label: string;
  href: string;
  visibility: 'guest' | 'member' | 'admin' | 'all';
};

export const primaryNav: PrimaryNavItem[] = [
  { label: 'Accueil', href: '/', visibility: 'all' },
  { label: 'Réseau', href: '/network', visibility: 'all' },
  { label: 'Demandes', href: '/requests', visibility: 'all' },
  { label: 'Dashboard', href: '/dashboard', visibility: 'member' },
  { label: 'Admin', href: '/admin', visibility: 'admin' },
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

