import type { MouseEvent } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { getVisibleNeeds } from '../utils/memberCard';

export function NeedsSection({
  needs,
  freeNeedTexts = [],
  onShareWhatsApp,
  onShareEmail,
}: {
  needs: string[];
  /** Textes libres (lookingFor / networkGoal / communityGap). */
  freeNeedTexts?: string[];
  /** Partage WhatsApp du besoin (sans contact) — stopPropagation géré ici. */
  onShareWhatsApp?: () => void;
  /** Admin : partage e-mail (mailto) — stopPropagation géré ici. */
  onShareEmail?: () => void;
}) {
  const { t } = useLanguage();
  const visible = getVisibleNeeds(needs, 3);
  const freeVisible = freeNeedTexts.map((s) => s.trim()).filter(Boolean).slice(0, 2);
  const hasContent = visible.length > 0 || freeVisible.length > 0;
  const hasShare = Boolean(onShareWhatsApp || onShareEmail);

  const stopAndRun = (e: MouseEvent, fn?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    fn?.();
  };

  return (
    <div className="member-card__needsBlock">
      <div className="member-card__needsHeader">
        <p className="member-card__label">{t('network.memberCard.currentNeedsLabel')}</p>
        {hasContent && hasShare ? (
          <div className="member-card__shareNeedGroup">
            {onShareEmail ? (
              <button
                type="button"
                className="member-card__shareNeed member-card__shareNeed--email"
                onClick={(e) => stopAndRun(e, onShareEmail)}
                onKeyDown={(e) => e.stopPropagation()}
                aria-label={t('directoryShareNeedEmail')}
                title={t('directoryShareNeedEmail')}
              >
                <Mail size={14} aria-hidden />
                <span>{t('directoryShareNeedEmailShort')}</span>
              </button>
            ) : null}
            {onShareWhatsApp ? (
              <button
                type="button"
                className="member-card__shareNeed"
                onClick={(e) => stopAndRun(e, onShareWhatsApp)}
                onKeyDown={(e) => e.stopPropagation()}
                aria-label={t('directoryShareNeedWhatsApp')}
                title={t('directoryShareNeedWhatsApp')}
              >
                <MessageCircle size={14} aria-hidden />
                <span>{t('directoryShareNeedWhatsAppShort')}</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {!hasContent ? (
        <div className="member-card__chips">
          <span className="member-card__chip member-card__chip--empty">
            {t('network.memberCard.noStructuredNeed')}
          </span>
        </div>
      ) : (
        <div className="member-card__needsContent">
          {visible.length > 0 ? (
            <div className="member-card__chips">
              {visible.map((need, i) => (
                <span key={`${need}-${i}`} className="member-card__chip">
                  {need}
                </span>
              ))}
            </div>
          ) : null}
          {freeVisible.map((text) => (
            <p key={text.slice(0, 48)} title={text} className="member-card__needText">
              {text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
