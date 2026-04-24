import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/data/navigation';
import { Button } from '@/components/ui/Button';

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  primary: NavItem[];
  account: NavItem[];
  rightSlot?: React.ReactNode;
  isAuthenticated: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
};

export function MobileMenu({
  open,
  onClose,
  primary,
  account,
  rightSlot,
  isAuthenticated,
  onSignIn,
  onSignOut,
}: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] sm:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0',
          'rounded-t-[22px] border border-[var(--fn-border)] bg-[var(--fn-surface)] shadow-[var(--fn-shadow-md)]'
        )}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      >
        <div className="mx-auto w-full max-w-[var(--fn-page-max)] px-[var(--fn-page-pad)] py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold tracking-tight text-[var(--fn-fg)]">Menu</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--fn-radius-sm)] text-[var(--fn-muted-2)] outline-none hover:bg-[var(--fn-surface-2)] hover:text-[var(--fn-fg)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="shrink-0">{rightSlot}</div>
            {!isAuthenticated ? (
              <Button variant="primary" onClick={onSignIn} className="min-h-[44px] px-3 py-2 text-sm">
                Connexion
              </Button>
            ) : (
              <Button variant="ghost" onClick={onSignOut} className="min-h-[44px] px-3 py-2 text-sm">
                Déconnexion
              </Button>
            )}
          </div>

          <nav className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fn-muted-2)]">
              Navigation
            </p>
            <ul className="mt-2 space-y-1">
              {primary.map((it) => (
                <li key={it.id}>
                  {it.href.includes('#') ? (
                    <a
                      href={it.href}
                      onClick={onClose}
                      className="flex min-h-[44px] items-center gap-3 rounded-[var(--fn-radius-sm)] px-3 text-sm font-semibold text-[var(--fn-fg)] outline-none hover:bg-[var(--fn-surface-2)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]"
                    >
                      <span className="text-[var(--fn-muted-2)]">{it.icon}</span>
                      <span className="truncate">{it.label}</span>
                    </a>
                  ) : (
                    <NavLink
                      to={it.href}
                      end={it.href === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-[44px] items-center gap-3 rounded-[var(--fn-radius-sm)] px-3 text-sm font-semibold outline-none',
                          'focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]',
                          isActive
                            ? 'bg-[var(--fn-surface-2)] text-[var(--fn-fg)]'
                            : 'text-[var(--fn-fg)] hover:bg-[var(--fn-surface-2)]'
                        )
                      }
                    >
                      <span className="text-[var(--fn-muted-2)]">{it.icon}</span>
                      <span className="truncate">{it.label}</span>
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fn-muted-2)]">
              Compte
            </p>
            <ul className="mt-2 space-y-1">
              {account.map((it) => (
                <li key={it.id}>
                  <NavLink
                    to={it.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-[44px] items-center gap-3 rounded-[var(--fn-radius-sm)] px-3 text-sm font-semibold outline-none',
                        'focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]',
                        isActive
                          ? 'bg-[var(--fn-surface-2)] text-[var(--fn-fg)]'
                          : 'text-[var(--fn-fg)] hover:bg-[var(--fn-surface-2)]'
                      )
                    }
                  >
                    <span className="text-[var(--fn-muted-2)]">{it.icon}</span>
                    <span className="truncate">{it.label}</span>
                  </NavLink>
                </li>
              ))}
              <li>
                <Link
                  to="/privacy"
                  onClick={onClose}
                  className="flex min-h-[44px] items-center gap-3 rounded-[var(--fn-radius-sm)] px-3 text-sm font-semibold text-[var(--fn-muted)] outline-none hover:bg-[var(--fn-surface-2)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]"
                >
                  <span className="truncate">Confidentialité</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  onClick={onClose}
                  className="flex min-h-[44px] items-center gap-3 rounded-[var(--fn-radius-sm)] px-3 text-sm font-semibold text-[var(--fn-muted)] outline-none hover:bg-[var(--fn-surface-2)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]"
                >
                  <span className="truncate">Conditions</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

