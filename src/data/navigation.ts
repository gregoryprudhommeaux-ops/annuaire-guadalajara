import { Home, Users, Handshake, Radar, LineChart, Info, UserRound, Shield, CalendarDays, Mail, LayoutDashboard } from 'lucide-react';
import React from 'react';

export type NavAudience = 'visitor' | 'member';
export type NavPlacement = 'primary' | 'account';

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon?: React.ReactNode;
  audience: NavAudience;
  placement: NavPlacement;
};

type NavCtx = {
  isAuthenticated: boolean;
  isAdmin?: boolean;
};

export function getNavigation(ctx: NavCtx): { primary: NavItem[]; account: NavItem[] } {
  const isAuthed = ctx.isAuthenticated;
  const isAdmin = Boolean(ctx.isAdmin);

  const primary: NavItem[] = isAuthed
    ? [
        { id: 'home', href: '/', label: 'Accueil', audience: 'member', placement: 'primary' },
        { id: 'network', href: '/network', label: 'Réseau', audience: 'member', placement: 'primary' },
        { id: 'requests', href: '/requests', label: 'Demandes', audience: 'member', placement: 'primary' },
        { id: 'radar', href: '/radar', label: 'Radar', audience: 'member', placement: 'primary' },
        ...(isAdmin
          ? ([
              { id: 'stats', href: '/stats', label: 'Vitrine', audience: 'member', placement: 'primary' },
              { id: 'dashboard', href: '/admin/internal', label: 'DASHBOARD', audience: 'member', placement: 'primary' },
              { id: 'admin', href: '/admin', label: 'Admin', audience: 'member', placement: 'primary' },
              { id: 'events', href: '/evenements', label: 'Événements', audience: 'member', placement: 'primary' },
              { id: 'communication', href: '/communication', label: 'Communication', audience: 'member', placement: 'primary' },
            ] satisfies NavItem[])
          : []),
      ]
    : [];

  const account: NavItem[] = isAuthed
    ? [{ id: 'profile', href: '/profile/edit', label: 'Mon profil', audience: 'member', placement: 'account' }]
    : [{ id: 'learn', href: '/#comment-ca-marche', label: 'En savoir plus', audience: 'visitor', placement: 'account' }];

  // Attach icons without coupling consumers to lucide imports.
  const iconProps = { className: 'h-5 w-5', 'aria-hidden': true } as const;
  const iconById: Record<string, React.ReactNode> = {
    home: React.createElement(Home, iconProps),
    network: React.createElement(Users, iconProps),
    requests: React.createElement(Handshake, iconProps),
    radar: React.createElement(Radar, iconProps),
    stats: React.createElement(LineChart, iconProps),
    dashboard: React.createElement(LayoutDashboard, iconProps),
    admin: React.createElement(Shield, iconProps),
    events: React.createElement(CalendarDays, iconProps),
    communication: React.createElement(Mail, iconProps),
    profile: React.createElement(UserRound, iconProps),
    learn: React.createElement(Info, iconProps),
  };

  return {
    primary: primary.map((x) => ({ ...x, icon: iconById[x.id] })),
    account: account.map((x) => ({ ...x, icon: iconById[x.id] })),
  };
}

