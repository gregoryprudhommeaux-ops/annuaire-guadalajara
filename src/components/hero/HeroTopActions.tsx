import React from 'react';
import './hero-top-actions.css';

export type Locale = 'fr' | 'es' | 'en';

export type HeroTopActionsProps = {
  currentLocale: Locale;
  isAuthenticated: boolean;
  onChangeLocale: (locale: Locale) => void;
  onLogout: () => void;
  onLogin?: () => void;
  /** Ex. export PDF sur `/stats`, affiché à gauche de connexion / déconnexion. */
  leadingSlot?: React.ReactNode;
};

const LANGUAGES: { key: Locale; label: string }[] = [
  { key: 'fr', label: 'FR' },
  { key: 'es', label: 'ES' },
  { key: 'en', label: 'EN' },
];

export function HeroTopActions({
  isAuthenticated,
  onLogout,
  onLogin,
  leadingSlot,
}: HeroTopActionsProps) {
  return (
    <div className={leadingSlot ? 'hero-top-actions hero-top-actions--tight' : 'hero-top-actions'}>
      {/* Language switch : bandeau principal (AppHeader) ; pas de doublon ici. */}
      {leadingSlot}
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

