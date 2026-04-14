import { useMemo, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { pickLang } from '@/lib/uiLocale';
import { getSignupJoinUrl } from '@/lib/siteUrls';
import { trackEvent } from '@/lib/analytics';
import '../network.css';

export type LaunchProgressCardProps = {
  currentCount: number;
  targetCount: number;
  /** Si les URLs directes ne sont pas fournies, construites via `inviteUrl` + textes d’invitation. */
  inviteUrl?: string;
  whatsappUrl?: string;
  emailUrl?: string;
  defaultOpen?: boolean;
  className?: string;
};

export function LaunchProgressCard({
  currentCount,
  targetCount,
  inviteUrl,
  whatsappUrl,
  emailUrl,
  defaultOpen = false,
  className,
}: LaunchProgressCardProps) {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);

  const progress = Math.min(100, Math.round((currentCount / Math.max(targetCount, 1)) * 100));

  const { waHref, mailHref } = useMemo(() => {
    const base = (inviteUrl && inviteUrl.trim()) || getSignupJoinUrl();
    const body = t('inviteShareBody').replace(/\{url\}/g, base);
    const subj = t('inviteEmailSubject');
    return {
      waHref: whatsappUrl ?? `https://wa.me/?text=${encodeURIComponent(body)}`,
      mailHref: emailUrl ?? `mailto:?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`,
    };
  }, [inviteUrl, t, whatsappUrl, emailUrl]);

  const sectionAria = pickLang('Lancement du réseau', 'Lanzamiento de la red', 'Network launch', lang);
  const title = pickLang(
    `${currentCount} profils de référence — on avance ensemble`,
    `${currentCount} perfiles de referencia — avanzamos juntos`,
    `${currentCount} reference profiles — we move forward together`,
    lang
  );

  return (
    <section
      className={className ? `launch-card ${className}` : 'launch-card'}
      aria-label={sectionAria}
    >
      <button
        type="button"
        className="launch-card__toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div>
          <p className="launch-card__eyebrow">{t('home.first50.eyebrow')}</p>
          <h3 className="launch-card__title">{title}</h3>
        </div>

        <span className="launch-card__chevron" aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>

      {open ? (
        <div className="launch-card__content">
          <p className="launch-card__text">{t('home.first50.tagline')}</p>

          <div className="launch-card__progressRow">
            <span>{t('home.first50.progressLabel')}</span>
            <strong>
              {currentCount}/{targetCount}
            </strong>
          </div>

          <div className="launch-card__progressBar" aria-hidden="true">
            <div className="launch-card__progressValue" style={{ width: `${progress}%` }} />
          </div>

          <p className="launch-card__actionsLabel">{t('home.first50.inviteChannelsHint')}</p>

          <div className="launch-card__actions">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="launch-card__button launch-card__button--whatsapp"
              onClick={() => trackEvent('home_invite_click', { source: 'launch_progress_whatsapp' })}
            >
              {t('home.first50.inviteWhatsappCta')}
            </a>

            <a
              href={mailHref}
              className="launch-card__button launch-card__button--email"
              onClick={() => trackEvent('home_invite_click', { source: 'launch_progress_email' })}
            >
              {t('home.first50.inviteEmailCta')}
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
