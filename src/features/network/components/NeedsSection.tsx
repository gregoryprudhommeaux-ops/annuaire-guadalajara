import { useLanguage } from '@/i18n/LanguageProvider';
import { getVisibleNeeds } from '../utils/memberCard';

export function NeedsSection({ needs }: { needs: string[] }) {
  const { t } = useLanguage();
  const visible = getVisibleNeeds(needs, 3);
  const chips =
    visible.length > 0 ? visible : [t('network.memberCard.noStructuredNeed')];

  return (
    <div className="member-card__needsBlock">
      <p className="member-card__label">{t('network.memberCard.currentNeedsLabel')}</p>
      <div className="member-card__chips">
        {chips.map((need, i) => (
          <span key={`${need}-${i}`} className="member-card__chip">
            {need}
          </span>
        ))}
      </div>
    </div>
  );
}
