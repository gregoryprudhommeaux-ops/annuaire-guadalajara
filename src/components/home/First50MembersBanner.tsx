import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';
import { FIRST_50_MEMBER_TARGET } from '@/constants';
import { trackEvent } from '@/lib/analytics';

export type First50MembersBannerProps = {
  currentCount: number;
  targetCount?: number;
  inviteUrl?: string;
  onInviteClick?: () => void;
  className?: string;
};

/**
 * Bandeau « premiers membres » — clés `home.first50.*` (decks FR / ES / EN).
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
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0 max-w-2xl flex-1 lg:py-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            {t('home.first50.eyebrow')}
          </p>
          <h2
            id="first50-title"
            className="mt-2 text-xl font-semibold tracking-tight text-slate-900"
          >
            {t('home.first50.title')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{t('home.first50.description')}</p>
          <p className="mt-3 text-sm font-medium leading-snug text-slate-900">
            {t('home.first50.subline')}
          </p>
        </div>

        <div className="flex w-full max-w-sm shrink-0 flex-col gap-4 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-slate-600">{t('home.first50.progressLabel')}</span>
            <span className="text-xl font-semibold tabular-nums text-slate-900">
              {safeCurrent}/{safeTarget}
            </span>
          </div>

          <div
            className="h-2.5 overflow-hidden rounded-full bg-teal-100"
            role="progressbar"
            aria-valuenow={safeCurrent}
            aria-valuemin={0}
            aria-valuemax={safeTarget}
            aria-label={t('home.first50.progressLabel')}
          >
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {showPrimaryCta ? (
            inviteUrl?.trim() ? (
              <a
                href={inviteUrl.trim()}
                onClick={handleInviteClick}
                className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-800"
              >
                {t('home.first50.inviteCta')}
              </a>
            ) : (
              <button
                type="button"
                onClick={handleInviteClick}
                className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-800"
              >
                {t('home.first50.inviteCta')}
              </button>
            )
          ) : null}

          <p className="flex min-h-[4.5rem] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm leading-snug text-slate-600 text-balance">
            {t('home.first50.valueLine')}
          </p>
        </div>
      </div>
    </section>
  );
}

export default First50MembersBanner;
