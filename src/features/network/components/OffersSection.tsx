import { useLanguage } from '@/i18n/LanguageProvider';
import { getVisibleNeeds } from '../utils/memberCard';

export function OffersSection({ offers }: { offers: string[] }) {
  const { t } = useLanguage();
  const visible = getVisibleNeeds(offers, 2);
  const chips =
    visible.length > 0 ? visible : [t('network.memberCard.noStructuredOffer')];

  return (
    <div className="member-card__offersBlock">
      <p className="member-card__label">{t('network.memberCard.currentOffersLabel')}</p>
      <div className="member-card__chips member-card__chips--offers">
        {chips.map((offer, i) => (
          <span key={`${offer}-${i}`} className="member-card__chip member-card__chip--offer">
            {offer}
          </span>
        ))}
      </div>
    </div>
  );
}
