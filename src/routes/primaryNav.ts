export type PrimaryNavItem = {
  label: string;
  href: string;
  visibility: 'public' | 'authenticated' | 'all';
};

export const primaryNav: PrimaryNavItem[] = [
  { label: 'Accueil', href: '/', visibility: 'all' },
  { label: 'Réseau', href: '/network', visibility: 'all' },
  { label: 'Demandes', href: '/requests', visibility: 'all' },
  { label: 'Dashboard', href: '/dashboard', visibility: 'authenticated' },
];

export function getPrimaryNav(isAuthenticated: boolean) {
  return primaryNav.filter((item) => {
    if (item.visibility === 'all') return true;
    if (item.visibility === 'public') return !isAuthenticated;
    if (item.visibility === 'authenticated') return isAuthenticated;
    return false;
  });
}

