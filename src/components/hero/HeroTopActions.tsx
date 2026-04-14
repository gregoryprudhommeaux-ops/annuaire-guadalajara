import React from 'react';
import './hero-top-actions.css';

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
    <div className="hero-top-actions">
      <div className="language-switcher" role="group" aria-label="Choix de la langue">
        {LANGUAGES.map((lang) => {
          const isActive = currentLocale === lang.key;
          return (
            <button
              key={lang.key}
              type="button"
              className={`lang-btn ${isActive ? 'active' : ''}`}
              onClick={() => onChangeLocale(lang.key)}
              aria-pressed={isActive}
            >
              {lang.label}
            </button>
          );
        })}
      </div>

      {isAuthenticated ? (
        <button type="button" className="account-btn logout-btn" onClick={onLogout}>
          Se déconnecter
        </button>
      ) : (
        <button
          type="button"
          className="account-btn login-btn"
          onClick={onLogin}
          disabled={!onLogin}
        >
          Se connecter
        </button>
      )}
    </div>
  );
}

