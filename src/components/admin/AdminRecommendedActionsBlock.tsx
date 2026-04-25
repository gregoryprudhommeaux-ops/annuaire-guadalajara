import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminStats } from '@/hooks/useAdminStats';
import { useAdminRecommendations, type AdminRecommendedPayload } from '@/hooks/useAdminRecommendations';
import { useLanguage } from '@/i18n/LanguageProvider';
import { pickLang } from '@/lib/uiLocale';
import {
  queueAdminDashboardScroll,
  queueAdminDashboardAffinity,
} from '@/lib/adminClientBridge';

const SCROLL_IN_PAGE_ON_INTERNAL = new Set([
  'admin-section-completion',
  'admin-section-active-members',
  'admin-section-connect',
]);

/**
 * Bloc « Actions recommandées » (P1 / P2) sur `/admin/internal` ; CTA vers `/admin` (file d’attente + scroll) ou scroll in-page (complétion, membres actifs, connexions prioritaires, etc.).
 */
export function AdminRecommendedActionsBlock({ stats }: { stats: AdminStats }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { primaryRecommended, secondaryRecommended } = useAdminRecommendations(stats, lang);

  const runRecommendedAction = useCallback(
    (payload: AdminRecommendedPayload) => {
      if (payload.type === 'affinity') {
        queueAdminDashboardAffinity(payload.cross);
        navigate('/admin');
        return;
      }
      if (payload.type === 'route') {
        navigate(payload.to);
        return;
      }
      if (payload.type === 'scroll') {
        if (SCROLL_IN_PAGE_ON_INTERNAL.has(payload.id)) {
          requestAnimationFrame(() => {
            document.getElementById(payload.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          return;
        }
        queueAdminDashboardScroll(payload.id);
        navigate('/admin');
        return;
      }
    },
    [navigate]
  );

  const onNeedsAndRequests = useCallback(() => {
    queueAdminDashboardScroll('admin-section-priority');
    navigate('/admin');
  }, [navigate]);

  if (stats.loading) {
    return <p className="admin-card text-sm text-slate-500">{t('loading')}</p>;
  }
  if (stats.error) {
    return (
      <p className="admin-card text-sm" style={{ color: 'rgb(180 83 9)' }}>
        {stats.error}
      </p>
    );
  }

  return (
    <article className="admin-chart-card admin-recommended-actions" id="admin-section-recommended">
      <div className="admin-recommended-actions__head">
        <div>
          <p className="admin-chart-card__title admin-recommended-actions__title">
            {pickLang('Actions recommandées', 'Acciones recomendadas', 'Recommended actions', lang)}
          </p>
          <p className="admin-chart-card__subtitle admin-recommended-actions__subtitle">
            {pickLang(
              'Signaux forts du tableau de bord, par ordre d’impact.',
              'Señales claras del panel, por impacto.',
              'High-impact signals from your dashboard, in order.',
              lang
            )}{' '}
            <button
              type="button"
              className="admin-recommended-actions__inline-action"
              onClick={onNeedsAndRequests}
              title={pickLang(
                'Aller aux besoins sans réponse et dernières demandes.',
                'Ir a necesidades sin respuesta y últimas solicitudes.',
                'Jump to unanswered needs and latest requests.',
                lang
              )}
            >
              {pickLang('Besoins & demandes', 'Necesidades y solicitudes', 'Needs & requests', lang)}
            </button>
          </p>
        </div>
      </div>
      <div className="admin-recommended-actions__body">
        {primaryRecommended.length === 0 && secondaryRecommended.length === 0 ? (
          <p className="admin-recommended-actions__empty">
            {pickLang(
              'Pas assez de données pour proposer des actions sur cette période.',
              'Datos insuficientes para acciones en este periodo.',
              'Not enough data to suggest actions for this period.',
              lang
            )}
          </p>
        ) : (
          <>
            <div className="admin-rec-tier">
              <p
                className="admin-rec-tier__label"
                aria-label={pickLang('Priorité 1', 'Prioridad 1', 'Priority 1', lang)}
              >
                {pickLang('P1 — À traiter maintenant', 'P1 — Ahora', 'P1 — Address now', lang)}
              </p>
              <ul className="admin-recommended-actions__grid admin-recommended-actions__grid--primary">
                {primaryRecommended.map((item) => (
                  <li key={item.key} className="admin-rec-card admin-rec-card--primary">
                    <p className="admin-rec-card__title">{item.title}</p>
                    <p className="admin-rec-card__signal">{item.signal}</p>
                    <p className="admin-rec-card__context">{item.context}</p>
                    <button
                      type="button"
                      className={
                        item.ctaEmphasis
                          ? 'admin-rec-card__action admin-rec-card__action--emphasis'
                          : 'admin-rec-card__action'
                      }
                      onClick={() => runRecommendedAction(item.payload)}
                    >
                      {item.ctaLabel}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {secondaryRecommended.length > 0 ? (
              <div className="admin-rec-tier admin-rec-tier--secondary">
                <p
                  className="admin-rec-tier__label"
                  aria-label={pickLang('Priorité 2', 'Prioridad 2', 'Priority 2', lang)}
                >
                  {pickLang('P2 — Ensuite', 'P2 — Después', 'P2 — Next', lang)}
                </p>
                <ul className="admin-recommended-actions__grid admin-recommended-actions__grid--secondary">
                  {secondaryRecommended.map((item) => (
                    <li key={item.key} className="admin-rec-card admin-rec-card--secondary">
                      <p className="admin-rec-card__title">{item.title}</p>
                      <p className="admin-rec-card__signal">{item.signal}</p>
                      <p className="admin-rec-card__context">{item.context}</p>
                      <button
                        type="button"
                        className={
                          item.ctaEmphasis
                            ? 'admin-rec-card__action admin-rec-card__action--emphasis'
                            : 'admin-rec-card__action'
                        }
                        onClick={() => runRecommendedAction(item.payload)}
                      >
                        {item.ctaLabel}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
