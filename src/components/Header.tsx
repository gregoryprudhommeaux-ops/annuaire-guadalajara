/**
 * Header annuaire — DA : ombre légère, bordure basse.
 * Mobile : langue = menu déroulant coin haut droite ; CTA invité = bandeau bleu pleine largeur (sticky avec le logo).
 * Desktop (sm+) : switch FR | ES | EN segmenté + trailing inline.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { cn } from '../cn';
import type { Language } from '../types';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

function LanguageDropdownMobile({
  lang,
  onLangChange,
}: {
  lang: Language;
  onLangChange: (lang: Language) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const others = LANGUAGES.filter((l) => l.code !== lang);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        {current.label}
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-slate-500 transition-transform', open && 'rotate-180')}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-[60] mt-1 min-w-[5.5rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {others.map(({ code, label }) => (
            <li key={code} role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => {
                  onLangChange(code);
                  setOpen(false);
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export type HeaderProps = {
  title: string;
  subtitle: string;
  /** Libellé accessibilité du lien d’accueil */
  homeAriaLabel: string;
  onHomeClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
  /** Connexion, actions admin, déconnexion, avatar… */
  trailing?: React.ReactNode;
  /**
   * Visiteur : sur mobile, bandeau bleu pleine largeur autour de `trailing` (sticky avec le logo).
   */
  guestMobileFullWidthCta?: boolean;
};

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  homeAriaLabel,
  onHomeClick,
  lang,
  onLangChange,
  trailing,
  guestMobileFullWidthCta = false,
}) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        'border-b border-slate-200 bg-white',
        'shadow-sm'
      )}
    >
      <div className="mx-auto min-w-0 max-w-7xl px-4 py-3 md:px-6 lg:px-8">
        {/* sm:flex-wrap : si la barre admin + langue dépassent, passage à la ligne sans écraser le titre.
            Compte admin : ne pas mettre min-w-0 sur ce bloc — sinon flex-1 le comprime à ~0 et break-words casse lettre par lettre. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-3">
          <div className="relative w-full flex-1 min-w-[12rem] sm:min-w-[14rem] md:min-w-[16rem]">
            <a
              href="/"
              onClick={onHomeClick}
              className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg pr-[4.25rem] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:pr-1"
              aria-label={homeAriaLabel}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-md sm:h-10 sm:w-10 sm:rounded-xl">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
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
            <div className="absolute right-0 top-0 sm:hidden">
              <LanguageDropdownMobile lang={lang} onLangChange={onLangChange} />
            </div>
          </div>

          {/* Langue + trailing : une seule zone pour éviter les doublons */}
          <div
            className={cn(
              'flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3',
              !guestMobileFullWidthCta && trailing && 'sm:shrink-0'
            )}
          >
            <div className="hidden items-center overflow-hidden rounded-md border border-slate-200 divide-x divide-slate-200 sm:flex">
              {LANGUAGES.map(({ code, label }) => {
                const isActive = lang === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onLangChange(code)}
                    aria-pressed={isActive}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {trailing ? (
              <div
                className={cn(
                  'min-w-0 sm:flex sm:items-center',
                  guestMobileFullWidthCta &&
                    '-mx-4 flex w-[calc(100%+2rem)] justify-center border-t border-blue-800/25 bg-blue-700 px-3 py-1 sm:mx-0 sm:w-auto sm:border-0 sm:bg-transparent sm:p-0',
                  !guestMobileFullWidthCta &&
                    'flex flex-wrap items-center justify-end gap-2 pt-0.5 sm:justify-start sm:pt-0'
                )}
              >
                {trailing}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
