import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Menu, UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import siteFaviconUrl from '../../../favicon.svg?url';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { getNavigation } from '@/data/navigation';
import { useLanguage } from '@/i18n/LanguageProvider';
import { pickLang } from '@/lib/uiLocale';

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
  /** Admin experience: shows additional primary nav items (e.g. Admin). */
  isAdmin?: boolean;
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
  isAdmin = false,
  brandTitle = 'FrancoNetwork',
  brandSubtitle,
  onSignIn,
  onSignOut,
  rightSlot,
  backHref,
  backLabel,
}: AppHeaderProps) {
  const display = user?.displayName?.trim() || user?.email?.trim() || '';
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAuthenticated = Boolean(user);
  const { lang, t } = useLanguage();

  const resolvedBrandSubtitle =
    brandSubtitle ??
    pickLang("Annuaire d'Affaires · Guadalajara", 'Directorio de Negocios · Guadalajara', 'Business directory · Guadalajara', lang);
  const resolvedBackLabel = backLabel ?? t('common.back');

  const { primary, account } = useMemo(
    () => getNavigation({ isAuthenticated, isAdmin }),
    [isAuthenticated, isAdmin]
  );

  const isPrimaryNavItemActive = (href: string) => {
    if (href.includes('#')) {
      if (href.includes('comment-ca-marche')) {
        return location.hash === '#comment-ca-marche';
      }
      if (href === '/#') {
        return location.pathname === '/' && (location.hash === '' || location.hash === '#');
      }
    }
    if (!href.startsWith('/')) return false;
    return (
      location.pathname === href || (href !== '/' && !href.includes('#') && location.pathname.startsWith(`${href}/`))
    );
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Close the sheet on route changes.
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header
      className={cn(
        'no-print',
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
          <div className="min-w-0 max-w-full flex-1 pr-1">
            {backHref ? (
              <Link
                to={backHref}
                className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[var(--fn-fg)] hover:text-black"
              >
                <ChevronRight className="h-4 w-4 rotate-180 text-[var(--fn-muted-2)]" aria-hidden />
                <span className="truncate">{resolvedBackLabel}</span>
              </Link>
            ) : (
              <Link to="/" className="group flex min-w-0 items-center gap-3">
                <LogoMark />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[15px] font-semibold tracking-tight text-[var(--fn-fg)] sm:text-base">
                    {brandTitle}
                  </span>
                  <span className="block truncate text-[11px] font-medium text-[var(--fn-muted)] sm:text-xs">
                    {resolvedBrandSubtitle}
                  </span>
                </span>
              </Link>
            )}
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:pl-2">
            {/* Minimal language switch lives here */}
            {rightSlot}

            {/* Account area (separated from primary nav) */}
            {isAuthenticated ? (
              <div className="hidden min-w-0 items-center gap-2 rounded-[var(--fn-radius-sm)] border border-[var(--fn-border)] bg-[var(--fn-surface-2)] px-3 py-2 sm:flex">
                <UserRound className="h-4 w-4 text-[var(--fn-muted-2)]" aria-hidden />
                <span className="max-w-[12rem] truncate text-xs font-semibold text-[var(--fn-fg)]">
                  {display || t('common.member')}
                </span>
              </div>
            ) : null}

            {/* Mobile menu button */}
            {!backHref ? (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--fn-radius-sm)] border border-[var(--fn-border)] bg-[var(--fn-surface)] text-[var(--fn-fg)] hover:bg-[var(--fn-surface-2)] sm:hidden"
                aria-label={t('common.openMenu')}
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
            ) : null}

            {/* Desktop sign-in/out (kept minimal) */}
            <div className="hidden sm:block">
              {!isAuthenticated ? (
                <Button variant="primary" onClick={onSignIn} className="min-h-[36px] px-3 py-1.5 text-sm">
                  {t('login')}
                </Button>
              ) : (
                <Button variant="ghost" onClick={onSignOut} className="min-h-[36px] px-3 py-1.5 text-sm">
                  {t('logout')}
                </Button>
              )}
            </div>
          </div>
          </div>

          {/* Primary navigation: second row (sm+), not in the top banner — more room for the logo. */}
          {!backHref ? (
            <div className="hidden border-t border-[var(--fn-border)] bg-[var(--fn-surface)] py-2.5 sm:block">
              <nav
                className="flex flex-wrap items-center gap-2"
                aria-label={t('common.primaryNavigation')}
              >
                {primary.map((it) => {
                  const active = isPrimaryNavItemActive(it.href);
                  const common = cn(
                    'inline-flex min-h-[44px] min-w-0 max-w-full items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-[var(--fn-shadow-sm)] transition-colors sm:px-4',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-surface)]',
                    active
                      ? 'border-[var(--fn-border)] bg-[var(--fn-surface-2)] text-[var(--fn-fg)]'
                      : 'border-[var(--fn-border)] bg-[var(--fn-surface)] text-[var(--fn-muted)] hover:bg-[var(--fn-surface-2)]',
                  );
                  return it.href.includes('#') ? (
                    <a key={it.id} href={it.href} className={common}>
                      {it.icon ? <span className="shrink-0 text-[var(--fn-muted-2)]">{it.icon}</span> : null}
                      <span className="truncate">{it.label}</span>
                    </a>
                  ) : (
                    <Link key={it.id} to={it.href} className={common}>
                      {it.icon ? <span className="shrink-0 text-[var(--fn-muted-2)]">{it.icon}</span> : null}
                      <span className="truncate">{it.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : null}
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

