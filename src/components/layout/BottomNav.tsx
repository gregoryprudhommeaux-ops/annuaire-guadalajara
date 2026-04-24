import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Handshake, Radar } from 'lucide-react';
import { cn } from '@/lib/cn';

export type BottomNavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export type BottomNavProps = {
  items?: BottomNavItem[];
  className?: string;
};

const DEFAULT_ITEMS: BottomNavItem[] = [
  { href: '/', label: 'Accueil', icon: <Home className="h-5 w-5" aria-hidden /> },
  { href: '/network', label: 'Réseau', icon: <Users className="h-5 w-5" aria-hidden /> },
  { href: '/requests', label: 'Demandes', icon: <Handshake className="h-5 w-5" aria-hidden /> },
  { href: '/radar', label: 'Radar', icon: <Radar className="h-5 w-5" aria-hidden /> },
];

export function BottomNav({ items = DEFAULT_ITEMS, className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-[var(--fn-border)] bg-[var(--fn-surface)] sm:hidden',
        // iOS safe-area: keep labels above home indicator.
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
      aria-label="Navigation"
    >
      <div className="mx-auto w-full max-w-[var(--fn-page-max)] px-[var(--fn-page-pad)]">
        <ul className="grid h-[var(--fn-bottomnav-h)] grid-cols-4 gap-1">
          {items.map((it) => (
            <li key={it.href} className="min-w-0">
              <NavLink
                to={it.href}
                end={it.href === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-[var(--fn-radius-sm)] px-1 py-2 outline-none',
                    'focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]',
                    isActive ? 'text-[var(--fn-fg)]' : 'text-[var(--fn-muted-2)] hover:text-[var(--fn-fg)]'
                  )
                }
              >
                {it.icon}
                <span className="max-w-full truncate text-center text-[11px] font-semibold leading-none">
                  {it.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

