import React from 'react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';
import { FIRST_50_MEMBER_TARGET } from '../../constants';
import { trackEvent } from '@/lib/analytics';

export type First50MembersBannerProps = {
  currentCount: number;
  targetCount?: number;
  inviteUrl?: string;
  onInviteClick?: () => void;
  className?: string;
};

/**
 * Bandeau « premiers membres » — clés plates `first50*` dans `TRANSLATIONS` / `EN_STRINGS`
 * (aligné sur `home.first50` dans les decks `fr` / `es` / `EN`).
 */
export function First50MembersBanner({
  currentCount,
  targetCount = FIRST_50_MEMBER_TARGET,
  inviteUrl,
  onInviteClick,
  className,
}: First50MembersBannerProps) {
  const { t } = useTranslation();
  const safeTarget = Math.max(1, targetCount);
  const safeCurrent = Math.max(0, Math.min(currentCount, safeTarget));
  const progress = Math.round((safeCurrent / safeTarget) * 100);
  const showPrimaryCta = Boolean((inviteUrl && inviteUrl.trim()) || onInviteClick);

  const handleInviteClick = () => {
    trackEvent('home_invite_click', { source: 'first50_banner' });
    onInviteClick?.();
  };

  return (
    <section
      aria-labelledby="first50-title"
      className={cn(
        'rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm sm:p-6',
        className
      )}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            {t('first50Eyebrow')}
          </p>
          <h2
            id="first50-title"
            className="mt-2 text-xl font-semibold tracking-tight text-slate-900"
          >
            {t('first50Title')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{t('first50Description')}</p>
          <p className="mt-3 text-sm font-medium text-slate-900">{t('first50Subline')}</p>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-teal-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">{t('first50ProgressLabel')}</span>
            <span className="text-xl font-semibold text-slate-900">
              {safeCurrent}/{safeTarget}
            </span>
          </div>

          <div
            className="mt-3 h-2 rounded-full bg-teal-100"
            role="progressbar"
            aria-valuenow={safeCurrent}
            aria-valuemin={0}
            aria-valuemax={safeTarget}
            aria-label={t('first50ProgressLabel')}
          >
            <div
              className="h-2 rounded-full bg-teal-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {showPrimaryCta ? (
              inviteUrl?.trim() ? (
                <a
                  href={inviteUrl.trim()}
                  onClick={handleInviteClick}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
                >
                  {t('first50InviteCta')}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleInviteClick}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
                >
                  {t('first50InviteCta')}
                </button>
              )
            ) : null}
            <span className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm text-slate-600">
              {t('first50ValueLine')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default First50MembersBanner;
