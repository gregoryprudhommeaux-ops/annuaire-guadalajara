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
      {/* Language switch lives in the global header (top-right). */}

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

