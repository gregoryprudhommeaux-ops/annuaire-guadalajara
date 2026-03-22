/**
 * Header annuaire — DA : ombre légère, bordure basse, séparateur logo / texte,
 * switcher de langue à contraste élevé (actif blue-600).
 */

import React from 'react';
import { Building2 } from 'lucide-react';
import type { Language } from '../types';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
];

export type HeaderProps = {
  title: string;
  subtitle: string;
  /** Libellé accessibilité du lien d’accueil */
  homeAriaLabel: string;
  onHomeClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
  /** Zone à droite du switcher : connexion, actions admin, déconnexion, avatar… */
  trailing?: React.ReactNode;
};

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  homeAriaLabel,
  onHomeClick,
  lang,
  onLangChange,
  trailing,
}) => {
  return (
    <header
      className={[
        'sticky top-0 z-50',
        'border-b border-slate-200 bg-white',
        'shadow-sm',
      ].join(' ')}
    >
      <div className="mx-auto flex min-w-0 max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-6 lg:px-8">
        {/* Logo + titre */}
        <a
          href="/"
          onClick={onHomeClick}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg pr-1 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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

        {/* Langue + actions */}
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-3 sm:shrink-0">
          <div className="flex items-center overflow-hidden rounded-md border border-slate-200 divide-x divide-slate-200">
            {LANGUAGES.map(({ code, label }) => {
              const isActive = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onLangChange(code)}
                  aria-pressed={isActive}
                  className={[
                    'px-3 py-1.5 text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {trailing}
        </div>
      </div>
    </header>
  );
};

export default Header;
