import React, { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';
import { TimePeriodProvider, useTimePeriod } from '@/contexts/TimePeriodContext';
import { useAdminStats, type PeriodKey } from '@/hooks/useAdminStats';
import { AdminHubNav } from '@/components/admin/AdminHubNav';
import { AdminPeriodPills } from '@/components/admin/AdminPeriodPills';
import { AdminActivityAndCompletionBlocks } from '@/components/admin/AdminActivityAndCompletionBlocks';
import { AdminRecommendedActionsBlock } from '@/components/admin/AdminRecommendedActionsBlock';
import { AdminConnectPriorityBlock } from '@/components/admin/AdminConnectPriorityBlock';
import { AdminTopActiveMembersBlock } from '@/components/admin/AdminTopActiveMembersBlock';
import '@/features/admin/admin-dashboard.css';

/**
 * Espace admin « interne » : contenu non public, distinct du tableau de bord (stats, demandes, etc.).
 */
export default function InternalAdminPage() {
  const { lang } = useLanguage();
  return (
    <TimePeriodProvider defaultPeriod="30d" uiLang={lang}>
      <InternalAdminContent />
    </TimePeriodProvider>
  );
}

function InternalAdminContent() {
  const { t, lang } = useLanguage();
  const location = useLocation();
  const { period } = useTimePeriod();
  const stats = useAdminStats(period as PeriodKey);

  useLayoutEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash, location.pathname]);

  return (
    <div className="admin-dashboard-page">
      <div className="admin-shell">
        <div className="admin-header">
          <div className="admin-header__copy">
            <h1 className="admin-header__title">{t('adminInternalTitle')}</h1>
            <p className="admin-header__text">{t('adminInternalLead')}</p>
          </div>
          <div className="admin-header__aside">
            <AdminHubNav />
            <AdminPeriodPills t={t} />
          </div>
        </div>
        <AdminActivityAndCompletionBlocks lang={lang} t={t} stats={stats} />
        <div className="mt-4">
          <AdminRecommendedActionsBlock stats={stats} />
        </div>
        <AdminConnectPriorityBlock stats={stats} lang={lang} t={t} />
        <AdminTopActiveMembersBlock stats={stats} lang={lang} t={t} />
      </div>
    </div>
  );
}
