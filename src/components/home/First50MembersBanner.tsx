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

          <p className="text-xs font-medium text-slate-600">{t('home.first50.inviteChannelsHint')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={openWhatsApp}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              {t('home.first50.inviteWhatsappCta')}
            </button>
            <button
              type="button"
              onClick={openEmail}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {t('home.first50.inviteEmailCta')}
            </button>
          </div>
          {shareUrl ? (
            <a
              href={shareUrl}
              onClick={handleInviteClick}
              className="block text-center text-xs font-medium text-teal-800 underline-offset-2 hover:text-teal-950 hover:underline"
            >
              {t('home.first50.inviteLinkCta')}
            </a>
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
