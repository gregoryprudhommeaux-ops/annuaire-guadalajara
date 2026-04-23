import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, Menu, UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import siteFaviconUrl from '../../../favicon.svg?url';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { getNavigation } from '@/data/navigation';

export type AppHeaderUser = {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

export type AppHeaderProps = {
  /** Current route path used for subtle context (optional). */
  currentPath?: string;
  /** Visitor vs logged-in member. */
  user?: AppHeaderUser | null;
  /** Compact, premium lockup (never wraps badly). */
  brandTitle?: string;
  brandSubtitle?: string;
  /** Primary CTA for visitors (e.g., open auth). */
  onSignIn?: () => void;
  /** Sign out callback for members. */
  onSignOut?: () => void;
  /** Optional right-side content (language switcher, etc.). */
  rightSlot?: React.ReactNode;
  /** If true, show a back affordance. */
  backHref?: string;
  backLabel?: string;
};

function LogoMark() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--fn-border)] bg-[var(--fn-surface)] shadow-[var(--fn-shadow-sm)]">
      <img src={siteFaviconUrl} alt="" className="h-full w-full object-contain p-1" decoding="async" />
    </span>
  );
}

export function AppHeader({
  user,
  brandTitle = 'FrancoNetwork',
  brandSubtitle = "Annuaire d'Affaires · Guadalajara",
  onSignIn,
  onSignOut,
  rightSlot,
  backHref,
  backLabel = 'Retour',
}: AppHeaderProps) {
  const display = user?.displayName?.trim() || user?.email?.trim() || '';
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAuthenticated = Boolean(user);

  const { primary, account } = useMemo(() => getNavigation({ isAuthenticated }), [isAuthenticated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Close the sheet on route changes.
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        'border-b border-[var(--fn-border)]',
        'bg-[var(--fn-surface)]/95 backdrop-blur',
        // Ultra-subtle separation on scroll (avoid "app shadow" feel).
        scrolled && 'shadow-[0_1px_0_rgba(31,29,24,0.05)]'
      )}
    >
      <div className="mx-auto w-full max-w-[var(--fn-page-max)] px-[var(--fn-page-pad)]">
        <div className="pt-[env(safe-area-inset-top)]">
          <div className="flex h-[var(--fn-header-h)] min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {backHref ? (
              <Link
                to={backHref}
                className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--fn-fg)] hover:text-black"
              >
                <ChevronRight className="h-4 w-4 rotate-180 text-[var(--fn-muted-2)]" aria-hidden />
                <span className="truncate">{backLabel}</span>
              </Link>
            ) : (
              <Link to="/" className="group flex min-w-0 items-center gap-3">
                <LogoMark />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[15px] font-semibold tracking-tight text-[var(--fn-fg)] sm:text-base">
                    {brandTitle}
                  </span>
                  <span className="block truncate text-[11px] font-medium text-[var(--fn-muted)] sm:text-xs">
                    {brandSubtitle}
                  </span>
                </span>
              </Link>
            )}
          </div>

          {/* Desktop primary navigation */}
          {!backHref ? (
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Navigation principale">
              {primary.map((it) => (
                <NavLink
                  key={it.id}
                  to={it.href}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex min-h-[44px] items-center gap-2 rounded-[var(--fn-radius-sm)] px-3 text-sm font-semibold outline-none',
                      'focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-bg)]',
                      isActive
                        ? 'bg-[var(--fn-surface-2)] text-[var(--fn-fg)]'
                        : 'text-[var(--fn-muted)] hover:bg-[var(--fn-surface-2)] hover:text-[var(--fn-fg)]'
                    )
                  }
                >
                  <span className="text-[var(--fn-muted-2)]">{it.icon}</span>
                  <span className="truncate">{it.label}</span>
                </NavLink>
              ))}
            </nav>
          ) : null}

          <div className="flex shrink-0 items-center gap-2">
            {/* Minimal language switch lives here */}
            {rightSlot}

            {/* Account area (separated from primary nav) */}
            {isAuthenticated ? (
              <div className="hidden min-w-0 items-center gap-2 rounded-[var(--fn-radius-sm)] border border-[var(--fn-border)] bg-[var(--fn-surface-2)] px-3 py-2 sm:flex">
                <UserRound className="h-4 w-4 text-[var(--fn-muted-2)]" aria-hidden />
                <span className="max-w-[12rem] truncate text-xs font-semibold text-[var(--fn-fg)]">
                  {display || 'Membre'}
                </span>
              </div>
            ) : null}

            {/* Mobile menu button */}
            {!backHref ? (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--fn-radius-sm)] border border-[var(--fn-border)] bg-[var(--fn-surface)] text-[var(--fn-fg)] hover:bg-[var(--fn-surface-2)] sm:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
            ) : null}

            {/* Desktop sign-in/out (kept minimal) */}
            <div className="hidden sm:block">
              {!isAuthenticated ? (
                <Button variant="primary" onClick={onSignIn} className="min-h-[36px] px-3 py-1.5 text-sm">
                  Connexion
                </Button>
              ) : (
                <Button variant="ghost" onClick={onSignOut} className="min-h-[36px] px-3 py-1.5 text-sm">
                  Déconnexion
                </Button>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        primary={primary}
        account={account}
        rightSlot={rightSlot}
        isAuthenticated={isAuthenticated}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />
    </header>
  );
}

