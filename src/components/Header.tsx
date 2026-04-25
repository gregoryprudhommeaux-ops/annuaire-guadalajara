/**
 * Header annuaire — DA : ombre légère, bordure basse.
 * Langue : icône globe + menu (LanguageSwitch) sur mobile et desktop, sauf doublon si géré ailleurs.
 */

import React from 'react';
import { cn } from '../cn';
import { guestCtaFullBleed, pageHeaderInner } from '../lib/pageLayout';
import type { Language } from '../types';
import siteFaviconUrl from '../../favicon.svg?url';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';

/** Même graphisme que le favicon (onglet du navigateur). */
function SiteLogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm',
        className
      )}
    >
      <img
        src={siteFaviconUrl}
        alt=""
        width={40}
        height={40}
        className="h-full w-full object-contain p-0.5"
        decoding="async"
      />
    </div>
  );
}

export type HeaderProps = {
  title: string;
  subtitle: string;
  /** Badge rouge (ex. profils à valider). */
  notificationCount?: number;
  /** Libellé accessibilité du lien d’accueil */
  homeAriaLabel: string;
  onHomeClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
  /** Connexion, actions admin, déconnexion, avatar… */
  trailing?: React.ReactNode;
  /** Si vrai, masque le switch langues desktop natif (pour le rendre dans `trailing`). */
  hideDesktopLanguageSwitch?: boolean;
  /**
   * Visiteur : sur mobile, bandeau bleu pleine largeur autour de `trailing` (sticky avec le logo).
   */
  guestMobileFullWidthCta?: boolean;
  /**
   * Aligné en haut à droite sur la même ligne que le titre (ex. admin : langues + logout + avatar).
   */
  topRight?: React.ReactNode;
  /**
   * Barre pleine largeur sous la ligne titre (ex. admin : 4 boutons sur toute la largeur du bandeau).
   */
  fullWidthRow?: React.ReactNode;
};

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  notificationCount = 0,
  homeAriaLabel,
  onHomeClick,
  lang,
  onLangChange,
  trailing,
  guestMobileFullWidthCta = false,
  hideDesktopLanguageSwitch = false,
  topRight,
  fullWidthRow,
}) => {
  const showBadge = Number.isFinite(notificationCount) && notificationCount > 0;
  const badgeText = notificationCount > 99 ? '99+' : String(notificationCount);

  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        'border-b border-slate-200 bg-white',
        'shadow-sm'
      )}
    >
      <div className={pageHeaderInner}>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="relative min-w-0 flex-1">
              <a
                href="/"
                onClick={onHomeClick}
                className={cn(
                  'flex min-w-0 cursor-pointer items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:pr-1',
                  /* Réserve d’espace seulement quand le sélecteur de langue est en overlay mobile (pas de topRight). */
                  !topRight && 'pr-[4.25rem]',
                  topRight && 'pr-1'
                )}
                aria-label={homeAriaLabel}
              >
                <div className="relative shrink-0">
                  <SiteLogoMark className="h-9 w-9 sm:h-10 sm:w-10 sm:rounded-xl" />
                  {showBadge ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
                      {badgeText}
                    </span>
                  ) : null}
                </div>
                <div className="h-7 w-px shrink-0 bg-slate-200 sm:h-8" aria-hidden />
                <div className="min-w-0 flex-1 leading-tight text-left">
                  <p className="text-sm font-semibold leading-snug tracking-tight text-slate-900 break-words sm:text-base md:text-lg">
                    {title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500 sm:line-clamp-none md:text-sm">
                    {subtitle}
                  </p>
                </div>
              </a>
              {/* Mobile uniquement, et seulement si la langue n’est pas déjà dans topRight (évite double globe + FR). */}
              {!topRight ? (
                <div className="absolute right-0 top-0 sm:hidden">
                  <LanguageSwitch value={lang} onChange={onLangChange} />
                </div>
              ) : null}
            </div>

            {topRight ? <div className="flex shrink-0 items-center gap-2">{topRight}</div> : null}
          </div>

          {fullWidthRow ? (
            <div className="relative z-[70] w-full min-w-0 pointer-events-auto">{fullWidthRow}</div>
          ) : null}

          {!fullWidthRow ? (
            <div
              className={cn(
                'flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end sm:gap-3',
                !guestMobileFullWidthCta && trailing && !hideDesktopLanguageSwitch && 'sm:shrink-0'
              )}
            >
              {!hideDesktopLanguageSwitch ? (
                <div className="hidden shrink-0 sm:block">
                  <LanguageSwitch value={lang} onChange={onLangChange} />
                </div>
              ) : null}
              {trailing ? (
                <div
                  className={cn(
                    'min-w-0 sm:flex sm:shrink-0 sm:items-center sm:justify-end',
                    guestMobileFullWidthCta &&
                      cn(
                        'flex justify-center border-t border-blue-800/25 bg-blue-700 px-3 py-1',
                        guestCtaFullBleed,
                        'sm:border-0 sm:bg-transparent sm:p-0'
                      ),
                    !guestMobileFullWidthCta &&
                      'flex flex-wrap items-center justify-end gap-2 pt-0.5 sm:justify-start sm:pt-0'
                  )}
                >
                  {trailing}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;
