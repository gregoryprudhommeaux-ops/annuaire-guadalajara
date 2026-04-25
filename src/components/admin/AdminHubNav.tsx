import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';

/**
 * Raccourcis admin : vitrine publique (stats) et bascule Pilotage ↔ Internal.
 */
export function AdminHubNav() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const isInternal = pathname === '/admin/internal';

  return (
    <div className="admin-header__actions">
      <Link
        to="/stats"
        className="admin-pill"
        style={{ textDecoration: 'none', minHeight: 32 }}
      >
        {t('adminVitrineLink')}
      </Link>
      {isInternal ? (
        <Link
          to="/admin"
          className="admin-pill"
          style={{ textDecoration: 'none', minHeight: 32 }}
        >
          {t('adminBackToDashboard')}
        </Link>
      ) : (
        <Link
          to="/admin/internal"
          className="admin-pill"
          style={{ textDecoration: 'none', minHeight: 32 }}
        >
          {t('adminInternalTab')}
        </Link>
      )}
    </div>
  );
}
