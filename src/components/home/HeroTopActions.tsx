import React from 'react';

export type Locale = 'fr' | 'es' | 'en';

export type HeroTopActionsProps = {
  currentLocale: Locale;
  isAuthenticated: boolean;
  onChangeLocale: (locale: Locale) => void;
  onLogout: () => void;
  onLogin?: () => void;
};

const LANGUAGES: { key: Locale; label: string }[] = [
  { key: 'fr', label: 'FR' },
  { key: 'es', label: 'ES' },
  { key: 'en', label: 'EN' },
];

export function HeroTopActions({
  currentLocale,
  isAuthenticated,
  onChangeLocale,
  onLogout,
  onLogin,
}: HeroTopActionsProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
      <div
        className="flex shrink-0 items-center overflow-hidden rounded-md border border-slate-200 bg-white divide-x divide-slate-200"
        role="group"
        aria-label="Choix de la langue"
      >
        {LANGUAGES.map((lang) => {
          const isActive = currentLocale === lang.key;
          return (
            <button
              key={lang.key}
              type="button"
              className={[
                'px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              ].join(' ')}
              onClick={() => onChangeLocale(lang.key)}
              aria-pressed={isActive}
            >
              {lang.label}
            </button>
          );
        })}
      </div>

      {isAuthenticated ? (
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-red-600"
          onClick={onLogout}
        >
          Se déconnecter
        </button>
      ) : (
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onLogin}
          disabled={!onLogin}
        >
          Se connecter
        </button>
      )}
    </div>
  );
}

