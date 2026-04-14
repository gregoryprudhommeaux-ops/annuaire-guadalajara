import { useMemo } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/i18n/useTranslation';
import { FIRST_50_MEMBER_TARGET } from '@/constants';
import { trackEvent } from '@/lib/analytics';
import { getSignupJoinUrl } from '@/lib/siteUrls';

export type First50MembersBannerProps = {
  currentCount: number;
  targetCount?: number;
  inviteUrl?: string;
  onInviteClick?: () => void;
  className?: string;
  /**
   * Colonne latérale (~1/3 page) : empilement vertical, textes courts, pas de sous-cartes superposées.
   */
  narrow?: boolean;
};

/**
 * Bandeau « premiers membres » — clés `home.first50.*` (decks FR / ES / EN).
 */
export function First50MembersBanner({
  currentCount,
  targetCount = FIRST_50_MEMBER_TARGET,
  inviteUrl: inviteUrlProp,
  onInviteClick,
  className,
  narrow = false,
}: First50MembersBannerProps) {
  const { t } = useTranslation();
  const safeTarget = Math.max(1, targetCount);
  const safeCurrent = Math.max(0, Math.min(currentCount, safeTarget));
  const progress = Math.round((safeCurrent / safeTarget) * 100);
  const shareUrl = (inviteUrlProp && inviteUrlProp.trim()) || getSignupJoinUrl();

  const shareMessage = useMemo(
    () => t('inviteShareBody').replace(/\{url\}/g, shareUrl),
    [shareUrl, t]
  );
  const emailSubject = t('inviteEmailSubject');

  const handleInviteClick = () => {
    trackEvent('home_invite_click', { source: 'first50_banner' });
    onInviteClick?.();
  };

  const openWhatsApp = () => {
    trackEvent('home_invite_click', { source: 'first50_whatsapp' });
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank', 'noopener,noreferrer');
  };

  const openEmail = () => {
    trackEvent('home_invite_click', { source: 'first50_email' });
    window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareMessage)}`;
  };

  const tagline = t('home.first50.tagline');

  return (
    <section
      aria-labelledby="first50-title"
      className={cn(
        'flex min-h-0 w-full min-w-0 flex-col rounded-2xl border border-teal-200/90 bg-gradient-to-b from-teal-50/90 to-white p-5 shadow-sm sm:p-6',
        className
      )}
    >
      <header className="min-w-0 shrink-0 space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          {t('home.first50.eyebrow')}
        </p>
        <h2
          id="first50-title"
          className={cn(
            'font-semibold leading-snug tracking-tight text-slate-900 text-balance',
            narrow ? 'text-[15px] sm:text-base' : 'text-base sm:text-lg'
          )}
        >
          {t('home.first50.title')}
        </h2>
        <p className="text-xs leading-snug text-slate-600 text-pretty sm:text-[13px]">{tagline}</p>
      </header>

      <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-lg border border-teal-100 bg-white/80 p-4 shadow-sm">
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-5">
          <div className="min-w-0 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">{t('home.first50.progressLabel')}</span>
              <span className="text-lg font-semibold tabular-nums text-slate-900">
                {safeCurrent}/{safeTarget}
              </span>
            </div>

            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-teal-100"
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
          </div>

          <div className="min-w-0 shrink-0">
            <p className="text-[11px] font-medium leading-snug text-slate-600">
              {t('home.first50.inviteChannelsHint')}
            </p>
            <div
              className={cn(
                'mt-2.5 grid gap-2.5',
                narrow ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
              )}
            >
              <button
                type="button"
                onClick={openWhatsApp}
                className="inline-flex min-h-[2.5rem] w-full min-w-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 sm:text-sm"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                {t('home.first50.inviteWhatsappCta')}
              </button>
              <button
                type="button"
                onClick={openEmail}
                className="inline-flex min-h-[2.5rem] w-full min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 sm:text-sm"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                {t('home.first50.inviteEmailCta')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default First50MembersBanner;
